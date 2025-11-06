# Bet Management API Documentation

Base URL: `http://localhost:5000/api/bets`

**All endpoints require authentication** via Bearer token in Authorization header.

## Endpoints

### POST /
Create a new bet.

**Authorization:** Required
**Request Body:**
```json
{
  "gameId": "string (required, external game identifier)",
  "sportType": "string (required, one of: football, basketball, baseball, soccer, hockey, other)",
  "homeTeam": "string (required)",
  "awayTeam": "string (required)",
  "gameDate": "string (required, ISO 8601 date)",
  "betType": "string (required, e.g., 'spread', 'moneyline', 'over/under')",
  "betDetails": "object (required, encrypted, contains specific bet information)",
  "predictedOutcome": "string (required, user's prediction)",
  "confidenceLevel": "integer (optional, 1-5)",
  "groupId": "uuid (optional, if betting in a group)",
  "notes": "string (optional)",
  "isPublic": "boolean (optional, default: false)"
}
```

**Example Request:**
```json
{
  "gameId": "nfl_game_12345",
  "sportType": "football",
  "homeTeam": "Dallas Cowboys",
  "awayTeam": "Philadelphia Eagles",
  "gameDate": "2024-12-15T20:00:00Z",
  "betType": "spread",
  "betDetails": {
    "spread": -3.5,
    "odds": -110,
    "amount": 100
  },
  "predictedOutcome": "Cowboys -3.5",
  "confidenceLevel": 4,
  "notes": "Cowboys at home, strong defense",
  "isPublic": true
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Bet created successfully",
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "group_id": "uuid | null",
    "game_id": "string",
    "sport_type": "string",
    "home_team": "string",
    "away_team": "string",
    "game_date": "timestamp",
    "bet_type": "string",
    "predicted_outcome": "string",
    "confidence_level": "integer | null",
    "status": "pending",
    "notes": "string | null",
    "is_public": "boolean",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

**Error Responses:**
- 400: Missing required fields or validation errors
- 401: Not authenticated
- 500: Server error

**Notes:**
- `betDetails` is encrypted before storage using AES-256-GCM
- Only `status`, `actual_outcome`, `is_correct`, and `resolved_at` are returned (not encrypted details)

---

### GET /:id
Get a specific bet by ID.

**Authorization:** Required
**URL Parameters:**
- `id` (uuid): Bet ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "group_id": "uuid | null",
    "game_id": "string",
    "sport_type": "string",
    "home_team": "string",
    "away_team": "string",
    "game_date": "timestamp",
    "bet_type": "string",
    "bet_details": "object (decrypted)",
    "predicted_outcome": "string",
    "confidence_level": "integer | null",
    "status": "string",
    "actual_outcome": "string | null",
    "is_correct": "boolean | null",
    "resolved_at": "timestamp | null",
    "notes": "string | null",
    "is_public": "boolean",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

**Error Responses:**
- 401: Not authenticated
- 403: Access denied (bet is private and not owned by user)
- 404: Bet not found

**Notes:**
- `betDetails` is decrypted and returned for the bet owner
- Private bets are only accessible to their owners

---

### GET /my/bets
Get current user's bets with optional filtering.

**Authorization:** Required
**Query Parameters:**
- `status` (optional): Filter by status (pending, won, lost, cancelled, void)
- `sportType` (optional): Filter by sport
- `groupId` (optional): Filter by group
- `limit` (optional, default: 50): Max results
- `offset` (optional, default: 0): Pagination offset

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "bets": [ /* array of bet objects */ ],
    "stats": {
      "total_bets": "number",
      "bets_won": "number",
      "bets_lost": "number",
      "bets_pending": "number",
      "bets_cancelled": "number",
      "win_percentage": "number"
    },
    "sportStats": [
      {
        "sport_type": "string",
        "total": "number",
        "won": "number",
        "lost": "number",
        "win_percentage": "number"
      }
    ],
    "count": "number"
  }
}
```

**Error Responses:**
- 401: Not authenticated

---

### GET /my/stats
Get betting statistics for current user.

**Authorization:** Required

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "overall": {
      "total_bets": "number",
      "bets_won": "number",
      "bets_lost": "number",
      "bets_pending": "number",
      "bets_cancelled": "number",
      "win_percentage": "number"
    },
    "bySport": [
      {
        "sport_type": "string",
        "total": "number",
        "won": "number",
        "lost": "number",
        "win_percentage": "number"
      }
    ]
  }
}
```

**Error Responses:**
- 401: Not authenticated

---

### GET /group/:groupId
Get bets for a specific group.

**Authorization:** Required
**URL Parameters:**
- `groupId` (uuid): Group ID

**Query Parameters:**
- `status` (optional): Filter by status
- `sportType` (optional): Filter by sport
- `limit` (optional, default: 50): Max results
- `offset` (optional, default: 0): Pagination offset

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "bets": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "username": "string",
        "display_name": "string",
        /* ...other bet fields */
      }
    ],
    "count": "number"
  }
}
```

