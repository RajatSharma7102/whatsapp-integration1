const Lead = require('../models/Lead');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const whatsappService = require('../services/whatsappService');
const botService = require('../services/botService');
const { getIO } = require('../sockets/socketManager');
const { SOCKET_EVENTS, MESSAGE_DIRECTION, MESSAGE_STATUS, LEAD_SOURCE } = require('../constants');
const logger = require('../config/logger');

/**
 * GET /webhook — Verify webhook with Meta
 */
const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    logger.success('WhatsApp webhook verified successfully');
    return res.status(200).send(challenge);
  }

  logger.fail('WhatsApp webhook verification failed');
  return res.status(403).json({ error: 'Forbidden' });
};

/**
 * POST /webhook — Handle incoming events
 */
const handleWebhook = async (req, res) => {
  // Always respond 200 immediately to Meta
  res.status(200).send('EVENT_RECEIVED');

  try {
    const body = typeof req.body === 'string'
      ? JSON.parse(req.body)
      : req.body instanceof Buffer
        ? JSON.parse(req.body.toString())
        : req.body;

    if (body.object !== 'whatsapp_business_account') {
      logger.warn('Invalid webhook payload');
      return;
    }
    
    logger.webhook('Webhook event received');

    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        if (!value) continue;

        // Handle incoming messages
        if (value.messages?.length) {
          for (const msg of value.messages) {
            await processIncomingMessage(msg, value.contacts?.[0]);
          }
        }

        // Handle message status updates
        if (value.statuses?.length) {
          for (const status of value.statuses) {
            await processStatusUpdate(status);
          }
        }
      }
    }
  } catch (error) {
    logger.error('Webhook processing error', error.message);
  }
};

const processIncomingMessage = async (msg, contact) => {
  try {
    const phone = msg.from;
    const messageId = msg.id;
    const messageType = msg.type;
    const messageText =
      msg.text?.body ||
      msg.interactive?.button_reply?.title ||
      msg.image?.caption ||
      msg.document?.caption ||
      `[${messageType}]`;

    // Extract interactive payload for button replies
    const interactivePayload = msg.interactive || null;

    const contactName = contact?.profile?.name || phone;

    logger.incomingMsg(`Incoming WhatsApp message from ${phone}: ${messageText}`);

    // 1. Find or create lead
    let lead = await Lead.findOne({ phone });
    const isNewLead = !lead;

    if (!lead) {
      lead = await Lead.create({
        name: contactName,
        phone,
        source: LEAD_SOURCE.WHATSAPP,
        status: 'New',
      });
      logger.lead(`New lead created: ${contactName}`);
      logger.leadId(`Lead ID: ${lead._id}`);
    }

    // 2. Find or create conversation
    let conversation = await Conversation.findOne({ leadId: lead._id });
    if (!conversation) {
      conversation = await Conversation.create({ leadId: lead._id });
      logger.conversation('New conversation started');
    }

    // 3. Check duplicate message
    const existing = await Message.findOne({ messageId });
    if (existing) return;

    // 4. Save incoming message
    const savedMessage = await Message.create({
      conversationId: conversation._id,
      leadId: lead._id,
      direction: MESSAGE_DIRECTION.INCOMING,
      messageType,
      message: messageText,
      messageId,
      status: MESSAGE_STATUS.ACCEPTED,
      sentAt: new Date(parseInt(msg.timestamp) * 1000),
    });

    // 5. Update conversation unread count
    await Conversation.findByIdAndUpdate(conversation._id, {
      $inc: { unreadCount: 1 },
      lastMessage: messageText,
      lastMessageAt: new Date(),
    });

    // 6. Mark message as read
    await whatsappService.markMessageAsRead(messageId);

    // 7. Process Bot Logic
    await botService.handleIncoming(conversation, lead, messageText, messageType, interactivePayload);

    // 8. Emit socket events
    const io = getIO();
    if (io) {
      io.emit(SOCKET_EVENTS.NEW_MESSAGE, {
        conversationId: conversation._id,
        leadId: lead._id,
        lead,
        message: savedMessage,
        isNewLead,
      });
      io.emit(SOCKET_EVENTS.CONVERSATION_UPDATED, {
        conversationId: conversation._id,
        leadId: lead._id,
        lastMessage: messageText,
        unreadCount: (conversation.unreadCount || 0) + 1,
      });
      if (isNewLead) {
        io.emit(SOCKET_EVENTS.LEAD_CREATED, { lead });
      }
    }
  } catch (error) {
    logger.error('processIncomingMessage error', error.message);
  }
};

const processStatusUpdate = async (status) => {
  try {
    const { id: messageId, status: newStatus, timestamp } = status;

    const updateData = { status: newStatus };
    if (newStatus === 'delivered') updateData.deliveredAt = new Date(parseInt(timestamp) * 1000);
    if (newStatus === 'read') updateData.readAt = new Date(parseInt(timestamp) * 1000);

    const updatedMessage = await Message.findOneAndUpdate(
      { messageId },
      updateData,
      { new: true }
    );

    if (updatedMessage) {
      const io = getIO();
      if (io) {
        io.emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, {
          messageId,
          status: newStatus,
          conversationId: updatedMessage.conversationId,
        });
      }
    }
  } catch (error) {
    logger.error('processStatusUpdate error', error.message);
  }
};

module.exports = { verifyWebhook, handleWebhook };
