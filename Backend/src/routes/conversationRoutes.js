const express = require('express');
const {
  getConversations,
  getMessages,
  takeOverConversation,
  getConversationByLead,
  resumeBot,
  updateBotStatus,
  bulkUpdateBotStatus
} = require('../controllers/conversationController');
const { protect } = require('../middlewares/authMiddleware');
const tenantMiddleware = require('../middlewares/tenantMiddleware');

const router = express.Router();

router.use(protect);
router.use(tenantMiddleware);

// IMPORTANT: bulk route BEFORE /:id routes to avoid conflict
router.patch('/bulk-bot-status', bulkUpdateBotStatus);

router.get('/', getConversations);
router.get('/lead/:leadId', getConversationByLead);
router.get('/:conversationId/messages', getMessages);
router.patch('/:id/takeover', takeOverConversation);
router.patch('/:id/resume-bot', resumeBot);
router.patch('/:id/bot-status', updateBotStatus);

module.exports = router;
