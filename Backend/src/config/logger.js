const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const transports = [
  new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      logFormat
    ),
  }),
];

if (process.env.NODE_ENV === 'production') {
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
    }),
    new DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    })
  );
}

const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports,
  exitOnError: false,
});

const logger = {
  // Standard methods
  info: (msg) => winstonLogger.info(`ℹ️ ${msg}`),
  warn: (msg) => winstonLogger.warn(`⚠️ ${msg}`),
  error: (msg, err) => winstonLogger.error(err ? `❌ ${msg} - ${err}` : `❌ ${msg}`),
  debug: (msg) => winstonLogger.debug(`🐛 ${msg}`),

  // Structured emoji methods
  server: (msg) => winstonLogger.info(`🚀 ${msg}`),
  db: (msg) => winstonLogger.info(`🍃 ${msg}`),
  dbError: (msg, err) => winstonLogger.error(err ? `❌ ${msg} - ${err}` : `❌ ${msg}`),
  success: (msg) => winstonLogger.info(`✅ ${msg}`),
  fail: (msg) => winstonLogger.warn(`❌ ${msg}`),
  incomingMsg: (msg) => winstonLogger.info(`📩 ${msg}`),
  outgoingMsg: (msg) => winstonLogger.info(`📤 ${msg}`),
  msgSuccess: (msg) => winstonLogger.info(`✅ ${msg}`),
  msgFail: (msg, err) => winstonLogger.error(err ? `❌ ${msg} - ${err}` : `❌ ${msg}`),
  lead: (msg) => winstonLogger.info(`👤 ${msg}`),
  leadId: (msg) => winstonLogger.info(`📋 ${msg}`),
  conversation: (msg) => winstonLogger.info(`💬 ${msg}`),
  webhook: (msg) => winstonLogger.info(`📨 ${msg}`),
  auth: (msg) => winstonLogger.info(`🔐 ${msg}`),
  unauthorized: (msg) => winstonLogger.warn(`🚫 ${msg}`),
  api: (msg) => winstonLogger.info(`🌐 ${msg}`),
  fatal: (msg, err) => winstonLogger.error(err ? `🔥 ${msg} - ${err}` : `🔥 ${msg}`),
  rateLimit: (msg) => winstonLogger.warn(`🛡️ ${msg}`),
  socket: (msg) => winstonLogger.info(`🔌 ${msg}`),
  shutdown: (msg) => winstonLogger.info(`🛑 ${msg}`),
  job: (msg) => winstonLogger.info(`⚙️ ${msg}`),

  // Raw winston instance
  winston: winstonLogger
};

module.exports = logger;
