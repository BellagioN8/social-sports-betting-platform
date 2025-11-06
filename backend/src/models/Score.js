/**
 * Score Model
 * Database operations for live scores
 */

const { query } = require('../config/database');

class Score {
  /**
   * Upsert score (insert or update if exists)
   * @param {object} scoreData - Score data
   * @returns {Promise<object>} Upserted score
   */
  static async upsert(scoreData) {
    const {
      gameId,
      sportType,
      homeTeam,
      awayTeam,
      homeTeamLogo,
      awayTeamLogo,
      homeScore,
      awayScore,
      status,
      period,
      timeRemaining,
      scheduledAt,
      startedAt,
      completedAt,
      venue,
      metadata,
    } = scoreData;

    const sql = `
      INSERT INTO scores (
        game_id, sport_type, home_team, away_team,
        home_team_logo, away_team_logo, home_score, away_score,
        status, period, time_remaining,
        scheduled_at, started_at, completed_at, venue, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (game_id)
      DO UPDATE SET
        home_score = $7,
        away_score = $8,
        status = $9,
        period = $10,
        time_remaining = $11,
        started_at = $13,
        completed_at = $14,
        metadata = $16,
        last_updated = CURRENT_TIMESTAMP
      RETURNING id, game_id, sport_type, home_team, away_team,
                home_team_logo, away_team_logo, home_score, away_score,
                status, period, time_remaining,
                scheduled_at, started_at, completed_at, venue, metadata,
                last_updated, created_at
    `;

    const values = [
      gameId,
      sportType,
      homeTeam,
      awayTeam,
      homeTeamLogo || null,
      awayTeamLogo || null,
      homeScore || 0,
      awayScore || 0,
      status,
      period || null,
      timeRemaining || null,
      scheduledAt,
      startedAt || null,
      completedAt || null,
      venue || null,
      metadata ? JSON.stringify(metadata) : null,
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Find score by game ID
   * @param {string} gameId - Game ID
   * @returns {Promise<object|null>} Score or null
   */
  static async findByGameId(gameId) {
    const sql = `
      SELECT id, game_id, sport_type, home_team, away_team,
             home_team_logo, away_team_logo, home_score, away_score,
             status, period, time_remaining,
             scheduled_at, started_at, completed_at, venue, metadata,
             last_updated, created_at
      FROM scores
      WHERE game_id = $1
    `;

    const result = await query(sql, [gameId]);
    return result.rows[0] || null;
  }

  /**
   * Find live games
   * @param {string} sportType - Optional sport type filter
   * @returns {Promise<Array>} Live games
   */
  static async findLive(sportType = null) {
    let sql = `
      SELECT id, game_id, sport_type, home_team, away_team,
             home_team_logo, away_team_logo, home_score, away_score,
             status, period, time_remaining,
             scheduled_at, started_at, completed_at, venue, metadata,
             last_updated, created_at
      FROM scores
      WHERE status = 'live'
    `;

    const values = [];

    if (sportType) {
      sql += ` AND sport_type = $1`;
      values.push(sportType);
    }

    sql += ` ORDER BY scheduled_at ASC`;

    const result = await query(sql, values);
    return result.rows;
  }

  /**
   * Find scores by sport and date range
   * @param {string} sportType - Sport type
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Scores
   */
  static async findByDateRange(sportType, startDate, endDate) {
    const sql = `
      SELECT id, game_id, sport_type, home_team, away_team,
             home_team_logo, away_team_logo, home_score, away_score,
             status, period, time_remaining,
             scheduled_at, started_at, completed_at, venue, metadata,
             last_updated, created_at
      FROM scores
      WHERE sport_type = $1
        AND scheduled_at >= $2
        AND scheduled_at <= $3
      ORDER BY scheduled_at ASC
    `;

    const result = await query(sql, [sportType, startDate, endDate]);
    return result.rows;
  }

  /**
   * Find upcoming games
   * @param {string} sportType - Sport type
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Upcoming games
   */
  static async findUpcoming(sportType, limit = 10) {
    const sql = `
      SELECT id, game_id, sport_type, home_team, away_team,
             home_team_logo, away_team_logo, home_score, away_score,
             status, period, time_remaining,
             scheduled_at, started_at, completed_at, venue, metadata,
             last_updated, created_at
      FROM scores
      WHERE sport_type = $1
        AND status = 'scheduled'
        AND scheduled_at > CURRENT_TIMESTAMP
      ORDER BY scheduled_at ASC
      LIMIT $2
    `;

    const result = await query(sql, [sportType, limit]);
    return result.rows;
  }

  /**
   * Find recently completed games
   * @param {string} sportType - Sport type
   * @param {number} hours - Hours to look back
   * @param {number} limit - Max results
   * @returns {Promise<Array>} Recent games
   */
  static async findRecentlyCompleted(sportType, hours = 24, limit = 10) {
    const sql = `
      SELECT id, game_id, sport_type, home_team, away_team,
             home_team_logo, away_team_logo, home_score, away_score,
             status, period, time_remaining,
             scheduled_at, started_at, completed_at, venue, metadata,
             last_updated, created_at
      FROM scores
      WHERE sport_type = $1
        AND status = 'final'
        AND completed_at >= CURRENT_TIMESTAMP - INTERVAL '${hours} hours'
      ORDER BY completed_at DESC
      LIMIT $2
    `;

    const result = await query(sql, [sportType, limit]);
    return result.rows;
  }

  /**
   * Get scores by status
   * @param {string} status - Game status
   * @param {string} sportType - Optional sport type filter
   * @returns {Promise<Array>} Scores
   */
  static async findByStatus(status, sportType = null) {
    let sql = `
      SELECT id, game_id, sport_type, home_team, away_team,
             home_team_logo, away_team_logo, home_score, away_score,
             status, period, time_remaining,
             scheduled_at, started_at, completed_at, venue, metadata,
             last_updated, created_at
      FROM scores
      WHERE status = $1
    `;

    const values = [status];

    if (sportType) {
      sql += ` AND sport_type = $2`;
      values.push(sportType);
    }

    sql += ` ORDER BY scheduled_at DESC`;

    const result = await query(sql, values);
    return result.rows;
  }

  /**
   * Delete old scores
   * @param {number} days - Days to keep
   * @returns {Promise<number>} Number of deleted records
   */
  static async deleteOld(days = 7) {
    const sql = `
      DELETE FROM scores
      WHERE status = 'final'
        AND completed_at < CURRENT_TIMESTAMP - INTERVAL '${days} days'
    `;

    const result = await query(sql);
    return result.rowCount;
  }

  /**
   * Get cache status (last update time)
   * @param {string} sportType - Sport type
   * @returns {Promise<object>} Cache status
   */
  static async getCacheStatus(sportType) {
    const sql = `
      SELECT
        COUNT(*) as total_games,
        COUNT(CASE WHEN status = 'live' THEN 1 END) as live_games,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_games,
        COUNT(CASE WHEN status = 'final' THEN 1 END) as completed_games,
        MAX(last_updated) as last_update
      FROM scores
      WHERE sport_type = $1
    `;

    const result = await query(sql, [sportType]);
    return result.rows[0];
  }
}

module.exports = Score;
