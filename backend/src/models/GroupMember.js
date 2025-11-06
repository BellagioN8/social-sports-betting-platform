/**
 * Group Member Model
 * Database operations for group membership
 */

const { query } = require('../config/database');

class GroupMember {
  /**
   * Add member to group
   * @param {object} memberData - Member data
   * @returns {Promise<object>} Created membership
   */
  static async add(memberData) {
    const { groupId, userId, role = 'member' } = memberData;

    const sql = `
      INSERT INTO group_members (group_id, user_id, role)
      VALUES ($1, $2, $3)
      RETURNING id, group_id, user_id, role, joined_at, is_active
    `;

    const result = await query(sql, [groupId, userId, role]);
    return result.rows[0];
  }

  /**
   * Find member by group and user ID
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} Member or null
   */
  static async findByGroupAndUser(groupId, userId) {
    const sql = `
      SELECT gm.id, gm.group_id, gm.user_id, gm.role, gm.joined_at, gm.is_active,
             u.username, u.display_name, u.avatar_url
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = $1 AND gm.user_id = $2
    `;

    const result = await query(sql, [groupId, userId]);
    return result.rows[0] || null;
  }

  /**
   * Get all members of a group
   * @param {string} groupId - Group ID
   * @param {boolean} activeOnly - Include only active members
   * @returns {Promise<Array>} Members array
   */
  static async findByGroupId(groupId, activeOnly = true) {
    let sql = `
      SELECT gm.id, gm.group_id, gm.user_id, gm.role, gm.joined_at, gm.is_active,
             u.username, u.display_name, u.avatar_url, u.email
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = $1
    `;

    if (activeOnly) {
      sql += ` AND gm.is_active = true`;
    }

    sql += ` ORDER BY gm.joined_at ASC`;

    const result = await query(sql, [groupId]);
    return result.rows;
  }

  /**
   * Update member role
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @param {string} role - New role
   * @returns {Promise<object>} Updated member
   */
  static async updateRole(groupId, userId, role) {
    const sql = `
      UPDATE group_members
      SET role = $1
      WHERE group_id = $2 AND user_id = $3
      RETURNING id, group_id, user_id, role, joined_at, is_active
    `;

    const result = await query(sql, [role, groupId, userId]);
    return result.rows[0];
  }

  /**
   * Remove member from group (soft delete)
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async remove(groupId, userId) {
    const sql = `
      UPDATE group_members
      SET is_active = false
      WHERE group_id = $1 AND user_id = $2
    `;

    await query(sql, [groupId, userId]);
  }

  /**
   * Permanently delete member
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async delete(groupId, userId) {
    const sql = `
      DELETE FROM group_members
      WHERE group_id = $1 AND user_id = $2
    `;

    await query(sql, [groupId, userId]);
  }

  /**
   * Check if user is member of group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Membership status
   */
  static async isMember(groupId, userId) {
    const sql = `
      SELECT 1 FROM group_members
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;

    const result = await query(sql, [groupId, userId]);
    return result.rows.length > 0;
  }

  /**
   * Check if user has admin or owner role
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Admin status
   */
  static async isAdmin(groupId, userId) {
    const sql = `
      SELECT 1 FROM group_members
      WHERE group_id = $1 AND user_id = $2 AND role IN ('owner', 'admin') AND is_active = true
    `;

    const result = await query(sql, [groupId, userId]);
    return result.rows.length > 0;
  }

  /**
   * Get member role
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @returns {Promise<string|null>} Role or null
   */
  static async getRole(groupId, userId) {
    const sql = `
      SELECT role FROM group_members
      WHERE group_id = $1 AND user_id = $2 AND is_active = true
    `;

    const result = await query(sql, [groupId, userId]);
    return result.rows[0]?.role || null;
  }

  /**
   * Reactivate member (if previously removed)
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @returns {Promise<object>} Reactivated member
   */
  static async reactivate(groupId, userId) {
    const sql = `
      UPDATE group_members
      SET is_active = true
      WHERE group_id = $1 AND user_id = $2
      RETURNING id, group_id, user_id, role, joined_at, is_active
    `;

    const result = await query(sql, [groupId, userId]);
    return result.rows[0];
  }
}

module.exports = GroupMember;
