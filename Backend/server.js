require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/sockets/socketManager');
const logger = require('./src/config/logger');
const { startAllJobs } = require('./src/jobs');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Connect to MongoDB then start server
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      logger.server(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      startAllJobs();
    });
  })
  .catch((err) => {
    logger.dbError('Failed to connect to MongoDB', err.message);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.shutdown('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.shutdown('Process terminated.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  logger.fatal('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});
