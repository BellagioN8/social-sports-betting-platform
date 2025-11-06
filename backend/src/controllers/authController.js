/**
 * Authentication Controller
 * Handles authentication HTTP requests
 */

const AuthService = require('../services/authService');

class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  static async register(req, res) {
    const { username, email, password, display_name, bio } = req.body;

    // Get request metadata
    const metadata = {
      deviceInfo: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
    };

    const result = await AuthService.register(
      { username, email, password, display_name, bio },
      metadata
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      meta: {
        registrationTime: `${result.registrationTime}ms`,
      },
    });
  }

  /**
   * Login a user
   * POST /api/auth/login
   */
  static async login(req, res) {
    const { email, username, password } = req.body;

    // Get request metadata
    const metadata = {
      deviceInfo: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress,
    };

    const result = await AuthService.login({ email, username, password }, metadata);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  static async refresh(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required',
      });
    }

    const result = await AuthService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  }

  /**
   * Logout user (revoke refresh token)
   * POST /api/auth/logout
   */
  static async logout(req, res) {
    const { refreshToken } = req.body;

    await AuthService.logout(refreshToken);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  /**
   * Logout from all sessions
   * POST /api/auth/logout-all
   * Requires authentication
   */
  static async logoutAll(req, res) {
    await AuthService.logoutAll(req.userId);

    res.json({
      success: true,
      message: 'Logged out from all sessions',
    });
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   * Requires authentication
   */
  static async getMe(req, res) {
    const profile = await AuthService.getProfile(req.userId);

    res.json({
      success: true,
      data: profile,
    });
  }

  /**
   * Update user profile
   * PATCH /api/auth/me
   * Requires authentication
   */
  static async updateMe(req, res) {
    const { display_name, bio, avatar_url } = req.body;

    const user = await AuthService.updateProfile(req.userId, {
      display_name,
      bio,
      avatar_url,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  }

  /**
   * Get active sessions
   * GET /api/auth/sessions
   * Requires authentication
   */
  static async getSessions(req, res) {
    const sessions = await AuthService.getActiveSessions(req.userId);

    res.json({
      success: true,
      data: {
        sessions,
        count: sessions.length,
      },
    });
  }

  /**
   * Verify email
   * POST /api/auth/verify-email
   * Requires authentication
   */
  static async verifyEmail(req, res) {
    // In a real app, this would verify a token sent via email
    // For now, we'll just mark the user as verified
    await AuthService.verifyEmail(req.userId);

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  }

  /**
   * Health check endpoint
   * GET /api/auth/health
   */
  static async health(req, res) {
    res.json({
      success: true,
      message: 'Auth service is running',
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = AuthController;
