const express = require('express');
const router = express.Router();
const zohoController = require('./zoho.controller');
const zohoWebhook = require('./zoho.webhook');

const { protect } = require('../../middlewares/authMiddleware');
const tenantMiddleware = require('../../middlewares/tenantMiddleware');

// OAuth routes
router.get('/connect', protect, tenantMiddleware, zohoController.oauthConnect);
router.get('/callback', zohoController.oauthCallback);

// Integration status & sync
router.get('/status', protect, tenantMiddleware, zohoController.getStatus);
router.post('/sync', protect, tenantMiddleware, zohoController.syncData);
router.delete('/disconnect', protect, tenantMiddleware, zohoController.disconnect);

// Webhook route
router.post('/webhook', zohoWebhook.handleWebhook);

module.exports = router;
