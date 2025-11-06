/**
 * Group Service
 * Business logic for group operations
 */

const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');

class GroupService {
  /**
   * Create a new group
   * @param {string} userId - User ID (group owner)
   * @param {object} groupData - Group data
   * @returns {Promise<object>} Created group
   */
  static async createGroup(userId, groupData) {
    const { name, description, avatarUrl, isPrivate, maxMembers } = groupData;

    // Validate required fields
    if (!name || name.trim().length < 3) {
      throw new Error('Group name must be at least 3 characters');
    }

    if (maxMembers && (maxMembers < 1 || maxMembers > 500)) {
      throw new Error('Max members must be between 1 and 500');
    }

    // Create group
    const group = await Group.create({
      name: name.trim(),
      description,
      ownerId: userId,
      avatarUrl,
      isPrivate,
      maxMembers,
    });

    // Add owner as member with 'owner' role
    await GroupMember.add({
      groupId: group.id,
      userId,
      role: 'owner',
    });

    return group;
  }

  /**
   * Get group by ID
   * @param {string} groupId - Group ID
   * @param {string} userId - Requesting user ID
   * @returns {Promise<object>} Group details
   */
  static async getGroup(groupId, userId) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Check if user has access (member or public group)
    const isMember = await GroupMember.isMember(groupId, userId);

    if (group.is_private && !isMember) {
      throw new Error('Access denied to private group');
    }

    // Get member count and stats
    const memberCount = await Group.getMemberCount(groupId);
    const stats = await Group.getStats(groupId);

    // Get user's role if member
    let userRole = null;
    if (isMember) {
      userRole = await GroupMember.getRole(groupId, userId);
    }

    return {
      ...group,
      member_count: memberCount,
      user_role: userRole,
      stats,
    };
  }

  /**
   * Get user's groups
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Groups array
   */
  static async getUserGroups(userId) {
    return await Group.findByUserId(userId);
  }

  /**
   * Search public groups
   * @param {string} searchTerm - Search term
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Groups array
   */
  static async searchGroups(searchTerm, limit = 20) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new Error('Search term required');
    }

    return await Group.search(searchTerm.trim(), limit);
  }

  /**
   * Update group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} Updated group
   */
  static async updateGroup(groupId, userId, updates) {
    // Check if user is owner
    const isOwner = await Group.isOwner(groupId, userId);
    if (!isOwner) {
      throw new Error('Only group owner can update group');
    }

    // Validate name if updating
    if (updates.name && updates.name.trim().length < 3) {
      throw new Error('Group name must be at least 3 characters');
    }

    // Validate max_members if updating
    if (updates.max_members && (updates.max_members < 1 || updates.max_members > 500)) {
      throw new Error('Max members must be between 1 and 500');
    }

    return await Group.update(groupId, updates);
  }

  /**
   * Delete group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async deleteGroup(groupId, userId) {
    // Check if user is owner
    const isOwner = await Group.isOwner(groupId, userId);
    if (!isOwner) {
      throw new Error('Only group owner can delete group');
    }

    await Group.delete(groupId);
  }

  /**
   * Join a group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @returns {Promise<object>} Membership
   */
  static async joinGroup(groupId, userId) {
    const group = await Group.findById(groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    // Check if already a member
    const isMember = await GroupMember.isMember(groupId, userId);
    if (isMember) {
      throw new Error('Already a member of this group');
    }

    // Check if group is at max capacity
    const memberCount = await Group.getMemberCount(groupId);
    if (memberCount >= group.max_members) {
      throw new Error('Group is at maximum capacity');
    }

    // Private groups require invitation (for now, we'll throw error)
    if (group.is_private) {
      throw new Error('Cannot join private group without invitation');
    }

    // Add member
    const membership = await GroupMember.add({
      groupId,
      userId,
      role: 'member',
    });

    return membership;
  }

  /**
   * Leave a group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async leaveGroup(groupId, userId) {
    // Check if member
    const isMember = await GroupMember.isMember(groupId, userId);
    if (!isMember) {
      throw new Error('Not a member of this group');
    }

    // Check if owner (owner cannot leave without transferring ownership or deleting group)
    const isOwner = await Group.isOwner(groupId, userId);
    if (isOwner) {
      throw new Error('Owner cannot leave group. Transfer ownership or delete group instead.');
    }

    await GroupMember.remove(groupId, userId);
  }

  /**
   * Get group members
   * @param {string} groupId - Group ID
   * @param {string} userId - Requesting user ID
   * @returns {Promise<Array>} Members array
   */
  static async getMembers(groupId, userId) {
    // Check if user has access (member or public group)
    const group = await Group.findById(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const isMember = await GroupMember.isMember(groupId, userId);
    if (group.is_private && !isMember) {
      throw new Error('Access denied to private group');
    }

    return await GroupMember.findByGroupId(groupId);
  }

  /**
   * Update member role
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID (requester)
   * @param {string} targetUserId - Target user ID
   * @param {string} newRole - New role
   * @returns {Promise<object>} Updated member
   */
  static async updateMemberRole(groupId, userId, targetUserId, newRole) {
    // Validate role
    const validRoles = ['owner', 'admin', 'member'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Invalid role');
    }

    // Check if requester is owner
    const isOwner = await Group.isOwner(groupId, userId);
    if (!isOwner) {
      throw new Error('Only group owner can update member roles');
    }

    // Cannot change own role
    if (userId === targetUserId) {
      throw new Error('Cannot change your own role');
    }

    // Check if target is a member
    const isMember = await GroupMember.isMember(groupId, targetUserId);
    if (!isMember) {
      throw new Error('User is not a member of this group');
    }

    return await GroupMember.updateRole(groupId, targetUserId, newRole);
  }

  /**
   * Remove member from group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID (requester)
   * @param {string} targetUserId - Target user ID
   * @returns {Promise<void>}
   */
  static async removeMember(groupId, userId, targetUserId) {
    // Check if requester is admin or owner
    const isAdmin = await GroupMember.isAdmin(groupId, userId);
    if (!isAdmin) {
      throw new Error('Only admins can remove members');
    }

    // Cannot remove owner
    const isTargetOwner = await Group.isOwner(groupId, targetUserId);
    if (isTargetOwner) {
      throw new Error('Cannot remove group owner');
    }

    // Cannot remove yourself (use leave instead)
    if (userId === targetUserId) {
      throw new Error('Use leave group to remove yourself');
    }

    await GroupMember.remove(groupId, targetUserId);
  }
}

module.exports = GroupService;
