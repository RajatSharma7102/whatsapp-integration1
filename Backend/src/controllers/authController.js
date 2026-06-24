const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const logger = require('../config/logger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const register = async (req, res, next) => {
  try {
    const { companyName, name, email, password } = req.body;
    
    if (!companyName || !name || !email || !password) {
      return sendError(res, 'Company Name, Full Name, Email, and Password are required.', 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return sendError(res, 'Email already registered.', 409);

    // Create Company
    const company = await Company.create({
      companyName,
      email, // Using the owner's email as the company contact email initially
    });

    // Create User linked to the new Company
    const user = await User.create({ 
      companyId: company._id,
      name, 
      email, 
      password, 
      role: 'OWNER' 
    });
    
    const token = generateToken(user._id);

    logger.auth(`User authenticated: ${email} (New Registration - Company: ${companyName})`);
    return sendSuccess(res, { user, token, company }, 'Registration successful.', 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    if (!user.isActive) return sendError(res, 'Account disabled.', 403);

    const token = generateToken(user._id);
    logger.auth(`User authenticated: ${email}`);
    return sendSuccess(res, { user, token }, 'Login successful.');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, req.user, 'User profile retrieved.');
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
