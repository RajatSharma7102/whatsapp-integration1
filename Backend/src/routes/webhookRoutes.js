const express = require('express');
const { verifyWebhook, handleWebhook } = require('../services/whatsapp/whatsappWebhook.service');
const { verifyWebhookSignature } = require('../middlewares/webhookSignature');

const router = express.Router();

router.get('/', verifyWebhook);
router.post('/', verifyWebhookSignature, handleWebhook);

module.exports = router;
