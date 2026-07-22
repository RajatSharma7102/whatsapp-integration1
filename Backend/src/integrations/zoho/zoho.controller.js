const zohoService = require('./zoho.service');
const zohoOauth = require('./zoho.oauth');

const Integration = require('../../models/Integration');

const getStatus = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const integration = await Integration.findOne({ companyId, provider: "zoho" });
        
        if (integration && integration.connected) {
            return res.status(200).json({
                connected: true,
                provider: "zoho",
                organizationId: integration.organizationId || "N/A",
                accountName: integration.accountName || "Unknown Org",
                connectedAt: integration.createdAt || new Date(),
                integration: integration
            });
        }
        
        return res.status(200).json({ connected: false });
    } catch (error) {
        console.error('Error getting Zoho status:', error);
        res.status(500).json({ message: 'Failed to fetch Zoho status' });
    }
};

const disconnect = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        await Integration.findOneAndDelete({ companyId, provider: "zoho" });
        res.status(200).json({ message: 'Zoho disconnected successfully' });
    } catch (error) {
        console.error('Error disconnecting Zoho:', error);
        res.status(500).json({ message: 'Failed to disconnect Zoho' });
    }
};

const syncData = async (req, res) => {
    // Trigger manual sync
    res.status(200).json({ message: 'Sync started' });
};

module.exports = {
    getStatus,
    disconnect,
    syncData,
    oauthConnect: zohoOauth.connect,
    oauthCallback: zohoOauth.callback
};
