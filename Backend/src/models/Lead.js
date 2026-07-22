const mongoose = require('mongoose');
const { LEAD_STATUS, LEAD_SOURCE } = require('../constants');

const leadSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  whatsappAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppAccount', required: true, index: true },
  zohoLeadId: { type: String, sparse: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, sparse: true },
  phone: { type: String, required: true, trim: true },
  alternatePhone: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: Object.values(LEAD_STATUS),
    default: LEAD_STATUS.NEW,
  },
  source: {
    type: String,
    enum: Object.values(LEAD_SOURCE),
    default: LEAD_SOURCE.MANUAL,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  tags: [{ type: String, trim: true }],
  notes: { type: String, default: '' },
  contactNumber: { type: String, trim: true, default: '' },
  selectedServices: [{ type: String }],
  requirement: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null, index: true },
}, { timestamps: true });

// Text search index
leadSchema.index({ name: 'text', email: 'text', phone: 'text' });
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ companyId: 1, whatsappAccountId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Lead', leadSchema);
