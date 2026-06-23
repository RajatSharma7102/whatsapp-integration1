const mongoose = require('mongoose');
const logger = require('./logger');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  isConnected = true;
  logger.db(`MongoDB connected successfully: ${conn.connection.host}`);
  return conn;
};

mongoose.connection.on('error', (err) => {
  logger.dbError('MongoDB connection error', err.message);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.fail('MongoDB disconnected. Attempting to reconnect...');
});

module.exports = { connectDB };
