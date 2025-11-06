# Groups & Chat API Documentation

Base URL: `http://localhost:5000/api/groups`

**All endpoints require authentication** via Bearer token in Authorization header.

## Table of Contents
- [Group Management](#group-management)
- [Group Membership](#group-membership)
- [Chat Messages (HTTP)](#chat-messages-http)
- [Real-time Chat (WebSocket)](#real-time-chat-websocket)

---

## Group Management

### POST /
Create a new group.

**Authorization:** Required

**Request Body:**
```json
{
  "name": "string (required, min 3 chars)",
  "description": "string (optional)",
  "avatarUrl": "string (optional)",
  "isPrivate": "boolean (optional, default: false)",
  "maxMembers": "integer (optional, default: 50, max: 500)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Group created successfully",
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string | null",
    "owner_id": "uuid",
    "avatar_url": "string | null",
    "is_private": "boolean",
    "is_active": true,
    "max_members": "integer",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

**Error Responses:**
- 400: Validation errors (name too short, max_members out of range)
- 401: Not authenticated

**Notes:**
- Group creator is automatically added as owner
- Owner has full control over group settings and members

---

### GET /:id
Get group details.

**Authorization:** Required
**URL Parameters:**
- `id` (uuid): Group ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string | null",
    "owner_id": "uuid",
    "owner_username": "string",
    "owner_display_name": "string",
    "avatar_url": "string | null",
    "is_private": "boolean",
    "is_active": true,
    "max_members": "integer",
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "member_count": "integer",
    "user_role": "string | null",
    "stats": {
      "member_count": "integer",
      "total_bets": "integer",
      "total_messages": "integer"
    }
  }
}
```

**Error Responses:**
- 401: Not authenticated
- 403: Access denied (private group, not a member)
- 404: Group not found

---

### GET /my/groups
Get current user's groups.

**Authorization:** Required

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "id": "uuid",
        "name": "string",
        "description": "string | null",
        "owner_id": "uuid",
        "owner_username": "string",
        "avatar_url": "string | null",
        "is_private": "boolean",
        "max_members": "integer",
        "role": "string (owner/admin/member)",
        "joined_at": "timestamp",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ],
    "count": "integer"
  }
}
```

---

### GET /search
Search public groups.

**Authorization:** Required
**Query Parameters:**
- `q` (required): Search term
- `limit` (optional, default: 20): Max results

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "id": "uuid",
        "name": "string",
        "description": "string | null",
        "owner_id": "uuid",
        "owner_username": "string",
        "avatar_url": "string | null",
        "is_private": false,
        "max_members": "integer",
        "member_count": "integer",
        "created_at": "timestamp"
      }
    ],
    "count": "integer"
  }
}
```

**Error Responses:**
- 400: Missing search term
- 401: Not authenticated

**Notes:**
- Only searches public groups
- Searches in group name and description
- Results ordered by member count and creation date

---

### PATCH /:id
Update group details.

**Authorization:** Required (Owner only)
**URL Parameters:**
- `id` (uuid): Group ID

**Request Body:**
```json
{
  "name": "string (optional, min 3 chars)",
  "description": "string (optional)",
  "avatarUrl": "string (optional)",
  "isPrivate": "boolean (optional)",
  "maxMembers": "integer (optional, 1-500)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Group updated successfully",
  "data": { /* updated group object */ }
}
```

**Error Responses:**
- 400: Validation errors
- 401: Not authenticated
- 403: Not group owner
- 404: Group not found

---

### DELETE /:id
Delete a group permanently.

**Authorization:** Required (Owner only)
**URL Parameters:**
- `id` (uuid): Group ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Group deleted successfully"
}
```

**Error Responses:**
- 401: Not authenticated
- 403: Not group owner
- 404: Group not found

**Notes:**
- Deletion is permanent
- All related data (members, messages, bets) are cascade deleted

---

## Group Membership

### POST /:id/join
Join a public group.

**Authorization:** Required
**URL Parameters:**
- `id` (uuid): Group ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Joined group successfully",
  "data": {
    "id": "uuid",
    "group_id": "uuid",
    "user_id": "uuid",
    "role": "member",
    "joined_at": "timestamp",
    "is_active": true
  }
}
```

**Error Responses:**
- 400: Already a member or group at max capacity
- 401: Not authenticated
- 403: Cannot join private group without invitation
- 404: Group not found

---

### POST /:id/leave
Leave a group.

