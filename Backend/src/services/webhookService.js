const { google } = require('googleapis');
const EmailAccount = require('../models/EmailAccount');
const EmailConversation = require('../models/EmailConversation');
const EmailMessage = require('../models/EmailMessage');
const { getIO } = require('../sockets/socketManager');
const { getHeader, extractBody } = require('./gmailSyncService');

const getGoogleOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/email/auth/google/callback'
  );
};

const handleGmailWebhookLogic = async (emailAddress, newHistoryId) => {
  try {
    const account = await EmailAccount.findOne({ email: emailAddress, provider: 'gmail', status: 'Connected' });
    if (!account) return;

    const startHistoryId = account.historyId;
    if (startHistoryId && startHistoryId === newHistoryId.toString()) {
      return;
    }

    const oauth2Client = getGoogleOAuthClient();
    oauth2Client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    let historyRes;
    try {
      historyRes = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: startHistoryId || (parseInt(newHistoryId) - 100).toString(),
        historyTypes: ['messageAdded'],
      });
    } catch (err) {
      console.error('History fetch failed:', err.message);
      if (err.code === 404) {
         console.log('History expired, updating historyId from profile');
         const profile = await gmail.users.getProfile({ userId: 'me' });
         account.historyId = profile.data.historyId;
         await account.save();
      }
      return;
    }

    const histories = historyRes.data.history || [];
    if (histories.length === 0) return;

    const messageIds = new Set();
    histories.forEach(history => {
      if (history.messagesAdded) {
        history.messagesAdded.forEach(m => messageIds.add(m.message.id));
      }
    });

    if (messageIds.size === 0) return;
    console.log(`[Webhook] Fetching ${messageIds.size} new messages for ${emailAddress}`);

    for (const msgId of messageIds) {
      const existing = await EmailMessage.findOne({ gmailMessageId: msgId });
      if (existing) continue;

      let msgDetail;
      try {
        msgDetail = await gmail.users.messages.get({ userId: 'me', id: msgId });
      } catch(e) {
        continue;
      }
      
      const payload = msgDetail.data.payload;
      if (!payload) continue;

      const from = getHeader(payload.headers, 'from');
      const to = getHeader(payload.headers, 'to');
      const cc = getHeader(payload.headers, 'cc');
      const bcc = getHeader(payload.headers, 'bcc');
      const msgSubject = getHeader(payload.headers, 'subject');
      
      const isIncoming = !from.includes(account.email);
      const { htmlBody, plainBody } = extractBody(payload);

      let attachments = [];
      if (payload.parts) {
        payload.parts.forEach(part => {
          if (part.filename && part.body && part.body.attachmentId) {
            attachments.push({
              filename: part.filename,
              mimeType: part.mimeType,
              size: part.body.size,
              attachmentId: part.body.attachmentId
            });
          }
        });
      }

      const threadId = msgDetail.data.threadId;
      let conversation = await EmailConversation.findOne({ threadId });
      
      if (!conversation) {
        let threadDetail;
        try {
          threadDetail = await gmail.users.threads.get({ userId: 'me', id: threadId });
        } catch(e) { continue; }
        
        const allMessages = threadDetail.data.messages || [];
        if (allMessages.length === 0) continue;
        
        let allParticipants = new Set();
        allMessages.forEach(m => {
          const mFrom = getHeader(m.payload.headers, 'from');
          const mTo = getHeader(m.payload.headers, 'to');
          if (mFrom) allParticipants.add(mFrom);
          if (mTo) mTo.split(',').forEach(t => allParticipants.add(t.trim()));
        });
        
        const lastMsg = allMessages[allMessages.length - 1];
        const firstMsg = allMessages[0];
        
        conversation = await EmailConversation.create({
          threadId: threadId,
          userId: account.userId,
          subject: getHeader(firstMsg.payload.headers, 'subject'),
          participants: Array.from(allParticipants),
          lastMessageSnippet: lastMsg.snippet,
          lastMessageAt: new Date(parseInt(lastMsg.internalDate)),
        });
      } else {
        conversation.lastMessageSnippet = msgDetail.data.snippet;
        conversation.lastMessageAt = new Date(parseInt(msgDetail.data.internalDate));
        
        const currentParticipants = new Set(conversation.participants);
        if (from) currentParticipants.add(from);
        if (to) to.split(',').forEach(t => currentParticipants.add(t.trim()));
        conversation.participants = Array.from(currentParticipants);
        await conversation.save();
      }

      const savedMessage = await EmailMessage.create({
        conversationId: conversation._id,
        threadId: threadId,
        gmailMessageId: msgId,
        historyId: msgDetail.data.historyId,
        sender: from,
        recipients: to.split(',').map(s => s.trim()).filter(Boolean),
        cc: cc.split(',').map(s => s.trim()).filter(Boolean),
        bcc: bcc.split(',').map(s => s.trim()).filter(Boolean),
        subject: msgSubject,
        htmlBody,
        plainBody,
        attachments,
        direction: isIncoming ? 'incoming' : 'outgoing',
        status: isIncoming ? 'Delivered' : 'Sent',
        sentAt: new Date(parseInt(msgDetail.data.internalDate))
      });

      console.log(`[Webhook] Saved message ${msgId}`);

      const io = getIO();
      if (io) {
        console.log('\n=============================================');
        console.log(isIncoming ? '📥 [SOCKET] INCOMING EMAIL (WEBHOOK)' : '📤 [SOCKET] OUTGOING EMAIL (WEBHOOK)');
        console.log('Thread ID:', threadId);
        console.log('=============================================\n');
        io.emit('email:new-message', {
          conversationId: conversation._id,
          threadId: threadId,
          message: savedMessage
        });
      }
    }

    account.historyId = newHistoryId;
    await account.save();

  } catch (err) {
    console.error('Webhook processing error:', err);
  }
};

const renewGmailWatch = async (accountId) => {
  const account = await EmailAccount.findById(accountId);
  if (!account || account.provider !== 'gmail' || account.status !== 'Connected') return;
  
  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  try {
    const watchRes = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        labelIds: ['INBOX'],
        topicName: 'projects/bugs-desk/topics/gmail-notifications'
      }
    });
    console.log(`[Watch Renew] Success for ${account.email}`);
    account.historyId = watchRes.data.historyId;
    account.watchExpiration = new Date(parseInt(watchRes.data.expiration));
    await account.save();
  } catch (err) {
    console.error(`[Watch Renew] Failed for ${account.email}:`, err.message);
  }
};

module.exports = { handleGmailWebhookLogic, renewGmailWatch };
