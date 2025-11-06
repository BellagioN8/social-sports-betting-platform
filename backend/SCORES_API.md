# Live Scores API Documentation

Base URL: `http://localhost:5000/api/scores`

**All endpoints require authentication** via Bearer token in Authorization header.

## Table of Contents
- [Overview](#overview)
- [Sport Types](#sport-types)
- [Game Status](#game-status)
- [Live Scores](#live-scores)
- [Upcoming Games](#upcoming-games)
- [Historical Scores](#historical-scores)
- [Game Details](#game-details)
- [Cache Management](#cache-management)
- [Background Job Management](#background-job-management)

---

## Overview

The Live Scores API provides real-time and cached sports game data across multiple sports. The system implements a caching strategy to minimize API calls and ensure fast response times:

- **Cache TTL**: 5 minutes (configurable via `CACHE_TTL` env var)
- **Update Interval**: 60 seconds (configurable via `SCORE_UPDATE_INTERVAL` env var)
- **Background Updates**: Automatic periodic refresh of live scores
- **Data Retention**: Old scores cleaned up after 7 days

---

## Sport Types

Valid sport types for API requests:
- `football` - American Football
- `basketball` - Basketball
- `baseball` - Baseball
- `soccer` - Soccer/Football
- `hockey` - Ice Hockey
- `other` - Other sports

---

## Game Status

Valid game status values:
- `scheduled` - Game is scheduled but hasn't started
- `live` - Game is currently in progress
- `halftime` - Game is at halftime/intermission
- `final` - Game has completed
- `postponed` - Game has been postponed
- `cancelled` - Game has been cancelled

---

## Live Scores

### GET /:sport/live
Get live scores for a specific sport with caching.

**Authorization:** Required

**URL Parameters:**
- `sport` (string): Sport type (football/basketball/baseball/soccer/hockey/other)

**Query Parameters:**
- `forceRefresh` (boolean, optional): Force API fetch instead of using cache

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "live": [
      {
        "id": "uuid",
        "game_id": "string",
        "sport_type": "string",
        "home_team": "string",
        "away_team": "string",
        "home_team_logo": "string | null",
        "away_team_logo": "string | null",
        "home_score": "integer",
        "away_score": "integer",
        "status": "live",
        "period": "string",
        "time_remaining": "string",
        "scheduled_at": "timestamp",
        "started_at": "timestamp",
        "completed_at": "timestamp | null",
        "venue": "string",
        "metadata": "object",
        "last_updated": "timestamp",
        "created_at": "timestamp"
      }
    ],
    "upcoming": [
      /* next 5 scheduled games */
    ],
    "recent": [
      /* last 5 completed games in past 24 hours */
    ],
    "cacheAge": "integer (seconds)",
    "lastUpdate": "timestamp"
  }
}
```

**Error Responses:**
- 400: Invalid sport type
- 401: Not authenticated

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/scores/football/live"
```

**Notes:**
- Returns live games, upcoming games (next 5), and recent games (past 24 hours)
- Automatically refreshes from API if cache is stale (older than TTL)
- Use `forceRefresh=true` to bypass cache

---

## Upcoming Games

### GET /:sport/upcoming
Get upcoming scheduled games for a specific sport.

**Authorization:** Required

**URL Parameters:**
- `sport` (string): Sport type

**Query Parameters:**
- `days` (integer, optional): Days ahead to fetch (default: 7, max: 14)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "games": [
      {
        "id": "uuid",
        "game_id": "string",
        "sport_type": "string",
        "home_team": "string",
        "away_team": "string",
        "home_team_logo": "string | null",
        "away_team_logo": "string | null",
        "status": "scheduled",
        "scheduled_at": "timestamp",
        "venue": "string",
        "metadata": "object"
      }
    ],
    "count": "integer",
    "days": "integer"
  }
}
```

**Error Responses:**
- 400: Invalid sport type or days parameter out of range
- 401: Not authenticated

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/scores/basketball/upcoming?days=3"
```

---

## Historical Scores

### GET /:sport/range
Get scores by date range for a specific sport.

**Authorization:** Required

**URL Parameters:**
- `sport` (string): Sport type

**Query Parameters:**
- `startDate` (string, required): Start date (ISO format: YYYY-MM-DD)
- `endDate` (string, required): End date (ISO format: YYYY-MM-DD)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "scores": [
      {
        "id": "uuid",
        "game_id": "string",
        "sport_type": "string",
        "home_team": "string",
        "away_team": "string",
        "home_score": "integer",
        "away_score": "integer",
        "status": "string",
        "scheduled_at": "timestamp",
        "completed_at": "timestamp | null"
      }
    ],
    "count": "integer",
    "startDate": "timestamp",
    "endDate": "timestamp"
  }
}
```

**Error Responses:**
- 400: Missing dates, invalid date format, or date range exceeds 7 days
- 401: Not authenticated

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/scores/soccer/range?startDate=2024-01-15&endDate=2024-01-16"
```

**Notes:**
- Date range cannot exceed 7 days
- Start date must be before end date
- Dates must be in ISO format (YYYY-MM-DD)

---

## Game Details

### GET /game/:gameId
Get detailed information for a specific game.

**Authorization:** Required

**URL Parameters:**
- `gameId` (string): Unique game identifier

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "game_id": "string",
    "sport_type": "string",
    "home_team": "string",
    "away_team": "string",
    "home_team_logo": "string | null",
    "away_team_logo": "string | null",
    "home_score": "integer",
    "away_score": "integer",
    "status": "string",
    "period": "string",
    "time_remaining": "string | null",
    "scheduled_at": "timestamp",
    "started_at": "timestamp | null",
    "completed_at": "timestamp | null",
    "venue": "string",
    "metadata": "object",
    "last_updated": "timestamp",
    "created_at": "timestamp"
  }
}
```

**Error Responses:**
- 401: Not authenticated
- 404: Game not found

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/scores/game/football_2024-01-15_0"
```

**Notes:**
- Checks cache first, fetches from API if not found or stale
- Returns complete game details including metadata

---

### GET /status/:status
Get all games by status across all sports or filtered by sport.

**Authorization:** Required

**URL Parameters:**
- `status` (string): Game status (scheduled/live/halftime/final/postponed/cancelled)

**Query Parameters:**
- `sport` (string, optional): Filter by sport type

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "games": [
      {
        "id": "uuid",
        "game_id": "string",
        "sport_type": "string",
        "home_team": "string",
        "away_team": "string",
        "home_score": "integer",
        "away_score": "integer",
        "status": "string",
        "scheduled_at": "timestamp"
      }
    ],
    "count": "integer",
    "status": "string",
    "sport": "string (all or specific sport)"
  }
}
```

**Error Responses:**
- 400: Invalid status
- 401: Not authenticated

**Example:**
```bash
# All live games
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/scores/status/live"