**Authorization:** Required
**URL Parameters:**
- `id` (uuid): Group ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Left group successfully"
}
```

**Error Responses:**
- 400: Not a member or owner cannot leave (must transfer/delete)
- 401: Not authenticated
- 404: Group not found

**Notes:**
- Owners cannot leave without transferring ownership or deleting group
- Leaving is a soft delete (membership marked inactive)

---

### GET /:id/members
Get all members of a group.

**Authorization:** Required (Member or public group)
**URL Parameters:**
- `id` (uuid): Group ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "uuid",
        "group_id": "uuid",
        "user_id": "uuid",
        "username": "string",
        "display_name": "string",
        "avatar_url": "string | null",
        "email": "string",
        "role": "string (owner/admin/member)",
        "joined_at": "timestamp",
        "is_active": true
      }
    ],
    "count": "integer"
  }
}
```

**Error Responses:**
- 401: Not authenticated
- 403: Access denied (private group, not a member)
- 404: Group not found

---

### PATCH /:id/members/:userId
Update member role.

**Authorization:** Required (Owner only)
**URL Parameters:**
- `id` (uuid): Group ID
- `userId` (uuid): Target user ID

**Request Body:**
```json
{
  "role": "string (required: owner/admin/member)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Member role updated successfully",
  "data": {
    "id": "uuid",
    "group_id": "uuid",
    "user_id": "uuid",
    "role": "string",
    "joined_at": "timestamp",
    "is_active": true
  }
}
```

**Error Responses:**
- 400: Invalid role or cannot change own role
- 401: Not authenticated
- 403: Not group owner
- 404: Group or member not found

---

### DELETE /:id/members/:userId
Remove member from group.

**Authorization:** Required (Admin or Owner)
**URL Parameters:**
- `id` (uuid): Group ID
- `userId` (uuid): Target user ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

**Error Responses:**
- 400: Cannot remove owner or yourself
- 401: Not authenticated
- 403: Not admin/owner
- 404: Group or member not found

**Notes:**
- Cannot remove group owner
- Use leave endpoint to remove yourself
- Admins and owners can remove regular members

---

## Chat Messages (HTTP)

### POST /:id/messages
Send a message to group chat.

**Authorization:** Required (Member only)
**URL Parameters:**
- `id` (uuid): Group ID

**Request Body:**
```json
{
  "content": "string (required, max 2000 chars)",
  "messageType": "string (optional: text/bet_share/system, default: text)",
  "betId": "uuid (optional, for bet_share type)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "uuid",
    "group_id": "uuid",
    "user_id": "uuid",
    "username": "string",
    "display_name": "string",
    "avatar_url": "string | null",
    "content": "string",
    "message_type": "string",
    "bet_id": "uuid | null",
    "is_edited": false,
    "is_deleted": false,
    "created_at": "timestamp"
  }
}
```

**Error Responses:**
- 400: Validation errors (empty content, too long)
- 401: Not authenticated
- 403: Not a group member
- 404: Group not found

---

### GET /:id/messages
Get messages for a group.

**Authorization:** Required (Member only)
**URL Parameters:**
- `id` (uuid): Group ID

**Query Parameters:**
- `limit` (optional, default: 50): Max messages
- `offset` (optional, default: 0): Pagination offset

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "uuid",
        "group_id": "uuid",
        "user_id": "uuid",
        "username": "string",
        "display_name": "string",
        "avatar_url": "string | null",
        "content": "string",
        "message_type": "string",
        "bet_id": "uuid | null",
        "is_edited": "boolean",
        "edited_at": "timestamp | null",
        "is_deleted": "boolean",
        "created_at": "timestamp"
      }
    ],
    "count": "integer",
    "total": "integer"
  }
}
```

---

### GET /:id/messages/search
Search messages in a group.

**Authorization:** Required (Member only)
**URL Parameters:**
- `id` (uuid): Group ID

**Query Parameters:**
- `q` (required): Search term
- `limit` (optional, default: 20): Max results

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "messages": [ /* array of message objects */ ],
    "count": "integer"
  }
}
```

---

### PATCH /:groupId/messages/:messageId
Edit a message.

**Authorization:** Required (Message owner only)
**URL Parameters:**
- `groupId` (uuid): Group ID
- `messageId` (uuid): Message ID

**Request Body:**
```json
{
  "content": "string (required, max 2000 chars)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Message updated successfully",
  "data": {
    /* updated message object with is_edited: true */
  }
}
```

---

### DELETE /:groupId/messages/:messageId
Delete a message.

**Authorization:** Required (Owner or Admin)
**URL Parameters:**
- `groupId` (uuid): Group ID
- `messageId` (uuid): Message ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Message deleted successfully",
  "data": {
    /* message object with is_deleted: true, content: "[deleted]" */
  }
}
```

**Notes:**
- Message owners can delete their own messages
- Admins can delete any message
- Deletion is soft delete (marked as deleted, not removed from database)

---

## Real-time Chat (WebSocket)

WebSocket URL: `ws://localhost:5000/ws`

