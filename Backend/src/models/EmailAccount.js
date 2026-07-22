const mongoose = require('mongoose');

const emailAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: String,
      enum: ['gmail', 'outlook', 'smtp'],
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    // OAuth specific fields (for gmail/outlook)
    accessToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
    
    // SMTP specific fields
    smtpHost: {
      type: String,
    },
    smtpPort: {
      type: Number,
    },
    smtpUsername: {
      type: String,
    },
    smtpPassword: {
      type: String,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'error'],
      default: 'connected',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailAccount', emailAccountSchema);
