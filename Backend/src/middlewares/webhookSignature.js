const crypto = require('crypto');
const logger = require('../config/logger');

const verifyWebhookSignature = (req, res, next) => {
  // Only verify POST requests
  if (req.method !== 'POST') {
    return next();
  }

  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    logger.warn('Webhook signature missing');
    return res.status(401).send('Signature missing');
  }

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    logger.error('META_APP_SECRET is not configured');
    return res.status(500).send('Server configuration error');
  }

  // req.body should be a Buffer because we use express.raw() for the webhook route
  const payload = req.body;
  if (!Buffer.isBuffer(payload)) {
    logger.error('Webhook payload is not a Buffer. Ensure express.raw() is used.');
    return res.status(500).send('Invalid payload format');
  }

  const expectedSignature = 'sha256=' + crypto.createHmac('sha256', appSecret).update(payload).digest('hex');

  if (signature !== expectedSignature) {
    logger.warn('Webhook signature mismatch');
    return res.status(401).send('Invalid signature');
  }

  next();
};

module.exports = { verifyWebhookSignature };
