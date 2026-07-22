const Integration = require('../../models/Integration');
const Lead = require('../../models/Lead');
const WhatsAppAccount = require('../../models/WhatsAppAccount');
const { LEAD_SOURCE } = require('../../constants');
const axios = require('axios');

const createOrUpdateIntegration = async (data) => {
    // Logic to save Zoho integration in DB
    return await Integration.findOneAndUpdate(
        { companyId: data.companyId, provider: 'zoho' },
        data,
        { new: true, upsert: true }
    );
};

const getIntegration = async (companyId) => {
    return await Integration.findOne({ companyId, provider: 'zoho' });
};

const importLeads = async (companyId) => {
    try {
        const integration = await getIntegration(companyId);
        
        if (!integration || !integration.connected || !integration.accessToken) {
            throw new Error('Zoho integration is not connected or missing access token');
        }
        
        // Find a default WhatsApp account for the company to associate leads
        const defaultWaAccount = await WhatsAppAccount.findOne({ companyId });
        if (!defaultWaAccount) {
            console.warn(`No WhatsApp account found for company ${companyId}. Leads will require manual assignment later if schema demands it.`);
            // If whatsappAccountId is absolutely required by schema, we must throw error. We'll attempt to proceed or throw if strictly needed.
            // Currently it is required, so we might fail on saving unless handled. 
            // We will proceed and let mongoose throw if needed, or we throw cleanly here.
            throw new Error('Please connect a WhatsApp account first before syncing leads.');
        }

        const accessToken = integration.accessToken;
        
        // Fetch Leads from Zoho (v3 CRM API)
        const response = await axios.get('https://www.zohoapis.in/crm/v3/Leads', {
            headers: {
                Authorization: `Zoho-oauthtoken ${accessToken}`
            }
        });
        
        const zohoLeads = response.data.data;
        if (!zohoLeads || zohoLeads.length === 0) {
            return { message: 'No leads found in Zoho' };
        }
        
        let imported = 0;
        let updated = 0;
        
        for (const zohoLead of zohoLeads) {
            const zohoLeadId = zohoLead.id;
            const firstName = zohoLead.First_Name || '';
            const lastName = zohoLead.Last_Name || '';
            const fullName = `${firstName} ${lastName}`.trim() || 'Unknown Zoho Lead';
            const email = zohoLead.Email || '';
            const phone = zohoLead.Phone || zohoLead.Mobile || '';
            
            if (!phone) {
                // Phone is usually required in WhatsApp CRM. Skip if missing.
                continue;
            }
            
            // Check if lead exists
            const existingLead = await Lead.findOne({ 
                companyId, 
                $or: [
                    { zohoLeadId },
                    { phone }
                ]
            });
            
            if (existingLead) {
                // Update
                existingLead.zohoLeadId = zohoLeadId;
                if (!existingLead.name) existingLead.name = fullName;
                if (!existingLead.email && email) existingLead.email = email;
                if (existingLead.source !== LEAD_SOURCE.ZOHO) existingLead.source = LEAD_SOURCE.ZOHO;
                
                await existingLead.save();
                updated++;
            } else {
                // Insert
                await Lead.create({
                    companyId,
                    whatsappAccountId: defaultWaAccount._id,
                    zohoLeadId,
                    name: fullName,
                    email: email,
                    phone: phone,
                    source: LEAD_SOURCE.ZOHO,
                    status: 'New'
                });
                imported++;
            }
        }
        
        return { message: `Sync complete. Imported: ${imported}, Updated: ${updated}` };
        
    } catch (error) {
        console.error('Error importing Zoho leads:', error.response ? error.response.data : error.message);
        throw error;
    }
};

module.exports = {
    createOrUpdateIntegration,
    getIntegration,
    importLeads
};
