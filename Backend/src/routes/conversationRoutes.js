const express = require('express');
const { getConversations, getMessages, takeOverConversation, getConversationByLead, resumeBot } = require('../controllers/conversationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getConversations);
router.get('/lead/:leadId', getConversationByLead);
router.get('/:conversationId/messages', getMessages);
router.patch('/:id/takeover', takeOverConversation);
router.patch('/:id/resume-bot', resumeBot);

module.exports = router;
