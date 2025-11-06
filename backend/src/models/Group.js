/**
 * Group Model
 * Database operations for groups
 */

const { query } = require('../config/database');

class Group {
  /**
   * Create a new group
   * @param {object} groupData - Group data
   * @returns {Promise<object>} Created group
   */
  static async create(groupData) {
    const { name, description, ownerId, avatarUrl, isPrivate, maxMembers } = groupData;

    const sql = `
      INSERT INTO groups (name, description, owner_id, avatar_url, is_private, max_members)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, description, owner_id, avatar_url,
                is_private, is_active, max_members, created_at, updated_at
    `;

    const values = [
      name,
      description || null,
      ownerId,
      avatarUrl || null,
      isPrivate !== undefined ? isPrivate : false,
      maxMembers || 50,
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Find group by ID
   * @param {string} id - Group ID
   * @returns {Promise<object|null>} Group or null
   */
  static async findById(id) {
    const sql = `
      SELECT g.id, g.name, g.description, g.owner_id, g.avatar_url,
             g.is_private, g.is_active, g.max_members, g.created_at, g.updated_at,
             u.username as owner_username, u.display_name as owner_display_name
      FROM groups g
      JOIN users u ON g.owner_id = u.id
      WHERE g.id = $1 AND g.is_active = true
    `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find groups by user ID (groups user is a member of)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Groups array
   */
  static async findByUserId(userId) {
    const sql = `
      SELECT g.id, g.name, g.description, g.owner_id, g.avatar_url,
             g.is_private, g.is_active, g.max_members, g.created_at, g.updated_at,
             gm.role, gm.joined_at,
             u.username as owner_username
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      JOIN users u ON g.owner_id = u.id
      WHERE gm.user_id = $1 AND gm.is_active = true AND g.is_active = true
      ORDER BY gm.joined_at DESC
    `;

    const result = await query(sql, [userId]);
    return result.rows;
  }

  /**
   * Search public groups
   * @param {string} searchTerm - Search term
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Groups array
   */
  static async search(searchTerm, limit = 20) {
    const sql = `
      SELECT g.id, g.name, g.description, g.owner_id, g.avatar_url,
             g.is_private, g.max_members, g.created_at,
             u.username as owner_username,
             (SELECT COUNT(*) FROM group_members gm
              WHERE gm.group_id = g.id AND gm.is_active = true) as member_count
      FROM groups g
      JOIN users u ON g.owner_id = u.id
      WHERE g.is_active = true
        AND g.is_private = false
        AND (g.name ILIKE $1 OR g.description ILIKE $1)
      ORDER BY member_count DESC, g.created_at DESC
      LIMIT $2
    `;

    const result = await query(sql, [`%${searchTerm}%`, limit]);
    return result.rows;
  }

  /**
   * Update group
   * @param {string} id - Group ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} Updated group
   */
  static async update(id, updates) {
    const allowedFields = ['name', 'description', 'avatar_url', 'is_private', 'max_members'];
    const fields = [];
    const values = [];
    let paramCount = 1;

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
      UPDATE groups
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, name, description, owner_id, avatar_url,
                is_private, is_active, max_members, created_at, updated_at
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Deactivate group
   * @param {string} id - Group ID
   * @returns {Promise<void>}
   */
  static async deactivate(id) {
    const sql = `
      UPDATE groups
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await query(sql, [id]);
  }

  /**
   * Delete group (permanently)
   * @param {string} id - Group ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const sql = `DELETE FROM groups WHERE id = $1`;
    await query(sql, [id]);
  }

  /**
   * Get member count
   * @param {string} groupId - Group ID
   * @returns {Promise<number>} Member count
   */
  static async getMemberCount(groupId) {
    const sql = `
      SELECT COUNT(*) as count
      FROM group_members
      WHERE group_id = $1 AND is_active = true
    `;

    const result = await query(sql, [groupId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Check if user is owner
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Owner status
   */
  static async isOwner(groupId, userId) {
    const sql = `SELECT 1 FROM groups WHERE id = $1 AND owner_id = $2`;
    const result = await query(sql, [groupId, userId]);
    return result.rows.length > 0;
  }

  /**
   * Get group statistics
   * @param {string} groupId - Group ID
   * @returns {Promise<object>} Statistics
   */
  static async getStats(groupId) {
    const sql = `
      SELECT * FROM group_stats WHERE id = $1
    `;

    const result = await query(sql, [groupId]);
    return result.rows[0] || null;
  }
}

module.exports = Group;