# Live basketball games only
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/scores/status/live?sport=basketball"
```

---

## Cache Management

### POST /refresh
Force refresh of scores from API.

**Authorization:** Required

**Request Body:**
```json
{
  "sport": "string (optional - specific sport or all if omitted)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Scores refreshed successfully",
  "data": {
    "football": 5,
    "basketball": 3,
    "baseball": 4,
    "soccer": 2,
    "hockey": 1
  }
}
```

**Error Responses:**
- 400: Invalid sport type
- 401: Not authenticated

**Example:**
```bash
# Refresh all sports
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:5000/api/scores/refresh"

# Refresh specific sport
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sport":"football"}' \
  "http://localhost:5000/api/scores/refresh"
```

**Notes:**
- Returns count of games updated per sport
- Useful for manual refresh or testing
- Does not affect automatic background updates

---

### GET /cache/stats
Get cache statistics for all sports.

**Authorization:** Required

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "football": {
      "total_games": "integer",
      "live_games": "integer",
      "scheduled_games": "integer",
      "completed_games": "integer",
      "last_update": "timestamp"
    },
    "basketball": { /* ... */ },
    "baseball": { /* ... */ },
    "soccer": { /* ... */ },
    "hockey": { /* ... */ }
  }
}
```

**Error Responses:**
- 401: Not authenticated

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/scores/cache/stats"
```

**Notes:**
- Shows count of games by status for each sport
- Displays last update time for cache freshness
- Useful for monitoring cache health

---

### POST /cleanup
Clean up old completed scores.

**Authorization:** Required

**Request Body:**
```json
{
  "days": "integer (optional, default: 7, max: 30)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Cleaned up scores older than 7 days",
  "data": {
    "deleted": "integer",
    "days": "integer"
  }
}
```

**Error Responses:**
- 400: Days parameter out of range (1-30)
- 401: Not authenticated

**Example:**
```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"days":14}' \
  "http://localhost:5000/api/scores/cleanup"
```

**Notes:**
- Only deletes completed games (status: 'final')
- Scheduled and live games are never deleted
- Automatic cleanup runs every 24 hours

---

## Background Job Management

### GET /updater/status
Get status of the background score updater job.

**Authorization:** Required

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isRunning": "boolean",
    "lastUpdate": "timestamp",
    "updateCount": "integer",
    "updateInterval": "integer (milliseconds)"
  }
}
```

**Error Responses:**
- 401: Not authenticated

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/scores/updater/status"
```

**Notes:**
- Shows if background job is running
- Displays last successful update time
- Shows total update count since server start
- Update interval in milliseconds

---

### POST /updater/force
Force immediate score update (bypasses scheduled interval).

**Authorization:** Required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Score update triggered successfully"
}
```

**Error Responses:**
- 401: Not authenticated

**Example:**
```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/scores/updater/force"
```

**Notes:**
- Triggers immediate update of all sports
- Does not affect scheduled update cycle
- Useful for testing or manual refresh

---

## Caching Strategy

The live scores system implements an intelligent caching strategy:

### Cache Flow:
1. **Request received** → Check cache status
2. **Cache valid** (age < TTL) → Return cached data
3. **Cache stale** (age > TTL) → Fetch from API, update cache, return data
4. **Force refresh** → Always fetch from API, update cache

