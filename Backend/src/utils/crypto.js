const crypto = require('crypto');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

if (!ENCRYPTION_KEY || Buffer.from(ENCRYPTION_KEY, 'hex').length !== 32) {
  console.warn('WARNING: ENCRYPTION_KEY is missing or invalid. Must be 32 bytes (64 hex chars).');
}

/**
 * Encrypts a plaintext string using AES-256-CBC.
 * Returns a string containing the IV and the encrypted text.
 * @param {string} text The plaintext to encrypt
 * @returns {string} The encrypted string (format: iv:encryptedData)
 */
function encryptToken(text) {
  if (!text) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts an encrypted string (iv:encryptedData) back to plaintext.
 * @param {string} text The encrypted string
 * @returns {string} The decrypted plaintext
 */
function decryptToken(text) {
  if (!text) return text;
  
  // If the string doesn't contain a colon, it's likely not encrypted or uses a different format
  if (!text.includes(':')) {
    console.warn('Attempted to decrypt a string that does not appear to be encrypted.');
    return text;
  }

  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('Error decrypting token:', err.message);
    throw new Error('Failed to decrypt token. Ensure ENCRYPTION_KEY is correct.');
  }
}

module.exports = {
  encryptToken,
  decryptToken
};
