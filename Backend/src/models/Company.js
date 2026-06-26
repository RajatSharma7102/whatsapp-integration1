const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  website: { type: String },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
  globalBotMode: { type: String, enum: ['BOT_ACTIVE', 'HUMAN_ASSIGNED'], default: 'BOT_ACTIVE' },
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
