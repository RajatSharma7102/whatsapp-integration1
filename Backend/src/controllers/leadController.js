const Lead = require('../models/Lead');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');
const logger = require('../config/logger');

const getLeads = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, source, assignedTo } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (source) filter.source = source;
    if (assignedTo) filter.assignedTo = assignedTo;

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Lead.countDocuments(filter),
    ]);

    return sendPaginated(res, leads, total, page, limit, 'Leads retrieved.');
  } catch (error) {
    next(error);
  }
};

const getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name email');
    if (!lead || !lead.isActive) return sendError(res, 'Lead not found.', 404);
    return sendSuccess(res, lead, 'Lead retrieved.');
  } catch (error) {
    next(error);
  }
};

const createLead = async (req, res, next) => {
  try {
    const lead = await Lead.create(req.body);
    logger.lead(`New lead created: ${lead.name}`);
    logger.leadId(`Lead ID: ${lead._id}`);
    return sendSuccess(res, lead, 'Lead created.', 201);
  } catch (error) {
    next(error);
  }
};

const updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    if (!lead) return sendError(res, 'Lead not found.', 404);
    logger.lead(`Lead updated: ${lead._id}`);
    return sendSuccess(res, lead, 'Lead updated.');
  } catch (error) {
    next(error);
  }
};

const deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!lead) return sendError(res, 'Lead not found.', 404);
    logger.lead(`Lead soft-deleted: ${lead._id}`);
    return sendSuccess(res, null, 'Lead deleted.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getLeads, getLeadById, createLead, updateLead, deleteLead };
