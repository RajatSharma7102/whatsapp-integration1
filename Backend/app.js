const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { globalRateLimiter } = require('./src/middlewares/rateLimiter');
const { errorHandler, notFound } = require('./src/middlewares/errorHandler');
const logger = require('./src/config/logger');

// Routes
const authRoutes = require('./src/routes/authRoutes');
const leadRoutes = require('./src/routes/leadRoutes');
const conversationRoutes = require('./src/routes/conversationRoutes');
const whatsappRoutes = require('./src/routes/whatsappRoutes');
const webhookRoutes = require('./src/routes/webhookRoutes');
const companyRoutes = require('./src/routes/companyRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const zohoRoutes = require('./src/integrations/zoho/zoho.routes');
const emailRoutes = require('./src/routes/emailRoutes');

const app = express();

// Trust proxy — required for rate limiter behind ngrok/reverse proxy
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// HTTP logger
app.use(morgan('combined', {
  stream: { write: (msg) => logger.api(msg.trim()) },
}));

// Rate limiter
app.use(globalRateLimiter);

// Webhook MUST use raw body — before express.json()
app.use('/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

// JSON parsing for other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/integrations/zoho', zohoRoutes);
app.use('/api/email', emailRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
