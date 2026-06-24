const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');
const { getIO } = require('../sockets/socketManager');
const { SOCKET_EVENTS } = require('../constants');

const getConversations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    let matchStage = { isOpen: true, companyId: req.companyId };

    const [conversations, total] = await Promise.all([
      Conversation.find(matchStage)
        .populate({
          path: 'leadId',
          select: 'name phone email status source tags',
          match: search
            ? { $or: [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }] }
            : {},
        })
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Conversation.countDocuments(matchStage),
    ]);

    const filtered = conversations.filter((c) => c.leadId !== null);
    return sendPaginated(res, filtered, total, page, limit, 'Conversations retrieved.');
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findOne({ _id: conversationId, companyId: req.companyId });
    if (!conversation) return sendError(res, 'Conversation not found.', 404);

    // Reset unread count
    await Conversation.findByIdAndUpdate(conversationId, { unreadCount: 0 });

    const [messages, total] = await Promise.all([
      Message.find({ conversationId })
        .sort({ sentAt: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Message.countDocuments({ conversationId }),
    ]);

    return sendPaginated(res, messages, total, page, limit, 'Messages retrieved.');
  } catch (error) {
    next(error);
  }
};

const getConversationByLead = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const conversation = await Conversation.findOne({ leadId, companyId: req.companyId }).populate('leadId');
    if (!conversation) return sendError(res, 'Conversation not found for this lead.', 404);
    
    return sendSuccess(res, conversation, 'Conversation retrieved.');
  } catch (error) {
    next(error);
  }
};

const takeOverConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findOne({ _id: id, companyId: req.companyId });
    if (!conversation) return sendError(res, 'Conversation not found.', 404);

    conversation.botStatus = 'HUMAN_ASSIGNED';
    if (req.user) conversation.assignedTo = req.user._id;
    await conversation.save();

    // Emit socket so frontend updates instantly
    const io = getIO();
    if (io) {
      io.emit('conversation_takeover', {
        conversationId: id,
        botStatus: 'HUMAN_ASSIGNED',
        assignedTo: req.user || null,
      });
    }

    return sendSuccess(res, { success: true, status: 'HUMAN_ASSIGNED', conversation }, 'Conversation taken over by human.');
  } catch (error) {
    next(error);
  }
};

const resumeBot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await Conversation.findOne({ _id: id, companyId: req.companyId });
    if (!conversation) return sendError(res, 'Conversation not found.', 404);

    conversation.botStatus = 'BOT_ACTIVE';
    conversation.assignedTo = null;
    await conversation.save();

    const io = getIO();
    if (io) {
      io.emit('conversation_takeover', {
        conversationId: id,
        botStatus: 'BOT_ACTIVE',
        assignedTo: null,
      });
    }

    return sendSuccess(res, { success: true, status: 'BOT_ACTIVE', conversation }, 'Bot resumed.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getConversations, getMessages, takeOverConversation, getConversationByLead, resumeBot };
