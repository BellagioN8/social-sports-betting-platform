/**
 * Refresh Token Model
 * Database operations for refresh tokens
 */

const { query } = require('../config/database');
const { hashToken, calculateTokenExpiration, REFRESH_TOKEN_EXPIRES_IN } = require('../utils/auth');

class RefreshToken {
  /**
   * Create a new refresh token
   * @param {object} tokenData - Token data
   * @returns {Promise<object>} Created token record
   */
  static async create(tokenData) {
    const { userId, token, deviceInfo, ipAddress } = tokenData;

    const tokenHash = hashToken(token);
    const expiresAt = calculateTokenExpiration(REFRESH_TOKEN_EXPIRES_IN);

    const sql = `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info, ip_address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, expires_at, created_at, is_revoked
    `;

    const values = [userId, tokenHash, expiresAt, deviceInfo || null, ipAddress || null];

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Find refresh token by hash
   * @param {string} token - Token to find
   * @returns {Promise<object|null>} Token record or null
   */
  static async findByToken(token) {
    const tokenHash = hashToken(token);

    const sql = `
      SELECT id, user_id, token_hash, expires_at, created_at, revoked_at, is_revoked
      FROM refresh_tokens
      WHERE token_hash = $1 AND is_revoked = false
    `;

    const result = await query(sql, [tokenHash]);
    return result.rows[0] || null;
  }

  /**
   * Find all tokens for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Token records
   */
  static async findByUserId(userId) {
    const sql = `
      SELECT id, user_id, expires_at, created_at, revoked_at, is_revoked, device_info
      FROM refresh_tokens
      WHERE user_id = $1 AND is_revoked = false
      ORDER BY created_at DESC
    `;

    const result = await query(sql, [userId]);
    return result.rows;
  }

  /**
   * Revoke a specific token
   * @param {string} token - Token to revoke
   * @returns {Promise<void>}
   */
  static async revoke(token) {
    const tokenHash = hashToken(token);

    const sql = `
      UPDATE refresh_tokens
      SET is_revoked = true, revoked_at = CURRENT_TIMESTAMP
      WHERE token_hash = $1
    `;

    await query(sql, [tokenHash]);
  }

  /**
   * Revoke all tokens for a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async revokeAllForUser(userId) {
    const sql = `
      UPDATE refresh_tokens
      SET is_revoked = true, revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_revoked = false
    `;

    await query(sql, [userId]);
  }

  /**
   * Check if token is valid (not revoked and not expired)
   * @param {string} token - Token to check
   * @returns {Promise<boolean>} Valid status
   */
  static async isValid(token) {
    const tokenRecord = await this.findByToken(token);

    if (!tokenRecord) {
      return false;
    }

    // Check if expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return false;
    }

    return !tokenRecord.is_revoked;
  }

  /**
   * Clean up expired tokens
   * @returns {Promise<number>} Number of tokens deleted
   */
  static async cleanupExpired() {
    const sql = `
      DELETE FROM refresh_tokens
      WHERE expires_at < CURRENT_TIMESTAMP OR is_revoked = true
    `;

    const result = await query(sql);
    return result.rowCount;
  }

  /**
   * Get token count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Token count
   */
  static async countForUser(userId) {
    const sql = `
      SELECT COUNT(*) as count
      FROM refresh_tokens
      WHERE user_id = $1 AND is_revoked = false AND expires_at > CURRENT_TIMESTAMP
    `;

    const result = await query(sql, [userId]);
    return parseInt(result.rows[0].count);
  }
}

module.exports = RefreshToken;
