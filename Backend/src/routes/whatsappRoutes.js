const express = require('express');
const { sendMessage, connectAccount, getAccounts } = require('../controllers/whatsappController');
const { protect } = require('../middlewares/authMiddleware');
const tenantMiddleware = require('../middlewares/tenantMiddleware');
const { whatsappRateLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/send', protect, tenantMiddleware, whatsappRateLimiter, sendMessage);
router.post('/connect', protect, tenantMiddleware, connectAccount);
router.get('/accounts', protect, tenantMiddleware, getAccounts);

module.exports = router;
