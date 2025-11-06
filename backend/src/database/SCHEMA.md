# Database Schema Documentation

## Overview

The Social Sports Betting Platform uses PostgreSQL as its primary database. The schema is designed with security, performance, and scalability in mind.

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    USERS    │◄────────│GROUP_MEMBERS │────────►│   GROUPS    │
│             │         │              │         │             │
│ id (PK)     │         │ group_id(FK) │         │ id (PK)     │
│ username    │         │ user_id (FK) │         │ name        │
│ email       │         │ role         │         │ owner_id(FK)│
│ password_..│         └──────────────┘         │ is_private  │
└──────┬──────┘                                  └──────┬──────┘
       │                                                │
       │                                                │
       │         ┌──────────────┐                      │
       └────────►│     BETS     │◄─────────────────────┘
       │         │              │
       │         │ id (PK)      │
       │         │ user_id (FK) │
       │         │ group_id(FK) │
       │         │ game_id      │
       │         │ bet_details  │
       │         │ status       │
       │         └──────┬───────┘
       │                │
       │                │ (optional ref)
       │                │
       │         ┌──────▼───────┐         ┌──────────────────┐
       └────────►│   MESSAGES   │         │     SCORES       │
                 │              │         │                  │
                 │ id (PK)      │         │ id (PK)          │
                 │ group_id(FK) │         │ game_id (UNIQUE) │
                 │ user_id (FK) │         │ home_team        │
                 │ content      │         │ away_team        │
                 │ bet_id (FK)  │         │ home_score       │
                 └──────────────┘         │ away_score       │
                                          │ status           │
                                          └──────────────────┘

       ┌──────────────────┐
       │ REFRESH_TOKENS   │
       │                  │
       │ id (PK)          │
       │ user_id (FK)     │
       │ token_hash       │
       │ expires_at       │
       └──────────────────┘
