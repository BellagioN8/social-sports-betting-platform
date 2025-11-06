/**
 * User Model
 * Database operations for users
 */

const { query } = require('../config/database');
const { hashPassword } = require('../utils/auth');

class User {
  /**
   * Create a new user
   * @param {object} userData - User data
   * @returns {Promise<object>} Created user
   */
  static async create(userData) {
    const { username, email, password, display_name, bio } = userData;

    // Hash password
    const password_hash = await hashPassword(password);

    const sql = `
      INSERT INTO users (username, email, password_hash, display_name, bio)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, display_name, avatar_url, bio,
                is_active, is_verified, created_at, updated_at
    `;

    const values = [
      username,
      email.toLowerCase(),
      password_hash,
      display_name || username,
      bio || null,
    ];

    try {
      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.constraint === 'users_username_key') {
          throw new Error('Username already exists');
        }
        if (error.constraint === 'users_email_key') {
          throw new Error('Email already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<object|null>} User or null
   */
  static async findById(id) {
    const sql = `
      SELECT id, username, email, display_name, avatar_url, bio,
             is_active, is_verified, email_verified_at,
             created_at, updated_at, last_login_at
      FROM users
      WHERE id = $1 AND is_active = true
    `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<object|null>} User or null
   */
  static async findByEmail(email) {
    const sql = `
      SELECT id, username, email, password_hash, display_name, avatar_url, bio,
             is_active, is_verified, email_verified_at,
             created_at, updated_at, last_login_at
      FROM users
      WHERE email = $1 AND is_active = true
    `;

    const result = await query(sql, [email.toLowerCase()]);
    return result.rows[0] || null;
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<object|null>} User or null
   */
  static async findByUsername(username) {
    const sql = `
      SELECT id, username, email, password_hash, display_name, avatar_url, bio,
             is_active, is_verified, email_verified_at,
             created_at, updated_at, last_login_at
      FROM users
      WHERE username = $1 AND is_active = true
    `;

    const result = await query(sql, [username]);
    return result.rows[0] || null;
  }

  /**
   * Find user by email or username
   * @param {string} credential - Email or username
   * @returns {Promise<object|null>} User or null
   */
  static async findByCredential(credential) {
    const sql = `
      SELECT id, username, email, password_hash, display_name, avatar_url, bio,
             is_active, is_verified, email_verified_at,
             created_at, updated_at, last_login_at
      FROM users
      WHERE (email = $1 OR username = $1) AND is_active = true
    `;

    const result = await query(sql, [credential.toLowerCase()]);
    return result.rows[0] || null;
  }

  /**
   * Update user's last login time
   * @param {string} id - User ID
   * @returns {Promise<void>}
   */
  static async updateLastLogin(id) {
    const sql = `
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await query(sql, [id]);
  }

  /**
   * Update user profile
   * @param {string} id - User ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} Updated user
   */
  static async update(id, updates) {
    const allowedFields = ['display_name', 'bio', 'avatar_url'];
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic update query
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);

    const sql = `
      UPDATE users
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, username, email, display_name, avatar_url, bio,
                is_active, is_verified, created_at, updated_at
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Verify user email
   * @param {string} id - User ID
   * @returns {Promise<void>}
   */
  static async verifyEmail(id) {
    const sql = `
      UPDATE users
      SET is_verified = true, email_verified_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await query(sql, [id]);
  }

  /**
   * Deactivate user account
   * @param {string} id - User ID
   * @returns {Promise<void>}
   */
  static async deactivate(id) {
    const sql = `
      UPDATE users
      SET is_active = false
      WHERE id = $1
    `;

    await query(sql, [id]);
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} Exists status
   */
  static async emailExists(email) {
    const sql = `
      SELECT 1 FROM users WHERE email = $1
    `;

    const result = await query(sql, [email.toLowerCase()]);
    return result.rows.length > 0;
  }

  /**
   * Check if username exists
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} Exists status
   */
  static async usernameExists(username) {
    const sql = `
      SELECT 1 FROM users WHERE username = $1
    `;

    const result = await query(sql, [username]);
    return result.rows.length > 0;
  }

  /**
   * Get user statistics
   * @param {string} id - User ID
   * @returns {Promise<object>} User statistics
   */
  static async getStats(id) {
    const sql = `
      SELECT * FROM user_stats WHERE id = $1
    `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Remove password_hash from user object (for safe responses)
   * @param {object} user - User object
   * @returns {object} User without password_hash
   */
  static sanitize(user) {
    if (!user) return null;

    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

module.exports = User;
