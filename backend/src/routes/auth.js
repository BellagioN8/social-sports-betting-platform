/**
 * Authentication Routes
 * /api/auth endpoints
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { requireFields, sanitizeBody, rateLimit } = require('../middleware/validator');
const { asyncHandler } = require('../middleware/errorHandler');

// Public routes
router.post(
  '/register',
  sanitizeBody,
  requireFields(['username', 'email', 'password']),
  rateLimit(5, 60000), // 5 requests per minute
  asyncHandler(AuthController.register)
);

router.post(
  '/login',
  sanitizeBody,
  requireFields(['password']),
  rateLimit(10, 60000), // 10 requests per minute
  asyncHandler(AuthController.login)
);

router.post(
  '/refresh',
  requireFields(['refreshToken']),
  rateLimit(20, 60000), // 20 requests per minute
  asyncHandler(AuthController.refresh)
);

router.post(
  '/logout',
  requireFields(['refreshToken']),
  asyncHandler(AuthController.logout)
);

// Protected routes (require authentication)
router.post(
  '/logout-all',
  authenticate,
  asyncHandler(AuthController.logoutAll)
);

router.get(
  '/me',
  authenticate,
  asyncHandler(AuthController.getMe)
);

router.patch(
  '/me',
  authenticate,
  sanitizeBody,
  asyncHandler(AuthController.updateMe)
);

router.get(
  '/sessions',
  authenticate,
  asyncHandler(AuthController.getSessions)
);

router.post(
  '/verify-email',
  authenticate,
  asyncHandler(AuthController.verifyEmail)
);

// Health check
router.get('/health', AuthController.health);

module.exports = router;