```

## Tables

### 1. USERS

Stores user account and authentication information.

**Columns:**
- `id` (UUID, PK): Unique user identifier
- `username` (VARCHAR(50), UNIQUE): User's unique username
- `email` (VARCHAR(255), UNIQUE): User's email address
- `password_hash` (VARCHAR(255)): Bcrypt hashed password
- `display_name` (VARCHAR(100)): Display name for UI
- `avatar_url` (VARCHAR(500)): Profile picture URL
- `bio` (TEXT): User biography
- `is_active` (BOOLEAN): Account active status
- `is_verified` (BOOLEAN): Email verification status
- `email_verified_at` (TIMESTAMP): When email was verified
- `created_at` (TIMESTAMP): Account creation time
- `updated_at` (TIMESTAMP): Last update time
- `last_login_at` (TIMESTAMP): Last login time

**Constraints:**
- Username must be at least 3 characters
- Email must match valid email format

**Indexes:**
- `idx_users_email`: On email column
- `idx_users_username`: On username column
- `idx_users_created_at`: On created_at (DESC)
- `idx_users_active`: Partial index on active users

### 2. GROUPS

Stores group information for social betting features.

**Columns:**
- `id` (UUID, PK): Unique group identifier
- `name` (VARCHAR(100)): Group name
- `description` (TEXT): Group description
- `owner_id` (UUID, FK → users.id): Group creator
- `avatar_url` (VARCHAR(500)): Group avatar image
- `is_private` (BOOLEAN): Privacy setting
- `is_active` (BOOLEAN): Group active status
- `max_members` (INTEGER): Maximum member limit
- `created_at` (TIMESTAMP): Creation time
- `updated_at` (TIMESTAMP): Last update time

**Constraints:**
- Name must be at least 3 characters
- Max members between 1 and 500

**Indexes:**
- `idx_groups_owner`: On owner_id
- `idx_groups_active`: Partial index on active groups
- `idx_groups_created_at`: On created_at (DESC)

### 3. GROUP_MEMBERS

Junction table linking users to groups.

**Columns:**
- `id` (UUID, PK): Unique membership identifier
- `group_id` (UUID, FK → groups.id): Group reference
- `user_id` (UUID, FK → users.id): User reference
- `role` (VARCHAR(20)): Member role (owner/admin/member)
- `joined_at` (TIMESTAMP): Join time
- `is_active` (BOOLEAN): Membership active status

**Constraints:**
- Unique combination of group_id and user_id
- Role must be: 'owner', 'admin', or 'member'

**Indexes:**
- `idx_group_members_group`: On group_id
- `idx_group_members_user`: On user_id
- `idx_group_members_active`: Composite on group_id and is_active

### 4. BETS

Stores all user bets with encrypted sensitive data.

**Columns:**
- `id` (UUID, PK): Unique bet identifier
- `user_id` (UUID, FK → users.id): Bet creator
- `group_id` (UUID, FK → groups.id): Associated group (optional)
- `game_id` (VARCHAR(100)): External game identifier
- `sport_type` (VARCHAR(50)): Type of sport
- `home_team` (VARCHAR(100)): Home team name
- `away_team` (VARCHAR(100)): Away team name
- `game_date` (TIMESTAMP): Scheduled game time
- `bet_type` (VARCHAR(50)): Type of bet
- `bet_details` (JSONB): Encrypted bet details
- `predicted_outcome` (TEXT): User's prediction
- `confidence_level` (INTEGER 1-5): Confidence rating
- `status` (VARCHAR(20)): Bet status
- `actual_outcome` (TEXT): Actual game result
- `is_correct` (BOOLEAN): Whether bet was correct
- `resolved_at` (TIMESTAMP): When bet was resolved
- `notes` (TEXT): Additional notes
- `is_public` (BOOLEAN): Public visibility
- `created_at` (TIMESTAMP): Creation time
- `updated_at` (TIMESTAMP): Last update time

**Constraints:**
- Status: 'pending', 'won', 'lost', 'cancelled', 'void'
- Sport type: 'football', 'basketball', 'baseball', 'soccer', 'hockey', 'other'
- Confidence level: 1-5

**Indexes:**
- Multiple indexes on user_id, group_id, game_id, status, sport_type, game_date
- Composite index on user_id and status

### 5. SCORES

Caches live game scores from external APIs.

**Columns:**
- `id` (UUID, PK): Unique score record identifier
- `game_id` (VARCHAR(100), UNIQUE): External game identifier
- `sport_type` (VARCHAR(50)): Sport type
- `home_team` (VARCHAR(100)): Home team name
- `away_team` (VARCHAR(100)): Away team name
- `home_team_logo` (VARCHAR(500)): Home team logo URL
- `away_team_logo` (VARCHAR(500)): Away team logo URL
- `home_score` (INTEGER): Home team score
- `away_score` (INTEGER): Away team score
- `status` (VARCHAR(20)): Game status
- `period` (VARCHAR(50)): Current period/quarter
- `time_remaining` (VARCHAR(20)): Time left in period
- `scheduled_at` (TIMESTAMP): Scheduled game time
- `started_at` (TIMESTAMP): Actual start time
- `completed_at` (TIMESTAMP): Completion time
- `venue` (VARCHAR(200)): Game venue
- `metadata` (JSONB): Additional game data
- `last_updated` (TIMESTAMP): Last cache update
- `created_at` (TIMESTAMP): Record creation time

**Constraints:**
- Status: 'scheduled', 'live', 'halftime', 'final', 'postponed', 'cancelled'
- Scores must be non-negative

**Indexes:**
- Indexes on game_id, sport_type, status, scheduled_at
- Partial index on live games

### 6. MESSAGES

Stores group chat messages.

**Columns:**
- `id` (UUID, PK): Unique message identifier
- `group_id` (UUID, FK → groups.id): Group reference
- `user_id` (UUID, FK → users.id): Message sender
- `content` (TEXT): Message content
- `message_type` (VARCHAR(20)): Message type
- `bet_id` (UUID, FK → bets.id): Optional bet reference
- `is_edited` (BOOLEAN): Edit status
- `edited_at` (TIMESTAMP): Edit time
- `is_deleted` (BOOLEAN): Deletion status
- `deleted_at` (TIMESTAMP): Deletion time
- `created_at` (TIMESTAMP): Creation time

**Constraints:**
- Message type: 'text', 'bet_share', 'system'
- Content cannot be empty

**Indexes:**
- Composite index on group_id and created_at (DESC)
- Indexes on user_id and bet_id
- Partial index on active (non-deleted) messages

### 7. REFRESH_TOKENS

Manages JWT refresh tokens for authentication.

**Columns:**
- `id` (UUID, PK): Unique token identifier
- `user_id` (UUID, FK → users.id): Token owner
- `token_hash` (VARCHAR(255), UNIQUE): Hashed token
- `expires_at` (TIMESTAMP): Expiration time
- `created_at` (TIMESTAMP): Creation time
- `revoked_at` (TIMESTAMP): Revocation time
- `is_revoked` (BOOLEAN): Revocation status
- `device_info` (VARCHAR(500)): Device information
- `ip_address` (INET): IP address

**Indexes:**
- Indexes on user_id and token_hash
- Partial index on active (non-revoked) tokens
- Index on expiration time

## Views

### user_stats

Provides aggregated statistics for each user.

**Columns:**
- `id`: User ID
- `username`: Username
- `total_bets`: Total number of bets
- `bets_won`: Number of correct bets
- `bets_lost`: Number of incorrect bets
- `groups_joined`: Number of active groups
- `win_percentage`: Win rate percentage

### group_stats

Provides aggregated statistics for each group.

**Columns:**
- `id`: Group ID
- `name`: Group name
- `owner_id`: Group owner
- `member_count`: Number of active members
- `total_bets`: Total bets in group
- `total_messages`: Total messages
- `created_at`: Creation time

## Security Features

1. **Password Hashing**: Using bcrypt for password storage
2. **Token Security**: Refresh tokens are hashed before storage
3. **Data Encryption**: Sensitive bet data encrypted at application layer
4. **Row-Level Security**: Can be enabled for multi-tenant features
5. **Constraints**: Foreign key constraints ensure referential integrity

## Performance Optimizations

1. **Indexes**: Strategic indexes on frequently queried columns
2. **Partial Indexes**: Indexes only on active/relevant records
3. **Composite Indexes**: Multi-column indexes for complex queries
4. **Connection Pooling**: Configured for optimal concurrent connections
5. **Views**: Pre-computed aggregations for common queries

## Backup and Maintenance

Recommendations:
- Daily backups of production database
- Weekly full backups with point-in-time recovery
- Regular `VACUUM ANALYZE` for performance
- Monitor slow queries and add indexes as needed
