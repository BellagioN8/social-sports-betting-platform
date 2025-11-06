-- Social Sports Betting Platform - Initial Database Schema
-- Migration: 001_initial_schema
-- Description: Creates all core tables with proper relationships and constraints

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- USERS TABLE
-- ==============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,

    -- Constraints
    CONSTRAINT username_length CHECK (char_length(username) >= 3),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- ==============================================
-- GROUPS TABLE
-- ==============================================
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    avatar_url VARCHAR(500),
    is_private BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    max_members INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT group_name_length CHECK (char_length(name) >= 3),
    CONSTRAINT max_members_limit CHECK (max_members > 0 AND max_members <= 500)
);

-- Indexes for groups table
CREATE INDEX idx_groups_owner ON groups(owner_id);
CREATE INDEX idx_groups_active ON groups(is_active) WHERE is_active = true;
CREATE INDEX idx_groups_created_at ON groups(created_at DESC);

-- ==============================================
-- GROUP MEMBERS TABLE (Junction)
-- ==============================================
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,

    -- Constraints
    CONSTRAINT unique_group_user UNIQUE(group_id, user_id),
    CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member'))
);

-- Indexes for group_members table
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_active ON group_members(group_id, is_active) WHERE is_active = true;

-- ==============================================
-- BETS TABLE
-- ==============================================
CREATE TABLE bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,

    -- Game information
    game_id VARCHAR(100) NOT NULL,
    sport_type VARCHAR(50) NOT NULL,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    game_date TIMESTAMP NOT NULL,

    -- Bet details (encrypted in application layer)
    bet_type VARCHAR(50) NOT NULL,
    bet_details JSONB NOT NULL,
    predicted_outcome TEXT NOT NULL,
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),

    -- Bet status
    status VARCHAR(20) DEFAULT 'pending',
    actual_outcome TEXT,
    is_correct BOOLEAN,
    resolved_at TIMESTAMP,

    -- Metadata
    notes TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_bet_status CHECK (status IN ('pending', 'won', 'lost', 'cancelled', 'void')),
    CONSTRAINT valid_sport_type CHECK (sport_type IN ('football', 'basketball', 'baseball', 'soccer', 'hockey', 'other'))
);

-- Indexes for bets table
CREATE INDEX idx_bets_user ON bets(user_id);
CREATE INDEX idx_bets_group ON bets(group_id);
CREATE INDEX idx_bets_game ON bets(game_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_bets_sport ON bets(sport_type);
CREATE INDEX idx_bets_game_date ON bets(game_date);
CREATE INDEX idx_bets_created_at ON bets(created_at DESC);
CREATE INDEX idx_bets_user_status ON bets(user_id, status);

-- ==============================================
-- SCORES TABLE (Live Game Data Cache)
-- ==============================================
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id VARCHAR(100) UNIQUE NOT NULL,
    sport_type VARCHAR(50) NOT NULL,

    -- Team information
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    home_team_logo VARCHAR(500),
    away_team_logo VARCHAR(500),

    -- Score information
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,

    -- Game status
    status VARCHAR(20) NOT NULL,
    period VARCHAR(50),
    time_remaining VARCHAR(20),

    -- Game schedule
    scheduled_at TIMESTAMP NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Additional data
    venue VARCHAR(200),
    metadata JSONB,

    -- Cache metadata
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_score_status CHECK (status IN ('scheduled', 'live', 'halftime', 'final', 'postponed', 'cancelled')),
    CONSTRAINT valid_scores CHECK (home_score >= 0 AND away_score >= 0)
);

-- Indexes for scores table
CREATE INDEX idx_scores_game ON scores(game_id);
CREATE INDEX idx_scores_sport ON scores(sport_type);
CREATE INDEX idx_scores_status ON scores(status);
CREATE INDEX idx_scores_scheduled ON scores(scheduled_at);
CREATE INDEX idx_scores_updated ON scores(last_updated DESC);
CREATE INDEX idx_scores_live ON scores(status) WHERE status = 'live';

-- ==============================================
-- MESSAGES TABLE (Group Chat)
-- ==============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Message content
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',

    -- Optional bet reference
    bet_id UUID REFERENCES bets(id) ON DELETE SET NULL,

    -- Message metadata
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'bet_share', 'system')),
    CONSTRAINT content_not_empty CHECK (char_length(content) > 0)
);

-- Indexes for messages table
CREATE INDEX idx_messages_group ON messages(group_id, created_at DESC);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_bet ON messages(bet_id);
CREATE INDEX idx_messages_active ON messages(group_id, is_deleted) WHERE is_deleted = false;

-- ==============================================
-- REFRESH TOKENS TABLE (JWT Token Management)
-- ==============================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP,
    is_revoked BOOLEAN DEFAULT false,

    -- Device information for security
    device_info VARCHAR(500),
    ip_address INET
);

-- Indexes for refresh_tokens table
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_active ON refresh_tokens(user_id, is_revoked) WHERE is_revoked = false;
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ==============================================
-- TRIGGERS FOR UPDATED_AT
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bets_updated_at BEFORE UPDATE ON bets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- VIEWS FOR COMMON QUERIES
-- ==============================================

-- View: User statistics
CREATE VIEW user_stats AS
SELECT
    u.id,
    u.username,
    COUNT(DISTINCT b.id) as total_bets,
    COUNT(DISTINCT CASE WHEN b.is_correct = true THEN b.id END) as bets_won,
    COUNT(DISTINCT CASE WHEN b.is_correct = false THEN b.id END) as bets_lost,
    COUNT(DISTINCT gm.group_id) as groups_joined,
    CASE
        WHEN COUNT(DISTINCT b.id) > 0 THEN
            ROUND(COUNT(DISTINCT CASE WHEN b.is_correct = true THEN b.id END)::numeric /
                  COUNT(DISTINCT CASE WHEN b.status IN ('won', 'lost') THEN b.id END)::numeric * 100, 2)
        ELSE 0
    END as win_percentage
FROM users u
LEFT JOIN bets b ON u.id = b.user_id
LEFT JOIN group_members gm ON u.id = gm.user_id AND gm.is_active = true
GROUP BY u.id, u.username;

-- View: Group statistics
CREATE VIEW group_stats AS
SELECT
    g.id,
    g.name,
    g.owner_id,
    COUNT(DISTINCT gm.user_id) as member_count,
    COUNT(DISTINCT b.id) as total_bets,
    COUNT(DISTINCT m.id) as total_messages,
    g.created_at
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.is_active = true
LEFT JOIN bets b ON g.id = b.group_id
LEFT JOIN messages m ON g.id = m.group_id AND m.is_deleted = false
WHERE g.is_active = true
GROUP BY g.id, g.name, g.owner_id, g.created_at;

-- ==============================================
-- COMMENTS FOR DOCUMENTATION
-- ==============================================

COMMENT ON TABLE users IS 'Stores user account information and authentication data';
COMMENT ON TABLE groups IS 'Stores group information for social betting features';
COMMENT ON TABLE group_members IS 'Junction table linking users to groups with roles';
COMMENT ON TABLE bets IS 'Stores all user bets with encrypted sensitive data';
COMMENT ON TABLE scores IS 'Caches live game scores from external APIs';
COMMENT ON TABLE messages IS 'Stores group chat messages';
COMMENT ON TABLE refresh_tokens IS 'Manages JWT refresh tokens for authentication';

COMMENT ON COLUMN bets.bet_details IS 'Encrypted JSON containing sensitive bet information';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'Hashed refresh token for security';
