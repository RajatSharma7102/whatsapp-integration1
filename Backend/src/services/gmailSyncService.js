const { google } = require('googleapis');
const EmailConversation = require('../models/EmailConversation');
const EmailMessage = require('../models/EmailMessage');
const EmailAccount = require('../models/EmailAccount');
const { getIO } = require('../sockets/socketManager');

const getGoogleOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/email/auth/google/callback'
  );
};

const getHeader = (headers, name) => {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : '';
};

const extractBody = (payload) => {
  let htmlBody = '';
  let plainBody = '';

  const parseParts = (parts) => {
    for (const part of parts) {
      if (part.mimeType === 'text/html' && part.body.data) {
        htmlBody = Buffer.from(part.body.data, 'base64url').toString('utf8');
      } else if (part.mimeType === 'text/plain' && part.body.data) {
        plainBody = Buffer.from(part.body.data, 'base64url').toString('utf8');
      } else if (part.parts) {
        parseParts(part.parts);
      }
    }
  };

  if (payload.parts) {
    parseParts(payload.parts);
  } else if (payload.body && payload.body.data) {
    if (payload.mimeType === 'text/html') {
      htmlBody = Buffer.from(payload.body.data, 'base64url').toString('utf8');
    } else {
      plainBody = Buffer.from(payload.body.data, 'base64url').toString('utf8');
    }
  }

  return { htmlBody, plainBody };
};

const syncGmailThreads = async (accountId) => {
  try {
    const account = await EmailAccount.findById(accountId);
    if (!account || account.provider !== 'gmail') return;

    const oauth2Client = getGoogleOAuthClient();
    oauth2Client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Fetch latest 50 threads for sync (can be paginated later)
    const response = await gmail.users.threads.list({
      userId: 'me',
      maxResults: 50,
    });

    const threads = response.data.threads || [];

    for (const t of threads) {
      const threadDetail = await gmail.users.threads.get({
        userId: 'me',
        id: t.id,
      });

      const messages = threadDetail.data.messages;
      if (!messages || messages.length === 0) continue;

      // Extract thread level info from first and last message
      const firstMessage = messages[0];
      const lastMessage = messages[messages.length - 1];

      const subject = getHeader(firstMessage.payload.headers, 'subject');
      
      let allParticipants = new Set();
      messages.forEach(msg => {
        const from = getHeader(msg.payload.headers, 'from');
        const to = getHeader(msg.payload.headers, 'to');
        if (from) allParticipants.add(from);
        if (to) to.split(',').forEach(t => allParticipants.add(t.trim()));
      });

      // Update or create Conversation
      const conversation = await EmailConversation.findOneAndUpdate(
        { threadId: t.id },
        {
          userId: account.userId,
          subject: subject,
          participants: Array.from(allParticipants),
          lastMessageSnippet: lastMessage.snippet,
          lastMessageAt: new Date(parseInt(lastMessage.internalDate)),
        },
        { upsert: true, new: true }
      );

      // Sync messages
      for (const msg of messages) {
        const existingMessage = await EmailMessage.findOne({ gmailMessageId: msg.id });
        if (existingMessage) continue;

        const from = getHeader(msg.payload.headers, 'from');
        const to = getHeader(msg.payload.headers, 'to');
        const cc = getHeader(msg.payload.headers, 'cc');
        const bcc = getHeader(msg.payload.headers, 'bcc');
        const msgSubject = getHeader(msg.payload.headers, 'subject');
        
        const isIncoming = !from.includes(account.email);

        const { htmlBody, plainBody } = extractBody(msg.payload);

        let attachments = [];
        if (msg.payload.parts) {
          msg.payload.parts.forEach(part => {
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

        await EmailMessage.create({
          conversationId: conversation._id,
          threadId: t.id,
          gmailMessageId: msg.id,
          historyId: msg.historyId,
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
          sentAt: new Date(parseInt(msg.internalDate))
        });

        // Emit socket event for real-time UI update
        const io = getIO();
        if (io) {
          io.emit('new_email', {
            threadId: t.id,
            conversationId: conversation._id,
            messageId: msg.id
          });
        }
      }
    }
    console.log(`Synced threads for account ${account.email}`);
  } catch (error) {
    console.error("Error syncing gmail threads:", error);
  }
};

module.exports = {
  syncGmailThreads
};
