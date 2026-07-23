const EmailAccount = require('../models/EmailAccount');
const { google } = require('googleapis');

const getGoogleOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/email/auth/google/callback'
  );
};

// @desc    Get all email accounts for user
// @route   GET /api/email/accounts
// @access  Private
exports.getAccounts = async (req, res, next) => {
  try {
    const accounts = await EmailAccount.find({ userId: req.user._id });
    res.status(200).json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Google OAuth URL
// @route   GET /api/email/connect/gmail
// @access  Private
exports.connectGmail = async (req, res, next) => {
  try {
    const oauth2Client = getGoogleOAuthClient();
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];
    
    // Pass user ID in state to link account in callback
    const state = req.user._id.toString();

    console.log("SCOPES BEING SENT:", scopes);

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: false,
      scope: scopes,
      state: state
    });

    console.log("AUTH URL:", authUrl);

    res.status(200).json({ success: true, authUrl });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Google OAuth Callback
// @route   GET /api/email/auth/google/callback
// @access  Public (State carries the user context)
exports.googleCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.status(400).send('No code provided');
    }

    const oauth2Client = getGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    console.log("TOKENS:", tokens);
    oauth2Client.setCredentials(tokens);

    try {
      const tokenInfo = await oauth2Client.getTokenInfo(tokens.access_token);
      console.log("TOKEN INFO:", tokenInfo);
    } catch (infoErr) {
      console.error("Could not fetch token info:", infoErr);
    }

    // Get user email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    const userId = state;

    if (!userId) {
      return res.status(400).send('Invalid state: no user ID');
    }

    // Save or update account
    await EmailAccount.findOneAndUpdate(
      { userId, provider: 'gmail', email },
      {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        status: 'Connected',
      },
      { upsert: true, new: true }
    );

    const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/settings?email_connected=true`);
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.status(500).send('Google Authentication failed');
  }
};

// @desc    Connect Outlook account
// @route   POST /api/email/connect/outlook
// @access  Private
exports.connectOutlook = async (req, res, next) => {
  try {
    // TODO: Implement actual Outlook OAuth logic here
    res.status(200).json({ success: true, message: 'Outlook connection endpoint ready' });
  } catch (error) {
    next(error);
  }
};

// @desc    Connect SMTP account
// @route   POST /api/email/connect/smtp
// @access  Private
exports.connectSmtp = async (req, res, next) => {
  try {
    const { email, smtpHost, smtpPort, smtpUsername, smtpPassword } = req.body;
    
    if (!email || !smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
      return res.status(400).json({ success: false, message: 'Please provide all SMTP details' });
    }

    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUsername,
        pass: smtpPassword,
      },
    });

    try {
      await transporter.verify();
    } catch (error) {
      return res.status(400).json({ success: false, message: 'SMTP verification failed: ' + error.message });
    }

    const newAccount = await EmailAccount.create({
      userId: req.user._id,
      provider: 'smtp',
      email,
      smtpHost,
      smtpPort: Number(smtpPort),
      smtpUsername,
      smtpPassword,
      status: 'Connected',
    });

    res.status(201).json({ success: true, data: newAccount, message: 'SMTP Account connected successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Disconnect email account
// @route   DELETE /api/email/account/:id
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    const account = await EmailAccount.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }
    res.status(200).json({ success: true, message: 'Account disconnected successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Send an email via the default/connected account
// @route   POST /api/email/send
// @access  Private
exports.sendEmail = async (req, res, next) => {
  try {
    const { to, subject, text, html } = req.body;
    if (!to || !subject) {
      return res.status(400).json({ success: false, message: 'Please provide recipient (to) and subject' });
    }

    // Get a connected email account (prefer default)
    const account = await EmailAccount.findOne({ userId: req.user._id, status: 'Connected' }).sort({ isDefault: -1, createdAt: -1 });

    if (!account) {
      return res.status(400).json({ success: false, message: 'No connected email account found. Please connect an email in Settings.' });
    }

    if (account.provider === 'gmail') {
      const oauth2Client = getGoogleOAuthClient();
      oauth2Client.setCredentials({
        access_token: account.accessToken,
        refresh_token: account.refreshToken,
      });

      try {
        const accessToken = await oauth2Client.getAccessToken();
        console.log("CURRENT ACCESS TOKEN:", accessToken);

        const tokenInfo = await oauth2Client.getTokenInfo(account.accessToken);
        console.log("TOKEN INFO FROM DB:", tokenInfo);
      } catch (err) {
        console.error("Token log error:", err);
      }

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      const str = [
        `To: ${to}`,
        `From: ${account.email}`,
        `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        html || text
      ].join('\r\n');
      
      const encodedMessage = Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const resGmail = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      return res.status(200).json({ success: true, message: 'Email sent successfully', messageId: resGmail.data.id });
      
    } else if (account.provider === 'smtp') {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: account.smtpHost,
        port: account.smtpPort,
        secure: account.smtpPort === 465,
        auth: {
          user: account.smtpUsername,
          pass: account.smtpPassword,
        },
      });
      
      const info = await transporter.sendMail({
        from: account.email,
        to,
        subject,
        text: text || '',
        html: html || text,
      });

      return res.status(200).json({ success: true, message: 'Email sent successfully', messageId: info.messageId });
    } else {
      return res.status(400).json({ success: false, message: `Sending email via ${account.provider} is not supported yet.` });
    }
  } catch (error) {
    console.error("Email send error:", error);
    next(error);
  }
};
