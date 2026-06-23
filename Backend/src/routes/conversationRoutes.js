const express = require('express');
const { getConversations, getMessages, takeOverConversation, getConversationByLead } = require('../controllers/conversationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getConversations);
router.get('/lead/:leadId', getConversationByLead);
router.get('/:conversationId/messages', getMessages);
router.patch('/:id/takeover', takeOverConversation);

module.exports = router;
