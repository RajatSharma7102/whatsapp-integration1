const Team = require('../models/Team');
const Lead = require('../models/Lead');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../config/logger');

/** GET /api/teams */
const getTeams = async (req, res, next) => {
  try {
    const teams = await Team.find({ companyId: req.companyId })
      .populate('members', 'name email role')
      .sort({ createdAt: 1 })
      .lean();

    // Attach lead count per team
    const teamIds = teams.map(t => t._id);
    const counts = await Lead.aggregate([
      { $match: { companyId: req.companyId, teamId: { $in: teamIds }, isActive: true } },
      { $group: { _id: '$teamId', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id.toString()] = c.count; });
    teams.forEach(t => { t.leadCount = countMap[t._id.toString()] || 0; });

    return sendSuccess(res, teams, 'Teams retrieved.');
  } catch (error) {
    next(error);
  }
};

/** POST /api/teams */
const createTeam = async (req, res, next) => {
  try {
    const { name, description, color, members } = req.body;
    if (!name) return sendError(res, 'Team name is required.', 400);

    const team = await Team.create({
      companyId: req.companyId,
      name,
      description,
      color: color || '#6366f1',
      members: members || [],
    });

    const populated = await team.populate('members', 'name email role');
    logger.info(`Team created: ${team.name} (${team._id})`);
    return sendSuccess(res, populated, 'Team created.', 201);
  } catch (error) {
    next(error);
  }
};

/** PUT /api/teams/:id */
const updateTeam = async (req, res, next) => {
  try {
    const { name, description, color, members } = req.body;

    const team = await Team.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { name, description, color, members },
      { new: true, runValidators: true }
    ).populate('members', 'name email role');

    if (!team) return sendError(res, 'Team not found.', 404);
    return sendSuccess(res, team, 'Team updated.');
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/teams/:id */
const deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findOneAndDelete({ _id: req.params.id, companyId: req.companyId });
    if (!team) return sendError(res, 'Team not found.', 404);

    // Unassign leads from this team
    await Lead.updateMany({ teamId: req.params.id, companyId: req.companyId }, { $unset: { teamId: 1 } });

    logger.info(`Team deleted: ${team.name}`);
    return sendSuccess(res, null, 'Team deleted.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getTeams, createTeam, updateTeam, deleteTeam };
