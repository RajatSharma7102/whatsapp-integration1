const axios = require('axios');
const zohoService = require('./zoho.service');

const connect = async (req, res) => {
    try {
        const clientId = process.env.ZOHO_CLIENT_ID;
        const redirectUri = process.env.ZOHO_REDIRECT_URI;
        const scope = 'ZohoCRM.modules.ALL,ZohoCRM.org.ALL,ZohoCRM.users.ALL,ZohoCRM.settings.ALL'; // Adjust scopes as needed
        if (!req.user || !req.user.companyId) {
            return res.status(401).json({ message: 'User company not found' });
        }
        
        const state = req.user.companyId.toString();
        
        console.log("========== ZOHO CONNECT ==========");
        console.log("req.user:", req.user);
        console.log("companyId:", req.user.companyId);
        console.log("state:", state);
        console.log("==================================");
        
        const authUrl = `https://accounts.zoho.in/oauth/v2/auth?scope=${scope}&client_id=${clientId}&response_type=code&access_type=offline&redirect_uri=${redirectUri}&state=${state}`;
        
        res.status(200).json({ authUrl });
    } catch (error) {
        console.error('Zoho connect error:', error);
        res.status(500).json({ message: 'Failed to initiate Zoho connection' });
    }
};

const callback = async (req, res) => {
    try {
        const { code, state, location } = req.query;
        
        if (!code) {
            return res.status(400).json({ message: 'Authorization code is missing' });
        }
        
        const clientId = process.env.ZOHO_CLIENT_ID;
        const clientSecret = process.env.ZOHO_CLIENT_SECRET;
        const redirectUri = process.env.ZOHO_REDIRECT_URI;
        
        // Exchange code for tokens
        // Note: The accounts URL might depend on the DC (e.g., .in, .com, .eu). We'll use the one from accounts-server if available or fallback to .in
        const accountsUrl = req.query['accounts-server'] || 'https://accounts.zoho.in';
        
        const tokenResponse = await axios.post(`${accountsUrl}/oauth/v2/token`, null, {
            params: {
                grant_type: 'authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                code: code
            }
        });
        
        const { access_token, refresh_token, expires_in } = tokenResponse.data;
        
        if (access_token) {
            // Save to DB
            if (!state || state === 'undefined') {
                throw new Error("Missing companyId in state parameter");
            }
            const companyId = state;
            
            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
            
            // Try to fetch organization details
            let organizationId = "Unknown";
            let accountName = "Unknown Org";
            
            try {
                // Infer API domain from accountsUrl (e.g. https://accounts.zoho.in -> https://www.zohoapis.in)
                const apiDomain = accountsUrl.replace('accounts.zoho', 'www.zohoapis');
                const orgResponse = await axios.get(`${apiDomain}/crm/v3/org`, {
                    headers: {
                        Authorization: `Zoho-oauthtoken ${access_token}`
                    }
                });
                
                if (orgResponse.data && orgResponse.data.org && orgResponse.data.org.length > 0) {
                    const orgData = orgResponse.data.org[0];
                    organizationId = orgData.zgid || orgData.id || "Unknown";
                    accountName = orgData.company_name || "Unknown Org";
                }
            } catch (orgError) {
                console.error("\n========== ZOHO ORG FETCH ERROR ==========");
                console.error("Failed to fetch Zoho org details:", orgError.response ? JSON.stringify(orgError.response.data, null, 2) : orgError.message);
                console.error("==========================================\n");
                // Non-fatal error, we still save the integration
            }
            
            await zohoService.createOrUpdateIntegration({
                companyId,
                provider: 'zoho',
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresAt,
                organizationId,
                accountName,
                connected: true
            });
            
            // Trigger lead import asynchronously to not block the redirect
            zohoService.importLeads(companyId).catch(err => {
                console.error("Async Zoho lead import failed:", err.message);
            });
            
            // Redirect back to frontend settings page
            const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            res.redirect(`${frontendUrl}/settings?zoho_connected=true`);
        } else {
            res.status(400).json({ message: 'Failed to obtain access token', details: tokenResponse.data });
        }
    } catch (error) {
        const errorDetails = error.response ? error.response.data : error.message;
        console.error('\n================ ZOHO OAUTH ERROR ================');
        console.error('Error Details:', JSON.stringify(errorDetails, null, 2));
        console.error('Request Query:', JSON.stringify(req.query, null, 2));
        console.error('==================================================\n');
        
        res.status(500).json({ 
            message: 'Failed to process Zoho callback', 
            error: errorDetails,
            query: req.query
        });
    }
};

module.exports = {
    connect,
    callback
};
