const mongoose = require('mongoose');
const { encryptToken } = require('../utils/crypto');

const whatsappAccountSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  displayName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  phoneNumberId: { type: String, required: true, unique: true },
  businessAccountId: { type: String, required: true },
  accessToken: { type: String, required: true },
  verifyToken: { type: String },
  webhookSecret: { type: String },
  department: { type: String, default: 'General' },
  isDefault: { type: Boolean, default: false },
  status: { type: String, enum: ['CONNECTED', 'DISCONNECTED', 'BANNED'], default: 'CONNECTED' },
  connectedAt: { type: Date, default: Date.now },
}, { timestamps: true });

whatsappAccountSchema.index({ companyId: 1, phoneNumber: 1 }, { unique: true });

// Pre-save hook to encrypt the access token before saving
whatsappAccountSchema.pre('save', function (next) {
  // Only encrypt if it has been modified (or is new)
  if (this.isModified('accessToken')) {
    // Check if it's already encrypted (has iv format)
    if (!this.accessToken.includes(':')) {
      this.accessToken = encryptToken(this.accessToken);
    }
  }
  next();
});

module.exports = mongoose.model('WhatsAppAccount', whatsappAccountSchema);
