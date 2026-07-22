const Integration = require('../../models/Integration');

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

module.exports = {
    createOrUpdateIntegration,
    getIntegration
};