### Connection Flow

1. **Connect to WebSocket**
   ```javascript
   const ws = new WebSocket('ws://localhost:5000/ws');
   ```

2. **Authenticate**
   ```json
   {
     "type": "auth",
     "token": "your_jwt_token"
   }
   ```

   **Response:**
   ```json
   {
     "type": "auth_success",
     "message": "Authenticated successfully"
   }
   ```

3. **Join a Group**
   ```json
   {
     "type": "join_group",
     "group_id": "uuid"
   }
   ```

   **Response:**
   ```json
   {
     "type": "joined_group",
     "group_id": "uuid",
     "message": "Joined group successfully"
   }
   ```

   **Broadcast to others:**
   ```json
   {
     "type": "user_joined",
     "user_id": "uuid",
     "group_id": "uuid"
   }
   ```

4. **Send Message**
   ```json
   {
     "type": "send_message",
     "content": "Hello everyone!",
     "messageType": "text",
     "betId": "uuid (optional)"
   }
   ```

   **Broadcast to all members:**
   ```json
   {
     "type": "new_message",
     "group_id": "uuid",
     "user_id": "uuid",
     "content": "Hello everyone!",
     "message_type": "text",
     "bet_id": "uuid | null",
     "created_at": "timestamp"
   }
   ```

5. **Typing Indicator**
   ```json
   {
     "type": "typing"
   }
   ```

   **Broadcast to others:**
   ```json
   {
     "type": "user_typing",
     "group_id": "uuid",
     "user_id": "uuid"
   }
   ```

6. **Leave Group**
   ```json
   {
     "type": "leave_group"
   }
   ```

   **Response:**
   ```json
   {
     "type": "left_group",
     "message": "Left group successfully"
   }
   ```

   **Broadcast to others:**
   ```json
   {
     "type": "user_left",
     "user_id": "uuid",
     "group_id": "uuid"
   }
   ```

### WebSocket Message Types

**Client → Server:**
- `auth` - Authenticate with JWT token
- `join_group` - Join a group chat
- `leave_group` - Leave current group
- `send_message` - Send a message
- `typing` - Indicate user is typing

**Server → Client:**
- `auth_success` - Authentication successful
- `joined_group` - Successfully joined group
- `left_group` - Successfully left group
- `new_message` - New message in group
- `user_joined` - Another user joined
- `user_left` - Another user left
- `user_typing` - Another user is typing
- `error` - Error occurred

### Error Handling

Errors are sent as:
```json
{
  "type": "error",
  "message": "Error description"
}
```

Common errors:
- `Authentication failed` - Invalid token
- `Not authenticated` - Must authenticate first
- `Group ID required` - Missing group_id
- `Not a member of this group` - Access denied
- `Not in a group` - Must join group first
- `Message content required` - Empty message

### Privacy Mechanisms

1. **Group Privacy:**
   - Private groups require membership to view/join
   - Public groups are searchable and joinable by anyone

2. **Message Privacy:**
   - Messages only visible to group members
   - Private group messages not accessible to non-members
   - WebSocket messages only broadcast to connected group members

3. **Member Privacy:**
   - Member list only visible to group members (or public groups)
   - Email addresses included in member list (consider making this optional)

4. **Role-Based Access:**
   - Owners have full control
   - Admins can manage members and delete messages
   - Members can send messages and manage their own content

## Example Workflows

### Create and Join Group

1. **User A creates group:**
   ```
   POST /api/groups
   ```

2. **User B searches for group:**
   ```
   GET /api/groups/search?q=sports
   ```

3. **User B joins group:**
   ```
   POST /api/groups/:id/join
   ```

### Real-time Chat

1. **Connect and authenticate:**
   ```javascript
   ws.send(JSON.stringify({ type: 'auth', token: accessToken }));
   ```

2. **Join group:**
   ```javascript
   ws.send(JSON.stringify({ type: 'join_group', group_id: groupId }));
   ```

3. **Send messages:**
   ```javascript
   ws.send(JSON.stringify({
     type: 'send_message',
     content: 'Hello!'
   }));
   ```

4. **Receive messages:**
   ```javascript
   ws.onmessage = (event) => {
     const data = JSON.parse(event.data);
     if (data.type === 'new_message') {
       displayMessage(data);
     }
   };
   ```

## Security Features

- All HTTP endpoints require authentication
- WebSocket requires JWT token authentication
- Member verification before allowing group actions
- Owner/admin verification for privileged operations
- Input validation (message length, group name, etc.)
- Soft deletes for messages (preserves audit trail)
- Privacy controls for groups (public/private)
- Rate limiting inherited from global configuration
