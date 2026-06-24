const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/responseHelper');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Access denied. No token provided.', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return sendError(res, 'User not found or inactive.', 401);
    }

    req.user = user;
    req.companyId = user.companyId; // Ensure tenant isolation is globally available
    next();
  } catch (error) {
    next(error);
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return sendError(res, 'Access denied. Admins only.', 403);
  }
  next();
};

module.exports = { protect, adminOnly };
