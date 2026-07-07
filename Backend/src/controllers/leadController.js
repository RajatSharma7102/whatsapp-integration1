const Lead = require('../models/Lead');
const Conversation = require('../models/Conversation');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHelper');
const logger = require('../config/logger');

const getLeads = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, source, assignedTo, teamId } = req.query;
    const skip = (page - 1) * limit;

    const filter = { isActive: true, companyId: req.companyId };

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
    if (teamId === 'unassigned') {
      filter.teamId = null;
    } else if (teamId) {
      filter.teamId = teamId;
    }

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedTo', 'name email')
        .populate('teamId', 'name color')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Lead.countDocuments(filter),
    ]);

    // Attach unreadCount from conversations to each lead
    if (leads.length > 0) {
      const leadIds = leads.map(l => l._id);
      const conversations = await Conversation.find(
        { leadId: { $in: leadIds }, companyId: req.companyId },
        { leadId: 1, unreadCount: 1 }
      ).lean();

      const unreadMap = {};
      conversations.forEach(c => { unreadMap[c.leadId.toString()] = c.unreadCount || 0; });
      leads.forEach(l => { l.unreadCount = unreadMap[l._id.toString()] || 0; });
    }

    return sendPaginated(res, leads, total, page, limit, 'Leads retrieved.');
  } catch (error) {
    next(error);
  }
};

const getLeadById = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, companyId: req.companyId }).populate('assignedTo', 'name email');
    if (!lead || !lead.isActive) return sendError(res, 'Lead not found.', 404);
    return sendSuccess(res, lead, 'Lead retrieved.');
  } catch (error) {
    next(error);
  }
};

const createLead = async (req, res, next) => {
  try {
    const leadData = { ...req.body, companyId: req.companyId };
    const lead = await Lead.create(leadData);
    logger.lead(`New lead created: ${lead.name}`);
    logger.leadId(`Lead ID: ${lead._id}`);
    return sendSuccess(res, lead, 'Lead created.', 201);
  } catch (error) {
    next(error);
  }
};

const updateLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
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
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
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
