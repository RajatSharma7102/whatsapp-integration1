const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  website: { type: String },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
