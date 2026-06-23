const { Server } = require('socket.io');
const logger = require('../config/logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on('connection', (socket) => {
    logger.socket(`Socket connected: ${socket.id}`);

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      logger.socket(`Socket ${socket.id} joined conversation:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('typing', { conversationId, isTyping });
    });

    socket.on('disconnect', () => {
      logger.socket(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.socket('Socket.IO initialized.');
  return io;
};

const getIO = () => io;

module.exports = { initSocket, getIO };
