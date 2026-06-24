const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  whatsappAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppAccount', required: true, index: true },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
    unique: true,
  },
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  unreadCount: { type: Number, default: 0 },
  isOpen: { type: Boolean, default: true },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  botStatus: {
    type: String,
    enum: ['BOT_ACTIVE', 'HUMAN_ASSIGNED'],
    default: 'BOT_ACTIVE'
  },
  botState: {
    type: String,
    enum: ['ASK_NAME', 'CONFIRM_NUMBER', 'ASK_PHONE', 'ASK_SERVICES', 'ASK_REQUIREMENT', 'COMPLETED'],
    default: 'ASK_NAME'
  },
  botMeta: { type: String, default: '' }
}, { timestamps: true });

conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ unreadCount: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