### Background Updates:
- **Automatic refresh** every 60 seconds (configurable)
- **Updates all sports** in sequence
- **Error handling** continues on failure, logs errors
- **Cleanup job** runs every 24 hours

### Cache TTL:
- Default: 5 minutes (300 seconds)
- Configurable via `CACHE_TTL` environment variable
- Balances freshness vs API call efficiency

---

## Data Structure

### Game Object:
```typescript
{
  id: UUID,                    // Database ID
  game_id: string,             // External API game ID
  sport_type: string,          // Sport type
  home_team: string,           // Home team name
  away_team: string,           // Away team name
  home_team_logo: string?,     // Home team logo URL
  away_team_logo: string?,     // Away team logo URL
  home_score: number,          // Home team score
  away_score: number,          // Away team score
  status: string,              // Game status
  period: string?,             // Current period (e.g., "3rd Quarter")
  time_remaining: string?,     // Time remaining (e.g., "12:34")
  scheduled_at: timestamp,     // Scheduled start time
  started_at: timestamp?,      // Actual start time
  completed_at: timestamp?,    // Completion time
  venue: string?,              // Venue name
  metadata: object?,           // Additional data (league, season, etc.)
  last_updated: timestamp,     // Cache update time
  created_at: timestamp        // Record creation time
}
```

---

## Performance Considerations

### Response Times:
- **Cache hit**: < 100ms
- **Cache miss**: 100-500ms (depends on API)
- **Force refresh**: 100-500ms per sport

### Optimization Tips:
1. **Use cache** - Default behavior provides best performance
2. **Avoid force refresh** - Only use when necessary
3. **Filter by sport** - Reduces data transfer and processing
4. **Use status filtering** - Get only relevant games

---

## Error Handling

All endpoints use consistent error response format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common Errors:
- **400 Bad Request**: Invalid parameters (sport type, date range, etc.)
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Game not found
- **500 Internal Server Error**: Server or API error

### API Integration Errors:
- Errors are logged but don't fail the request
- Cached data returned if available
- Empty result set if no cache available

---

## Environment Configuration

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sports_betting

# Sports API (replace with actual provider)
SPORTS_API_KEY=your_api_key
SPORTS_API_URL=https://api.example.com

# Cache Configuration
CACHE_TTL=300                    # 5 minutes
SCORE_UPDATE_INTERVAL=60000      # 60 seconds

# Server
PORT=5000
NODE_ENV=development
```

---

## Integration with Real Sports API

The current implementation uses mock data. To integrate with a real sports API:

1. **Choose a provider**:
   - ESPN API
   - The Odds API
   - SportsData.io
   - Sportradar
   - API-Sports

2. **Update `sportsApiService.js`**:
   - Uncomment and modify the real API example
   - Map API response to our data format
   - Handle API-specific authentication

3. **Configure environment**:
   - Set `SPORTS_API_KEY`
   - Set `SPORTS_API_URL`

4. **Test thoroughly**:
   - Verify data format matches
   - Check error handling
   - Monitor API rate limits

---

## Example Workflows

### Display Live Scores Dashboard:
```javascript
// 1. Fetch live scores for all sports
const sports = ['football', 'basketball', 'baseball', 'soccer', 'hockey'];
const liveScores = await Promise.all(
  sports.map(sport =>
    fetch(`/api/scores/${sport}/live`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json())
  )
);

// 2. Display live games prominently
// 3. Show upcoming games in sidebar
// 4. Display recent completed games
```

### Monitor Specific Game:
```javascript
// 1. Get game details
const game = await fetch(`/api/scores/game/${gameId}`, {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());

// 2. Poll for updates every 30 seconds if game is live
if (game.data.status === 'live') {
  setInterval(async () => {
    const updated = await fetch(`/api/scores/game/${gameId}?forceRefresh=true`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json());

    updateUI(updated.data);
  }, 30000);
}
```

### Admin Monitoring:
```javascript
// 1. Check updater status
const status = await fetch('/api/scores/updater/status', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());

// 2. Check cache stats
const stats = await fetch('/api/scores/cache/stats', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());

// 3. Force update if needed
if (cacheIsStale(stats)) {
  await fetch('/api/scores/updater/force', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
}
```

---

## Security Features

- **Authentication required** for all endpoints
- **Input validation** for all parameters
- **SQL injection protection** via parameterized queries
- **Rate limiting** inherited from global configuration
- **Error sanitization** prevents information leakage
- **Cache isolation** per user session (via authentication)

---

## Future Enhancements

Potential improvements for production:
1. **Real-time updates** via WebSocket for live games
2. **Push notifications** for score changes
3. **Favorite teams** filtering and personalization
4. **Historical statistics** and trends
5. **Game predictions** and analytics
6. **Multi-sport comparisons**
7. **Social features** (share scores, discuss games)
8. **Advanced caching** with Redis
9. **API rate limit handling** with queue system
10. **CDN integration** for team logos and assets
