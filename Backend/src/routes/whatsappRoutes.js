const express = require('express');
const { sendMessage } = require('../controllers/whatsappController');
const { protect } = require('../middlewares/authMiddleware');
const { whatsappRateLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

router.post('/send', protect, whatsappRateLimiter, sendMessage);

module.exports = router;
