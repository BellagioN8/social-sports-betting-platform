/**
 * Request Validation Middleware
 * Validates and sanitizes request bodies
 */

const { sanitizeInput } = require('../utils/validation');

/**
 * Sanitize request body middleware
 * Trims whitespace from string fields
 */
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        req.body[key] = sanitizeInput(value);
      }
    }
  }
  next();
}

/**
 * Validate required fields middleware factory
 * @param {Array<string>} fields - Required field names
 * @returns {Function} Middleware function
 */
function requireFields(fields) {
  return (req, res, next) => {
    const missing = [];

    for (const field of fields) {
      if (!req.body[field]) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missing,
      });
    }

    next();
  };
}

/**
 * Validate request body size
 * Prevents excessively large payloads
 */
function validateBodySize(maxSize = 10240) {
  // maxSize in bytes, default 10KB
  return (req, res, next) => {
    const contentLength = req.headers['content-length'];

    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({
        success: false,
        error: 'Request body too large',
        maxSize: `${maxSize} bytes`,
      });
    }

    next();
  };
}

/**
 * Rate limit by user ID
 * Prevents abuse from authenticated users
 */
const userRateLimits = new Map();

function rateLimit(maxRequests = 10, windowMs = 60000) {
  return (req, res, next) => {
    const identifier = req.userId || req.ip;
    const now = Date.now();

    if (!userRateLimits.has(identifier)) {
      userRateLimits.set(identifier, { count: 1, resetAt: now + windowMs });
      return next();
    }

    const limit = userRateLimits.get(identifier);

    // Reset if window has passed
    if (now > limit.resetAt) {
      userRateLimits.set(identifier, { count: 1, resetAt: now + windowMs });
      return next();
    }

    // Increment count
    limit.count++;

    // Check if limit exceeded
    if (limit.count > maxRequests) {
      const retryAfter = Math.ceil((limit.resetAt - now) / 1000);
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: `${retryAfter} seconds`,
      });
    }

    next();
  };
}

/**
 * Clean up expired rate limit entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [identifier, limit] of userRateLimits.entries()) {
    if (now > limit.resetAt) {
      userRateLimits.delete(identifier);
    }
  }
}, 60000); // Clean up every minute

module.exports = {
  sanitizeBody,
  requireFields,
  validateBodySize,
  rateLimit,
};
