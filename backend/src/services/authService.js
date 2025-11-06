/**
 * Authentication Service
 * Business logic for authentication operations
 */

const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/auth');
const { validateRegistration, validateLogin } = require('../utils/validation');

class AuthService {
  /**
   * Register a new user
   * @param {object} userData - User registration data
   * @param {object} metadata - Request metadata (IP, device info)
   * @returns {Promise<object>} User and tokens
   */
  static async register(userData, metadata = {}) {
    const startTime = Date.now();

    // Validate input
    const validation = validateRegistration(userData);
    if (!validation.valid) {
      throw new Error(JSON.stringify(validation.errors));
    }

    // Check if user already exists
    const emailExists = await User.emailExists(userData.email);
    if (emailExists) {
      throw new Error('Email already registered');
    }

    const usernameExists = await User.usernameExists(userData.username);
    if (usernameExists) {
      throw new Error('Username already taken');
    }

    // Create user
    const user = await User.create(userData);

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

    // Store refresh token
    await RefreshToken.create({
      userId: user.id,
      token: refreshToken,
      deviceInfo: metadata.deviceInfo,
      ipAddress: metadata.ipAddress,
    });

    // Update last login
    await User.updateLastLogin(user.id);

    const duration = Date.now() - startTime;

    // Log performance (should be under 2 seconds as per success criteria)
    if (duration > 2000) {
      console.warn(`User registration took ${duration}ms (exceeds 2s requirement)`);
    }

    return {
      user: User.sanitize(user),
      accessToken,
      refreshToken,
      registrationTime: duration,
    };
  }

  /**
   * Login a user
   * @param {object} credentials - Login credentials
   * @param {object} metadata - Request metadata
   * @returns {Promise<object>} User and tokens
   */
  static async login(credentials, metadata = {}) {
    // Validate input
    const validation = validateLogin(credentials);
    if (!validation.valid) {
      throw new Error(JSON.stringify(validation.errors));
    }

    // Find user by email or username
    const credential = credentials.email || credentials.username;
    const user = await User.findByCredential(credential);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await comparePassword(credentials.password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

    // Store refresh token
    await RefreshToken.create({
      userId: user.id,
      token: refreshToken,
      deviceInfo: metadata.deviceInfo,
      ipAddress: metadata.ipAddress,
    });

    // Update last login
    await User.updateLastLogin(user.id);

    return {
      user: User.sanitize(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<object>} New access token
   */
  static async refreshAccessToken(refreshToken) {
    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }

    // Check if token is revoked or expired in database
    const isValid = await RefreshToken.isValid(refreshToken);
    if (!isValid) {
      throw new Error('Refresh token has been revoked or expired');
    }

    // Get user
    const user = await User.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    return {
      accessToken,
      user: User.sanitize(user),
    };
  }

  /**
   * Logout a user (revoke refresh token)
   * @param {string} refreshToken - Refresh token to revoke
   * @returns {Promise<void>}
   */
  static async logout(refreshToken) {
    if (!refreshToken) {
      throw new Error('Refresh token required');
    }

    await RefreshToken.revoke(refreshToken);
  }

  /**
   * Logout all sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async logoutAll(userId) {
    await RefreshToken.revokeAllForUser(userId);
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<object>} User profile with stats
   */
  static async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const stats = await User.getStats(userId);

    return {
      ...User.sanitize(user),
      stats,
    };
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {object} updates - Profile updates
   * @returns {Promise<object>} Updated user
   */
  static async updateProfile(userId, updates) {
    const user = await User.update(userId, updates);
    return User.sanitize(user);
  }

  /**
   * Verify user email
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async verifyEmail(userId) {
    await User.verifyEmail(userId);
  }

  /**
   * Get active sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Active sessions
   */
  static async getActiveSessions(userId) {
    return await RefreshToken.findByUserId(userId);
  }
}

module.exports = AuthService;
