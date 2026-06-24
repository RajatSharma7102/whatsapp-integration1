const Lead = require('../models/Lead');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const WhatsAppAccount = require('../models/WhatsAppAccount');
const whatsappMessageService = require('../services/whatsapp/whatsappMessage.service');
const whatsappAccountService = require('../services/whatsapp/whatsappAccount.service');
const { getIO } = require('../sockets/socketManager');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { SOCKET_EVENTS, MESSAGE_DIRECTION, MESSAGE_STATUS } = require('../constants');
const logger = require('../config/logger');

const sendMessage = async (req, res, next) => {
  try {
    const { leadId, message } = req.body;

    // 1. Find lead
    const lead = await Lead.findOne({ _id: leadId, companyId: req.companyId });
    if (!lead) return sendError(res, 'Lead not found or does not belong to your workspace.', 404);

    // 2. Fetch WhatsApp Account
    const whatsappAccount = await WhatsAppAccount.findById(lead.whatsappAccountId);
    if (!whatsappAccount) return sendError(res, 'WhatsApp Account not found for this lead.', 404);

    // 3. Send WhatsApp message
    const waResponse = await whatsappMessageService.sendTextMessage(whatsappAccount, lead.phone, message);
    const waMessageId = waResponse?.messages?.[0]?.id;

    // 4. Find or create conversation
    let conversation = await Conversation.findOne({ leadId });
    if (!conversation) {
      conversation = await Conversation.create({ 
        companyId: whatsappAccount.companyId,
        whatsappAccountId: whatsappAccount._id,
        leadId 
      });
    }

    // 5. Save message to DB
    const savedMessage = await Message.create({
      companyId: whatsappAccount.companyId,
      whatsappAccountId: whatsappAccount._id,
      conversationId: conversation._id,
      leadId,
      direction: MESSAGE_DIRECTION.OUTGOING,
      messageType: 'text',
      message,
      messageId: waMessageId,
      status: MESSAGE_STATUS.SENT,
      sentAt: new Date(),
    });

    // 5. Update conversation
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: message,
      lastMessageAt: new Date(),
    });

    // 6. Emit Socket.IO event
    const io = getIO();
    if (io) {
      io.emit(SOCKET_EVENTS.NEW_MESSAGE, {
        conversationId: conversation._id,
        leadId,
        message: savedMessage,
      });
      io.emit(SOCKET_EVENTS.CONVERSATION_UPDATED, {
        conversationId: conversation._id,
        leadId,
        lastMessage: message,
        lastMessageAt: new Date(),
      });
    }

    logger.outgoingMsg(`Sending WhatsApp message to ${lead.phone}`);
    return sendSuccess(res, { message: savedMessage, conversation }, 'Message sent successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Embedded Signup Webhook - Connect Account Stub
 */
const connectAccount = async (req, res, next) => {
  try {
    const { waba_id, access_token, phone_number_id, display_name, phone_number } = req.body;
    const companyId = req.companyId || req.user?.companyId;

    if (!waba_id || !access_token || !phone_number_id) {
      return sendError(res, 'Missing required fields for Embedded Signup', 400);
    }

    const whatsappAccount = await whatsappAccountService.connectAccount(companyId, req.body);

    return sendSuccess(res, { whatsappAccount }, 'WhatsApp Account connected successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * Get all connected WhatsApp Accounts for the company
 */
const getAccounts = async (req, res, next) => {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const accounts = await whatsappAccountService.getAccountsByCompanyId(companyId);
    return sendSuccess(res, { accounts }, 'WhatsApp Accounts retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, connectAccount, getAccounts };
