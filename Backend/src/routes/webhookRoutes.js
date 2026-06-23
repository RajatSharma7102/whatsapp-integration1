const express = require('express');
const { verifyWebhook, handleWebhook } = require('../webhooks/whatsappWebhook');

const router = express.Router();

router.get('/', verifyWebhook);
router.post('/', handleWebhook);

module.exports = router;
