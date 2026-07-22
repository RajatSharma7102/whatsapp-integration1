const zohoService = require('./zoho.service');
const zohoOauth = require('./zoho.oauth');

const getStatus = async (req, res) => {
    // Get Zoho integration status
    res.status(200).json({ status: 'connected' });
};

const syncData = async (req, res) => {
    // Trigger manual sync
    res.status(200).json({ message: 'Sync started' });
};

module.exports = {
    getStatus,
    syncData,
    oauthConnect: zohoOauth.connect,
    oauthCallback: zohoOauth.callback
};
