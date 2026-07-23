const mongoose = require('mongoose');

const emailConversationSchema = new mongoose.Schema({
  threadId: { type: String, required: true, unique: true, index: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', index: true, sparse: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  subject: { type: String, default: '' },
  participants: [{ type: String }],
  lastMessageSnippet: { type: String, default: '' },
  unreadCount: { type: Number, default: 0 },
  lastMessageAt: { type: Date, default: Date.now, index: -1 }
}, { timestamps: true });

// For searching
emailConversationSchema.index({ subject: 'text', participants: 'text' });

module.exports = mongoose.model('EmailConversation', emailConversationSchema);
