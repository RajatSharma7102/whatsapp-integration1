const Lead = require('../models/Lead');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const whatsappService = require('../services/whatsappService');
const { getIO } = require('../sockets/socketManager');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { SOCKET_EVENTS, MESSAGE_DIRECTION, MESSAGE_STATUS } = require('../constants');
const logger = require('../config/logger');

const sendMessage = async (req, res, next) => {
  try {
    const { leadId, message } = req.body;

    // 1. Find lead
    const lead = await Lead.findById(leadId);
    if (!lead) return sendError(res, 'Lead not found.', 404);

    // 2. Send WhatsApp message
    const waResponse = await whatsappService.sendTextMessage(lead.phone, message);
    const waMessageId = waResponse?.messages?.[0]?.id;

    // 3. Find or create conversation
    let conversation = await Conversation.findOne({ leadId });
    if (!conversation) {
      conversation = await Conversation.create({ leadId });
    }

    // 4. Save message to DB
    const savedMessage = await Message.create({
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

module.exports = { sendMessage };
