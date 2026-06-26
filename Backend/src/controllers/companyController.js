const Company = require('../models/Company');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { getIO } = require('../sockets/socketManager');
const logger = require('../config/logger');

/**
 * GET /api/companies/me
 * Returns the current user's company settings (including globalBotMode)
 */
const getMyCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.companyId);
    if (!company) return sendError(res, 'Company not found.', 404);
    return sendSuccess(res, company, 'Company retrieved.');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/companies/me/bot-mode
 * Updates the company-level global bot mode and broadcasts via socket
 */
const updateGlobalBotMode = async (req, res, next) => {
  try {
    const { globalBotMode } = req.body;

    if (!['BOT_ACTIVE', 'HUMAN_ASSIGNED'].includes(globalBotMode)) {
      return sendError(res, 'Invalid bot mode. Must be BOT_ACTIVE or HUMAN_ASSIGNED.', 400);
    }

    const company = await Company.findByIdAndUpdate(
      req.companyId,
      { globalBotMode },
      { new: true }
    );
    if (!company) return sendError(res, 'Company not found.', 404);

    logger.info(`🌐 Global bot mode updated → ${globalBotMode} (Company: ${req.companyId})`);

    // Broadcast to all connected clients in this workspace
    const io = getIO();
    if (io) {
      io.emit('global_bot_mode_updated', {
        companyId: req.companyId.toString(),
        globalBotMode,
      });
    }

    return sendSuccess(res, { globalBotMode }, 'Global bot mode updated.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyCompany, updateGlobalBotMode };
