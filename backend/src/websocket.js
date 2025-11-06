/**
 * WebSocket Server for Real-time Chat
 * Handles real-time messaging in groups
 */

const WebSocket = require('ws');
const { verifyAccessToken } = require('./utils/auth');
const GroupMember = require('./models/GroupMember');

// Store active connections by group
const groupConnections = new Map();

/**
 * Initialize WebSocket server
 * @param {object} server - HTTP server instance
 */
function initializeWebSocketServer(server) {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  console.log('WebSocket server initialized on /ws');

  wss.on('connection', async (ws, req) => {
    console.log('New WebSocket connection');

    let userId = null;
    let groupId = null;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const { type, token, group_id, content, messageType, betId } = message;

        // Handle authentication
        if (type === 'auth') {
          try {
            const payload = verifyAccessToken(token);
            userId = payload.userId;

            ws.send(JSON.stringify({
              type: 'auth_success',
              message: 'Authenticated successfully',
            }));
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Authentication failed',
            }));
            ws.close();
          }
          return;
        }

        // Require authentication for other operations
        if (!userId) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Not authenticated',
          }));
          return;
        }

        // Handle joining a group
        if (type === 'join_group') {
          if (!group_id) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Group ID required',
            }));
            return;
          }

          // Verify user is member of group
          const isMember = await GroupMember.isMember(group_id, userId);
          if (!isMember) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Not a member of this group',
            }));
            return;
          }

          // Remove from previous group if any
          if (groupId && groupConnections.has(groupId)) {
            const connections = groupConnections.get(groupId);
            connections.delete(ws);
            if (connections.size === 0) {
              groupConnections.delete(groupId);
            }
          }

          // Add to new group
          groupId = group_id;
          if (!groupConnections.has(groupId)) {
            groupConnections.set(groupId, new Set());
          }
          groupConnections.get(groupId).add(ws);

          ws.send(JSON.stringify({
            type: 'joined_group',
            group_id: groupId,
            message: 'Joined group successfully',
          }));

          // Notify other group members
          broadcastToGroup(groupId, {
            type: 'user_joined',
            user_id: userId,
            group_id: groupId,
          }, ws);

          return;
        }

        // Handle leaving a group
        if (type === 'leave_group') {
          if (groupId && groupConnections.has(groupId)) {
            const connections = groupConnections.get(groupId);
            connections.delete(ws);
            if (connections.size === 0) {
              groupConnections.delete(groupId);
            }

            // Notify other group members
            broadcastToGroup(groupId, {
              type: 'user_left',
              user_id: userId,
              group_id: groupId,
            });

            groupId = null;

            ws.send(JSON.stringify({
              type: 'left_group',
              message: 'Left group successfully',
            }));
          }
          return;
        }

        // Handle sending a message
        if (type === 'send_message') {
          if (!groupId) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Not in a group',
            }));
            return;
          }

          if (!content) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Message content required',
            }));
            return;
          }

          // Broadcast message to all group members
          broadcastToGroup(groupId, {
            type: 'new_message',
            group_id: groupId,
            user_id: userId,
            content,
            message_type: messageType || 'text',
            bet_id: betId,
            created_at: new Date().toISOString(),
          });

          return;
        }

        // Handle typing indicator
        if (type === 'typing') {
          if (groupId) {
            broadcastToGroup(groupId, {
              type: 'user_typing',
              group_id: groupId,
              user_id: userId,
            }, ws);
          }
          return;
        }

      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message',
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');

      // Remove from group if connected
      if (groupId && groupConnections.has(groupId)) {
        const connections = groupConnections.get(groupId);
        connections.delete(ws);
        if (connections.size === 0) {
          groupConnections.delete(groupId);
        }

        // Notify other group members
        if (userId) {
          broadcastToGroup(groupId, {
            type: 'user_left',
            user_id: userId,
            group_id: groupId,
          });
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
}

/**
 * Broadcast message to all members of a group
 * @param {string} groupId - Group ID
 * @param {object} message - Message to broadcast
 * @param {WebSocket} exclude - WebSocket to exclude from broadcast
 */
function broadcastToGroup(groupId, message, exclude = null) {
  if (!groupConnections.has(groupId)) {
    return;
  }

  const connections = groupConnections.get(groupId);
  const messageStr = JSON.stringify(message);

  connections.forEach((ws) => {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

/**
 * Send message to specific user in a group
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @param {object} message - Message to send
 */
function sendToUser(groupId, userId, message) {
  // This would require tracking userId -> WebSocket mapping
  // For now, we broadcast to the group
  broadcastToGroup(groupId, message);
}

module.exports = {
  initializeWebSocketServer,
  broadcastToGroup,
  sendToUser,
};
