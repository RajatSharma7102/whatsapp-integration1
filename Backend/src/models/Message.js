const mongoose = require('mongoose');
const { MESSAGE_DIRECTION, MESSAGE_STATUS, MESSAGE_TYPE } = require('../constants');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
  },
  direction: {
    type: String,
    enum: Object.values(MESSAGE_DIRECTION),
    required: true,
  },
  messageType: {
    type: String,
    enum: Object.values(MESSAGE_TYPE),
    default: MESSAGE_TYPE.TEXT,
  },
  message: { type: String, required: true },
  messageId: { type: String, unique: true, sparse: true }, // WhatsApp message ID
  status: {
    type: String,
    enum: Object.values(MESSAGE_STATUS),
    default: MESSAGE_STATUS.SENT,
  },
  sentAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date },
  readAt: { type: Date },
  mediaUrl: { type: String },
  mediaType: { type: String },
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ leadId: 1, direction: 1 });

module.exports = mongoose.model('Message', messageSchema);
