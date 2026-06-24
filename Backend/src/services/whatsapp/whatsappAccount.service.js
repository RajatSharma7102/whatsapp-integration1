const WhatsAppAccount = require('../../models/WhatsAppAccount');
const logger = require('../../config/logger');

/**
 * Get all connected WhatsApp Accounts for a company
 */
const getAccountsByCompanyId = async (companyId) => {
  return await WhatsAppAccount.find({ companyId }).sort({ createdAt: -1 });
};

/**
 * Get a specific WhatsApp Account by its phoneNumberId
 */
const getAccountByPhoneNumberId = async (phoneNumberId) => {
  return await WhatsAppAccount.findOne({ phoneNumberId });
};

/**
 * Create or update a WhatsApp Account from Embedded Signup
 */
const connectAccount = async (companyId, payload) => {
  const { waba_id, access_token, phone_number_id, display_name, phone_number } = payload;
  
  // Note: The pre('save') hook in the WhatsAppAccount model will handle encrypting the accessToken
  const whatsappAccount = await WhatsAppAccount.findOneAndUpdate(
    { phoneNumberId: phone_number_id },
    {
      companyId,
      displayName: display_name || 'Main Support Number',
      phoneNumber: phone_number || '0000000000',
      businessAccountId: waba_id,
      accessToken: access_token,
      isDefault: true,
      status: 'CONNECTED',
    },
    { new: true, upsert: true }
  );
  
  logger.info(`WhatsApp Account connected: ${phone_number} for company ${companyId}`);
  return whatsappAccount;
};

module.exports = {
  getAccountsByCompanyId,
  getAccountByPhoneNumberId,
  connectAccount,
};
