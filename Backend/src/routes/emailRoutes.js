const express = require('express');
const {
  getAccounts,
  connectGmail,
  googleCallback,
  connectOutlook,
  connectSmtp,
  deleteAccount,
  sendEmail,
  syncEmails,
  getConversations,
  getMessages,
  handleGmailWebhook
} = require('../controllers/emailController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Webhook endpoint (Public, called by Google Pub/Sub)
router.post('/webhook', handleGmailWebhook);

// Google OAuth callback does not have Bearer token, it relies on state parameter
router.get('/auth/google/callback', googleCallback);
router.get('/google/callback', googleCallback);

router.use(protect); // All other email routes require authentication

router.get('/accounts', getAccounts);
router.post('/sync', syncEmails);
router.get('/conversations', getConversations);
router.get('/conversations/:threadId/messages', getMessages);

router.get('/connect/gmail', connectGmail);
router.post('/connect/outlook', connectOutlook);
router.post('/connect/smtp', connectSmtp);
router.delete('/account/:id', deleteAccount);
router.post('/send', sendEmail);

module.exports = router;
