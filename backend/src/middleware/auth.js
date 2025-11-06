/**
 * Authentication Middleware
 * Protects routes requiring authentication
 */

const { verifyAccessToken } = require('../utils/auth');
const User = require('../models/User');

/**
 * Authenticate request middleware
 * Verifies JWT token and adds user to request
 */
async function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided',
      });
    }

    // Check for Bearer token format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format. Use: Bearer <token>',
      });
    }

    const token = parts[1];

    // Verify token
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    // Get user from database
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      });
    }

    // Add user to request
    req.user = User.sanitize(user);
    req.userId = user.id;

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

/**
 * Optional authentication middleware
 * Adds user to request if token is valid, but doesn't require it
 */
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];

    try {
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.userId);

      if (user && user.is_active) {
        req.user = User.sanitize(user);
        req.userId = user.id;
      }
    } catch (error) {
      // Silently fail for optional auth
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next();
  }
}

/**
 * Require verified email middleware
 * Must be used after authenticate middleware
 */
function requireVerified(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  if (!req.user.is_verified) {
    return res.status(403).json({
      success: false,
      error: 'Email verification required',
    });
  }

  next();
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireVerified,
};
