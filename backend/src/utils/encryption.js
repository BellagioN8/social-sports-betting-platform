/**
 * Encryption Utilities
 * Encrypt/decrypt sensitive bet data
 */

const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Ensure encryption key is valid
if (ENCRYPTION_KEY.length !== 64) {
  console.warn('ENCRYPTION_KEY should be 32 bytes (64 hex characters). Using generated key.');
}

/**
 * Encrypt data
 * @param {object|string} data - Data to encrypt
 * @returns {string} Encrypted data with IV and auth tag
 */
function encrypt(data) {
  try {
    // Convert data to string if it's an object
    const text = typeof data === 'string' ? data : JSON.stringify(data);

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const key = Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt data
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine IV + auth tag + encrypted data
    const combined = iv.toString('hex') + authTag.toString('hex') + encrypted;

    return combined;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data
 * @param {string} encryptedData - Encrypted data with IV and auth tag
 * @returns {object|string} Decrypted data
 */
function decrypt(encryptedData) {
  try {
    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new Error('Invalid encrypted data');
    }

    // Extract IV, auth tag, and encrypted text
    const ivHex = encryptedData.substring(0, IV_LENGTH * 2);
    const authTagHex = encryptedData.substring(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2);
    const encryptedText = encryptedData.substring((IV_LENGTH + AUTH_TAG_LENGTH) * 2);

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Create decipher
    const key = Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt data
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // Try to parse as JSON, return as string if fails
    try {
      return JSON.parse(decrypted);
    } catch (e) {
      return decrypted;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash data (one-way)
 * @param {string} data - Data to hash
 * @returns {string} Hashed data
 */
function hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a secure random token
 * @param {number} length - Length in bytes
 * @returns {string} Random token
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Check if encryption key is configured
 * @returns {boolean} Configuration status
 */
function isConfigured() {
  return process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length === 64;
}

module.exports = {
  encrypt,
  decrypt,
  hash,
  generateToken,
  isConfigured,
};
