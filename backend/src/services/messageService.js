/**
 * Message Service
 * Business logic for chat messages
 */

const Message = require('../models/Message');
const GroupMember = require('../models/GroupMember');

class MessageService {
  /**
   * Send a message to a group
   * @param {string} userId - User ID
   * @param {string} groupId - Group ID
   * @param {object} messageData - Message data
   * @returns {Promise<object>} Created message
   */
  static async sendMessage(userId, groupId, messageData) {
    const { content, messageType = 'text', betId } = messageData;

    // Validate content
    if (!content || content.trim().length === 0) {
      throw new Error('Message content required');
    }

    if (content.trim().length > 2000) {
      throw new Error('Message too long (max 2000 characters)');
    }

    // Validate message type
    const validTypes = ['text', 'bet_share', 'system'];
    if (!validTypes.includes(messageType)) {
      throw new Error('Invalid message type');
    }

    // Check if user is member of group
    const isMember = await GroupMember.isMember(groupId, userId);
    if (!isMember) {
      throw new Error('Must be a group member to send messages');
    }

    // Create message
    const message = await Message.create({
      groupId,
      userId,
      content: content.trim(),
      messageType,
      betId,
    });

    // Get user details
    const messageWithUser = await Message.findById(message.id);
    return messageWithUser;
  }

  /**
   * Get messages for a group
   * @param {string} userId - User ID
   * @param {string} groupId - Group ID
   * @param {object} options - Query options
   * @returns {Promise<object>} Messages and metadata
   */
  static async getMessages(userId, groupId, options = {}) {
    // Check if user is member of group
    const isMember = await GroupMember.isMember(groupId, userId);
    if (!isMember) {
      throw new Error('Must be a group member to view messages');
    }

    const messages = await Message.findByGroupId(groupId, options);
    const totalCount = await Message.getCount(groupId);

    return {
      messages,
      count: messages.length,
      total: totalCount,
    };
  }

  /**
   * Update a message
   * @param {string} userId - User ID
   * @param {string} messageId - Message ID
   * @param {string} content - New content
   * @returns {Promise<object>} Updated message
   */
  static async updateMessage(userId, messageId, content) {
    // Validate content
    if (!content || content.trim().length === 0) {
      throw new Error('Message content required');
    }

    if (content.trim().length > 2000) {
      throw new Error('Message too long (max 2000 characters)');
    }

    // Check if user owns message
    const isOwner = await Message.isOwner(messageId, userId);
    if (!isOwner) {
      throw new Error('Can only edit your own messages');
    }

    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Cannot edit deleted messages
    if (message.is_deleted) {
      throw new Error('Cannot edit deleted message');
    }

    const updated = await Message.update(messageId, content.trim());
    return await Message.findById(updated.id);
  }

  /**
   * Delete a message
   * @param {string} userId - User ID
   * @param {string} messageId - Message ID
   * @returns {Promise<object>} Deleted message
   */
  static async deleteMessage(userId, messageId) {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Check if user owns message or is admin
    const isOwner = await Message.isOwner(messageId, userId);
    const isAdmin = await GroupMember.isAdmin(message.group_id, userId);

    if (!isOwner && !isAdmin) {
      throw new Error('Can only delete your own messages or admin can delete any');
    }

    return await Message.delete(messageId);
  }

  /**
   * Search messages in a group
   * @param {string} userId - User ID
   * @param {string} groupId - Group ID
   * @param {string} searchTerm - Search term
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Messages array
   */
  static async searchMessages(userId, groupId, searchTerm, limit = 20) {
    // Check if user is member of group
    const isMember = await GroupMember.isMember(groupId, userId);
    if (!isMember) {
      throw new Error('Must be a group member to search messages');
    }

    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new Error('Search term required');
    }

    return await Message.search(groupId, searchTerm.trim(), limit);
  }
}

module.exports = MessageService;
