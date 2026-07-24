const cron = require('node-cron');
const logger = require('../config/logger');
const Lead = require('../models/Lead');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const EmailAccount = require('../models/EmailAccount');
const { syncGmailThreads } = require('../services/gmailSyncService');

/**
 * Daily: Log stats
 */
const dailyStatsJob = cron.schedule('0 9 * * *', async () => {
  try {
    const [totalLeads, totalConversations, totalMessages] = await Promise.all([
      Lead.countDocuments({ isActive: true }),
      Conversation.countDocuments(),
      Message.countDocuments(),
    ]);
    logger.job(`Daily Stats -> Leads: ${totalLeads}, Conversations: ${totalConversations}, Messages: ${totalMessages}`);
  } catch (err) {
    logger.error('Daily stats job failed', err.message);
  }
}, { scheduled: false });

/**
 * Every 6 hours: Close stale conversations (no message in 72h)
 */
const closeStaleConversationsJob = cron.schedule('0 */6 * * *', async () => {
  try {
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const result = await Conversation.updateMany(
      { lastMessageAt: { $lt: cutoff }, isOpen: true },
      { isOpen: false }
    );
    if (result.modifiedCount > 0) {
      logger.job(`Closed ${result.modifiedCount} stale conversations.`);
    }
  } catch (err) {
    logger.error('Close stale conversations job failed', err.message);
  }
}, { scheduled: false });

/**
 * Daily: Renew Gmail Watch API for all connected accounts
 * Watch expires every 7 days, so we renew it daily to be safe.
 */
const { renewGmailWatch } = require('../services/webhookService');
const renewGmailWatchJob = cron.schedule('0 2 * * *', async () => {
  try {
    const accounts = await EmailAccount.find({ provider: 'gmail', status: 'Connected' });
    for (const acc of accounts) {
      await renewGmailWatch(acc._id).catch(err => logger.error(`Watch renewal failed for ${acc.email}`, err.message));
    }
  } catch (err) {
    logger.error('Watch renewal cron job failed', err.message);
  }
}, { scheduled: false });

const startAllJobs = () => {
  if (process.env.NODE_ENV === 'production') {
    renewGmailWatchJob.start();
    dailyStatsJob.start();
    closeStaleConversationsJob.start();
    logger.job('Cron jobs started.');
  }
};

module.exports = { startAllJobs };
