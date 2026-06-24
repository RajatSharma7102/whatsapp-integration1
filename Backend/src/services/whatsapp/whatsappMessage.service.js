const axios = require('axios');
const logger = require('../../config/logger');
const { decryptToken } = require('../../utils/crypto');

const getHeaders = (whatsappAccount) => {
  const decryptedToken = decryptToken(whatsappAccount.accessToken);
  return {
    'Authorization': `Bearer ${decryptedToken}`,
    'Content-Type': 'application/json',
  };
};

const getApiUrl = (whatsappAccount) => `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v25.0'}/${whatsappAccount.phoneNumberId}/messages`;

/**
 * Send a plain text message
 */
const sendTextMessage = async (whatsappAccount, phone, message) => {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'text',
      text: { preview_url: false, body: message },
    };

    const response = await axios.post(getApiUrl(whatsappAccount), payload, { headers: getHeaders(whatsappAccount) });
    logger.msgSuccess(`WhatsApp text message sent to ${phone}. MsgID: ${response.data?.messages?.[0]?.id}`);
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    logger.msgFail(`Failed to send WhatsApp text to ${phone}`, errMsg);
    throw new Error(`WhatsApp API error: ${errMsg}`);
  }
};

/**
 * Send a template message
 */
const sendTemplateMessage = async (whatsappAccount, phone, templateName, languageCode = 'en_US', components = []) => {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    };

    const response = await axios.post(getApiUrl(whatsappAccount), payload, { headers: getHeaders(whatsappAccount) });
    logger.msgSuccess(`WhatsApp template '${templateName}' sent to ${phone}`);
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    logger.msgFail(`Failed to send template to ${phone}`, errMsg);
    throw new Error(`WhatsApp API error: ${errMsg}`);
  }
};

/**
 * Mark a received message as read
 */
const markMessageAsRead = async (whatsappAccount, messageId) => {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };

    const response = await axios.post(getApiUrl(whatsappAccount), payload, { headers: getHeaders(whatsappAccount) });
    logger.debug(`Message ${messageId} marked as read`);
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    logger.warn(`Failed to mark message ${messageId} as read: ${errMsg}`);
  }
};

/**
 * Send a reaction to a message
 */
const sendReaction = async (whatsappAccount, phone, messageId, emoji) => {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'reaction',
      reaction: { message_id: messageId, emoji },
    };
    const response = await axios.post(getApiUrl(whatsappAccount), payload, { headers: getHeaders(whatsappAccount) });
    return response.data;
  } catch (error) {
    logger.warn(`Failed to send reaction: ${error.message}`);
  }
};

/**
 * Send an interactive button message (max 3 buttons)
 */
const sendButtonMessage = async (whatsappAccount, phone, bodyText, buttons) => {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.map((btn, i) => ({
            type: 'reply',
            reply: { id: btn.id || `btn_${i}`, title: btn.title }
          }))
        }
      }
    };
    const response = await axios.post(getApiUrl(whatsappAccount), payload, { headers: getHeaders(whatsappAccount) });
    logger.msgSuccess(`WhatsApp interactive buttons sent to ${phone}`);
    return response.data;
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    logger.msgFail(`Failed to send buttons to ${phone}`, errMsg);
    throw new Error(`WhatsApp API error: ${errMsg}`);
  }
};

module.exports = {
  sendTextMessage,
  sendTemplateMessage,
  sendButtonMessage,
  markMessageAsRead,
  sendReaction,
};