**Error Responses:**
- 401: Not authenticated

**Notes:**
- Only public bets are shown in group view
- Includes user information (username, display_name) for each bet

---

### GET /game/:gameId
Get bets for a specific game.

**Authorization:** Required
**URL Parameters:**
- `gameId` (string): External game identifier

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "bets": [ /* array of bet objects */ ],
    "count": "number"
  }
}
```

**Error Responses:**
- 401: Not authenticated

**Notes:**
- Returns user's own bets and all public bets for the game
- Private bets from other users are not included

---

### PATCH /:id
Update a pending bet.

**Authorization:** Required
**URL Parameters:**
- `id` (uuid): Bet ID

**Request Body:**
```json
{
  "predictedOutcome": "string (optional)",
  "confidenceLevel": "integer (optional, 1-5)",
  "notes": "string (optional)",
  "isPublic": "boolean (optional)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bet updated successfully",
  "data": { /* updated bet object */ }
}
```

**Error Responses:**
- 400: Validation errors or bet already resolved
- 401: Not authenticated
- 403: Access denied (not bet owner)
- 404: Bet not found

**Notes:**
- Only pending bets can be updated
- Cannot update `betDetails` after creation (security requirement)

---

### POST /:id/resolve
Resolve a bet as won or lost.

**Authorization:** Required
**URL Parameters:**
- `id` (uuid): Bet ID

**Request Body:**
```json
{
  "actualOutcome": "string (required, actual game outcome)",
  "isCorrect": "boolean (required, whether bet was correct)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bet resolved successfully",
  "data": {
    /* bet object with updated status, actual_outcome, is_correct, resolved_at */
  }
}
```

**Error Responses:**
- 400: Missing required fields or bet already resolved
- 401: Not authenticated
- 403: Access denied (not bet owner)
- 404: Bet not found

**Notes:**
- Status is automatically set to 'won' or 'lost' based on `isCorrect`
- `resolved_at` is set to current timestamp
- Only pending bets can be resolved

---

### POST /:id/cancel
Cancel a pending bet.

**Authorization:** Required
**URL Parameters:**
- `id` (uuid): Bet ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bet cancelled successfully",
  "data": { /* cancelled bet object */ }
}
```

**Error Responses:**
- 400: Bet already resolved or cancelled
- 401: Not authenticated
- 403: Access denied (not bet owner)
- 404: Bet not found

**Notes:**
- Only pending bets can be cancelled
- Cancelled bets remain in the database with status 'cancelled'

---

### DELETE /:id
Delete a bet.

**Authorization:** Required
**URL Parameters:**
- `id` (uuid): Bet ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bet deleted successfully"
}
```

**Error Responses:**
- 400: Cannot delete resolved bet
- 401: Not authenticated
- 403: Access denied (not bet owner)
- 404: Bet not found

**Notes:**
- Only pending or cancelled bets can be deleted
- Resolved bets (won/lost) cannot be deleted (for record keeping)
- Deletion is permanent

---

## Bet Status Flow

```
pending → won/lost (via resolve)
pending → cancelled (via cancel)
cancelled → [can be deleted]
pending → [can be deleted]
```

## Sport Types

Valid sport types:
- `football`
- `basketball`
- `baseball`
- `soccer`
- `hockey`
- `other`

## Security Features

### Encryption
- **Bet Details Encryption**: Sensitive bet information (`betDetails`) is encrypted using AES-256-GCM before storage
- **Decryption**: Only bet owners can decrypt and view full bet details
- **Public Bets**: Even public bets have encrypted details; only prediction and outcome are publicly visible

### Access Control
- **Owner Verification**: All update/delete operations verify bet ownership
- **Private Bets**: Only accessible to the bet creator
- **Public Bets**: Visible to group members and in game views

### Data Protection
- All endpoints require authentication
- Rate limiting prevents abuse
- Input validation and sanitization
- SQL injection protection via parameterized queries

## Example Workflows

### Create and Track a Bet

1. **Create Bet:**
   ```
   POST /api/bets
   ```

2. **View Bet:**
   ```
   GET /api/bets/:id
   ```

3. **Update Prediction (before game):**
   ```
   PATCH /api/bets/:id
   ```

4. **Resolve After Game:**
   ```
   POST /api/bets/:id/resolve
   ```

5. **View Statistics:**
   ```
   GET /api/bets/my/stats
   ```

### Group Betting

1. **Create bet with groupId:**
   ```
   POST /api/bets
   { "groupId": "...", "isPublic": true, ... }
   ```

2. **View group bets:**
   ```
   GET /api/bets/group/:groupId
   ```

3. **View bets for specific game:**
   ```
   GET /api/bets/game/:gameId
   ```

## Error Response Format

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Environment Variables

Encryption configuration in `.env`:
```env
# Encryption (32 bytes = 64 hex characters)
ENCRYPTION_KEY=your_64_character_hex_key_here
```

Generate a secure key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
