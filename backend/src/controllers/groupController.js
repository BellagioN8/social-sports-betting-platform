/**
 * Group Controller
 * Handles group HTTP requests
 */

const GroupService = require('../services/groupService');
const MessageService = require('../services/messageService');

class GroupController {
  /**
   * Create a new group
   * POST /api/groups
   */
  static async create(req, res) {
    const { name, description, avatarUrl, isPrivate, maxMembers } = req.body;

    const group = await GroupService.createGroup(req.userId, {
      name,
      description,
      avatarUrl,
      isPrivate,
      maxMembers,
    });

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group,
    });
  }

  /**
   * Get group by ID
   * GET /api/groups/:id
   */
  static async getById(req, res) {
    const group = await GroupService.getGroup(req.params.id, req.userId);

    res.json({
      success: true,
      data: group,
    });
  }

  /**
   * Get current user's groups
   * GET /api/groups/my/groups
   */
  static async getMyGroups(req, res) {
    const groups = await GroupService.getUserGroups(req.userId);

    res.json({
      success: true,
      data: {
        groups,
        count: groups.length,
      },
    });
  }

  /**
   * Search public groups
   * GET /api/groups/search
   */
  static async search(req, res) {
    const { q, limit } = req.query;

    const groups = await GroupService.searchGroups(q, limit ? parseInt(limit) : undefined);

    res.json({
      success: true,
      data: {
        groups,
        count: groups.length,
      },
    });
  }

  /**
   * Update group
   * PATCH /api/groups/:id
   */
  static async update(req, res) {
    const { name, description, avatarUrl, isPrivate, maxMembers } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
    if (isPrivate !== undefined) updates.is_private = isPrivate;
    if (maxMembers !== undefined) updates.max_members = maxMembers;

    const group = await GroupService.updateGroup(req.params.id, req.userId, updates);

    res.json({
      success: true,
      message: 'Group updated successfully',
      data: group,
    });
  }

  /**
   * Delete group
   * DELETE /api/groups/:id
   */
  static async delete(req, res) {
    await GroupService.deleteGroup(req.params.id, req.userId);

    res.json({
      success: true,
      message: 'Group deleted successfully',
    });
  }

  /**
   * Join a group
   * POST /api/groups/:id/join
   */
  static async join(req, res) {
    const membership = await GroupService.joinGroup(req.params.id, req.userId);

    res.json({
      success: true,
      message: 'Joined group successfully',
      data: membership,
    });
  }

  /**
   * Leave a group
   * POST /api/groups/:id/leave
   */
  static async leave(req, res) {
    await GroupService.leaveGroup(req.params.id, req.userId);

    res.json({
      success: true,
      message: 'Left group successfully',
    });
  }

  /**
   * Get group members
   * GET /api/groups/:id/members
   */
  static async getMembers(req, res) {
    const members = await GroupService.getMembers(req.params.id, req.userId);

    res.json({
      success: true,
      data: {
        members,
        count: members.length,
      },
    });
  }

  /**
   * Update member role
   * PATCH /api/groups/:id/members/:userId
   */
  static async updateMemberRole(req, res) {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required',
      });
    }

    const member = await GroupService.updateMemberRole(
      req.params.id,
      req.userId,
      req.params.userId,
      role
    );

    res.json({
      success: true,
      message: 'Member role updated successfully',
      data: member,
    });
  }

  /**
   * Remove member from group
   * DELETE /api/groups/:id/members/:userId
   */
  static async removeMember(req, res) {
    await GroupService.removeMember(req.params.id, req.userId, req.params.userId);

    res.json({
      success: true,
      message: 'Member removed successfully',
    });
  }

  /**
   * Send message to group
   * POST /api/groups/:id/messages
   */
  static async sendMessage(req, res) {
    const { content, messageType, betId } = req.body;

    const message = await MessageService.sendMessage(req.userId, req.params.id, {
      content,
      messageType,
      betId,
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message,
    });
  }

  /**
   * Get messages for group
   * GET /api/groups/:id/messages
   */
  static async getMessages(req, res) {
    const { limit, offset } = req.query;

    const options = {
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    };

    const result = await MessageService.getMessages(req.userId, req.params.id, options);

    res.json({
      success: true,
      data: result,
    });
  }

  /**
   * Update message
   * PATCH /api/groups/:groupId/messages/:messageId
   */
  static async updateMessage(req, res) {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
      });
    }

    const message = await MessageService.updateMessage(req.userId, req.params.messageId, content);

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: message,
    });
  }

  /**
   * Delete message
   * DELETE /api/groups/:groupId/messages/:messageId
   */
  static async deleteMessage(req, res) {
    const message = await MessageService.deleteMessage(req.userId, req.params.messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully',
      data: message,
    });
  }

  /**
   * Search messages in group
   * GET /api/groups/:id/messages/search
   */
  static async searchMessages(req, res) {
    const { q, limit } = req.query;

    const messages = await MessageService.searchMessages(
      req.userId,
      req.params.id,
      q,
      limit ? parseInt(limit) : undefined
    );

    res.json({
      success: true,
      data: {
        messages,
        count: messages.length,
      },
    });
  }
}

module.exports = GroupController;
