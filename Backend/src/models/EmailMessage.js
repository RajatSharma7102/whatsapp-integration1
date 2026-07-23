const mongoose = require('mongoose');

const emailMessageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailConversation', required: true, index: true },
  threadId: { type: String, required: true, index: true },
  gmailMessageId: { type: String, unique: true, sparse: true },
  historyId: { type: String },
  sender: { type: String, required: true },
  recipients: [{ type: String }],
  cc: [{ type: String }],
  bcc: [{ type: String }],
  subject: { type: String, default: '' },
  htmlBody: { type: String, default: '' },
  plainBody: { type: String, default: '' },
  attachments: [{
    filename: String,
    mimeType: String,
    size: Number,
    attachmentId: String
  }],
  direction: { type: String, enum: ['incoming', 'outgoing'], required: true },
  status: { type: String, enum: ['Sending', 'Sent', 'Delivered', 'Read', 'Failed'], default: 'Sent' },
  sentAt: { type: Date, required: true, index: -1 }
}, { timestamps: true });

module.exports = mongoose.model('EmailMessage', emailMessageSchema);
