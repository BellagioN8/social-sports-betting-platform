/**
 * Message Model
 * Database operations for group chat messages
 */

const { query } = require('../config/database');

class Message {
  /**
   * Create a new message
   * @param {object} messageData - Message data
   * @returns {Promise<object>} Created message
   */
  static async create(messageData) {
    const { groupId, userId, content, messageType = 'text', betId } = messageData;

    const sql = `
      INSERT INTO messages (group_id, user_id, content, message_type, bet_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, group_id, user_id, content, message_type, bet_id,
                is_edited, is_deleted, created_at
    `;

    const values = [groupId, userId, content, messageType, betId || null];

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Find message by ID
   * @param {string} id - Message ID
   * @returns {Promise<object|null>} Message or null
   */
  static async findById(id) {
    const sql = `
      SELECT m.id, m.group_id, m.user_id, m.content, m.message_type, m.bet_id,
             m.is_edited, m.edited_at, m.is_deleted, m.deleted_at, m.created_at,
             u.username, u.display_name, u.avatar_url
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = $1
    `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get messages for a group
   * @param {string} groupId - Group ID
   * @param {object} options - Query options
   * @returns {Promise<Array>} Messages array
   */
  static async findByGroupId(groupId, options = {}) {
    const { limit = 50, offset = 0, includeDeleted = false } = options;

    let sql = `
      SELECT m.id, m.group_id, m.user_id, m.content, m.message_type, m.bet_id,
             m.is_edited, m.edited_at, m.is_deleted, m.deleted_at, m.created_at,
             u.username, u.display_name, u.avatar_url
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.group_id = $1
    `;

    if (!includeDeleted) {
      sql += ` AND m.is_deleted = false`;
    }

    sql += ` ORDER BY m.created_at DESC LIMIT $2 OFFSET $3`;

    const result = await query(sql, [groupId, limit, offset]);
    return result.rows.reverse(); // Return in chronological order
  }

  /**
   * Get recent messages (for real-time updates)
   * @param {string} groupId - Group ID
   * @param {Date} since - Get messages since this time
   * @returns {Promise<Array>} Messages array
   */
  static async findRecent(groupId, since) {
    const sql = `
      SELECT m.id, m.group_id, m.user_id, m.content, m.message_type, m.bet_id,
             m.is_edited, m.edited_at, m.is_deleted, m.deleted_at, m.created_at,
             u.username, u.display_name, u.avatar_url
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.group_id = $1 AND m.created_at > $2 AND m.is_deleted = false
      ORDER BY m.created_at ASC
    `;

    const result = await query(sql, [groupId, since]);
    return result.rows;
  }

  /**
   * Update message content
   * @param {string} id - Message ID
   * @param {string} content - New content
   * @returns {Promise<object>} Updated message
   */
  static async update(id, content) {
    const sql = `
      UPDATE messages
      SET content = $1, is_edited = true, edited_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, group_id, user_id, content, message_type, bet_id,
                is_edited, edited_at, is_deleted, created_at
    `;

    const result = await query(sql, [content, id]);
    return result.rows[0];
  }

  /**
   * Delete message (soft delete)
   * @param {string} id - Message ID
   * @returns {Promise<object>} Deleted message
   */
  static async delete(id) {
    const sql = `
      UPDATE messages
      SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP, content = '[deleted]'
      WHERE id = $1
      RETURNING id, group_id, user_id, content, message_type,
                is_edited, is_deleted, deleted_at, created_at
    `;

    const result = await query(sql, [id]);
    return result.rows[0];
  }

  /**
   * Permanently delete message
   * @param {string} id - Message ID
   * @returns {Promise<void>}
   */
  static async permanentDelete(id) {
    const sql = `DELETE FROM messages WHERE id = $1`;
    await query(sql, [id]);
  }

  /**
   * Check if user owns message
   * @param {string} messageId - Message ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Ownership status
   */
  static async isOwner(messageId, userId) {
    const sql = `SELECT 1 FROM messages WHERE id = $1 AND user_id = $2`;
    const result = await query(sql, [messageId, userId]);
    return result.rows.length > 0;
  }

  /**
   * Get message count for a group
   * @param {string} groupId - Group ID
   * @returns {Promise<number>} Message count
   */
  static async getCount(groupId) {
    const sql = `
      SELECT COUNT(*) as count
      FROM messages
      WHERE group_id = $1 AND is_deleted = false
    `;

    const result = await query(sql, [groupId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Search messages in a group
   * @param {string} groupId - Group ID
   * @param {string} searchTerm - Search term
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Messages array
   */
  static async search(groupId, searchTerm, limit = 20) {
    const sql = `
      SELECT m.id, m.group_id, m.user_id, m.content, m.message_type, m.bet_id,
             m.is_edited, m.edited_at, m.is_deleted, m.created_at,
             u.username, u.display_name, u.avatar_url
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.group_id = $1
        AND m.is_deleted = false
        AND m.content ILIKE $2
      ORDER BY m.created_at DESC
      LIMIT $3
    `;

    const result = await query(sql, [groupId, `%${searchTerm}%`, limit]);
    return result.rows;
  }
}

module.exports = Message;
