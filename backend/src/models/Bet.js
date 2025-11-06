/**
 * Bet Model
 * Database operations for bets
 */

const { query } = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');

class Bet {
  /**
   * Create a new bet
   * @param {object} betData - Bet data
   * @returns {Promise<object>} Created bet
   */
  static async create(betData) {
    const {
      userId,
      groupId,
      gameId,
      sportType,
      homeTeam,
      awayTeam,
      gameDate,
      betType,
      betDetails,
      predictedOutcome,
      confidenceLevel,
      notes,
      isPublic,
    } = betData;

    // Encrypt sensitive bet details
    const encryptedDetails = encrypt(betDetails);

    const sql = `
      INSERT INTO bets (
        user_id, group_id, game_id, sport_type,
        home_team, away_team, game_date,
        bet_type, bet_details, predicted_outcome, confidence_level,
        notes, is_public
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, user_id, group_id, game_id, sport_type,
                home_team, away_team, game_date, bet_type,
                predicted_outcome, confidence_level,
                status, notes, is_public, created_at, updated_at
    `;

    const values = [
      userId,
      groupId || null,
      gameId,
      sportType,
      homeTeam,
      awayTeam,
      gameDate,
      betType,
      encryptedDetails,
      predictedOutcome,
      confidenceLevel || null,
      notes || null,
      isPublic !== undefined ? isPublic : false,
    ];

    const result = await query(sql, values);
    const bet = result.rows[0];

    // Don't return encrypted details in the response
    return bet;
  }

  /**
   * Find bet by ID
   * @param {string} id - Bet ID
   * @param {boolean} includeDetails - Include decrypted bet details
   * @returns {Promise<object|null>} Bet or null
   */
  static async findById(id, includeDetails = false) {
    const sql = `
      SELECT id, user_id, group_id, game_id, sport_type,
             home_team, away_team, game_date,
             bet_type, ${includeDetails ? 'bet_details,' : ''} predicted_outcome,
             confidence_level, status, actual_outcome, is_correct,
             resolved_at, notes, is_public, created_at, updated_at
      FROM bets
      WHERE id = $1
    `;

    const result = await query(sql, [id]);
    const bet = result.rows[0];

    if (!bet) return null;

    // Decrypt bet details if requested
    if (includeDetails && bet.bet_details) {
      try {
        bet.bet_details = decrypt(bet.bet_details);
      } catch (error) {
        console.error('Failed to decrypt bet details:', error);
        bet.bet_details = null;
      }
    }

    return bet;
  }

  /**
   * Find bets by user ID
   * @param {string} userId - User ID
   * @param {object} filters - Optional filters
   * @returns {Promise<Array>} Bets array
   */
  static async findByUserId(userId, filters = {}) {
    const { status, sportType, groupId, limit = 50, offset = 0 } = filters;

    let sql = `
      SELECT id, user_id, group_id, game_id, sport_type,
             home_team, away_team, game_date,
             bet_type, predicted_outcome, confidence_level,
             status, actual_outcome, is_correct, resolved_at,
             notes, is_public, created_at, updated_at
      FROM bets
      WHERE user_id = $1
    `;

    const values = [userId];
    let paramCount = 2;

    // Add filters
    if (status) {
      sql += ` AND status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (sportType) {
      sql += ` AND sport_type = $${paramCount}`;
      values.push(sportType);
      paramCount++;
    }

    if (groupId) {
      sql += ` AND group_id = $${paramCount}`;
      values.push(groupId);
      paramCount++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }

  /**
   * Find bets by group ID
   * @param {string} groupId - Group ID
   * @param {object} filters - Optional filters
   * @returns {Promise<Array>} Bets array
   */
  static async findByGroupId(groupId, filters = {}) {
    const { status, sportType, limit = 50, offset = 0 } = filters;

    let sql = `
      SELECT b.id, b.user_id, b.group_id, b.game_id, b.sport_type,
             b.home_team, b.away_team, b.game_date,
             b.bet_type, b.predicted_outcome, b.confidence_level,
             b.status, b.actual_outcome, b.is_correct, b.resolved_at,
             b.notes, b.is_public, b.created_at, b.updated_at,
             u.username, u.display_name
      FROM bets b
      JOIN users u ON b.user_id = u.id
      WHERE b.group_id = $1 AND b.is_public = true
    `;

    const values = [groupId];
    let paramCount = 2;

    if (status) {
      sql += ` AND b.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (sportType) {
      sql += ` AND b.sport_type = $${paramCount}`;
      values.push(sportType);
      paramCount++;
    }

    sql += ` ORDER BY b.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows;
  }

  /**
   * Find bets by game ID
   * @param {string} gameId - Game ID
   * @returns {Promise<Array>} Bets array
   */
  static async findByGameId(gameId) {
    const sql = `
      SELECT id, user_id, group_id, game_id, sport_type,
             home_team, away_team, game_date,
             bet_type, predicted_outcome, confidence_level,
             status, actual_outcome, is_correct, resolved_at,
             notes, is_public, created_at, updated_at
      FROM bets
      WHERE game_id = $1
      ORDER BY created_at DESC
    `;

    const result = await query(sql, [gameId]);
    return result.rows;
  }

  /**
   * Update bet
   * @param {string} id - Bet ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} Updated bet
   */
  static async update(id, updates) {
    const allowedFields = [
      'predicted_outcome',
      'confidence_level',
      'notes',
      'is_public',
    ];

    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);

    const sql = `
      UPDATE bets
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, user_id, group_id, game_id, sport_type,
                home_team, away_team, game_date,
                bet_type, predicted_outcome, confidence_level,
                status, actual_outcome, is_correct, resolved_at,
                notes, is_public, created_at, updated_at
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  /**
   * Resolve bet (mark as won/lost)
   * @param {string} id - Bet ID
   * @param {string} actualOutcome - Actual game outcome
   * @param {boolean} isCorrect - Whether bet was correct
   * @returns {Promise<object>} Updated bet
   */
  static async resolve(id, actualOutcome, isCorrect) {
    const status = isCorrect ? 'won' : 'lost';

    const sql = `
      UPDATE bets
      SET status = $1,
          actual_outcome = $2,
          is_correct = $3,
          resolved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, user_id, group_id, game_id, sport_type,
                home_team, away_team, game_date,
                bet_type, predicted_outcome, confidence_level,
                status, actual_outcome, is_correct, resolved_at,
                notes, is_public, created_at, updated_at
    `;

    const result = await query(sql, [status, actualOutcome, isCorrect, id]);
    return result.rows[0];
  }

  /**
   * Cancel bet
   * @param {string} id - Bet ID
   * @returns {Promise<object>} Updated bet
   */
  static async cancel(id) {
    const sql = `
      UPDATE bets
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'pending'
      RETURNING id, user_id, group_id, game_id, sport_type,
                home_team, away_team, game_date,
                bet_type, predicted_outcome, confidence_level,
                status, notes, is_public, created_at, updated_at
    `;

    const result = await query(sql, [id]);
    return result.rows[0];
  }

  /**
   * Delete bet
   * @param {string} id - Bet ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    const sql = `DELETE FROM bets WHERE id = $1`;
    await query(sql, [id]);
  }

  /**
   * Get bet statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<object>} Statistics
   */
  static async getUserStats(userId) {
    const sql = `
      SELECT
        COUNT(*) as total_bets,
        COUNT(CASE WHEN status = 'won' THEN 1 END) as bets_won,
        COUNT(CASE WHEN status = 'lost' THEN 1 END) as bets_lost,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as bets_pending,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as bets_cancelled,
        CASE
          WHEN COUNT(CASE WHEN status IN ('won', 'lost') THEN 1 END) > 0 THEN
            ROUND(
              COUNT(CASE WHEN status = 'won' THEN 1 END)::numeric /
              COUNT(CASE WHEN status IN ('won', 'lost') THEN 1 END)::numeric * 100,
              2
            )
          ELSE 0
        END as win_percentage
      FROM bets
      WHERE user_id = $1
    `;

    const result = await query(sql, [userId]);
    return result.rows[0];
  }

  /**
   * Get bets by sport type statistics
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Statistics by sport
   */
  static async getStatsBySport(userId) {
    const sql = `
      SELECT
        sport_type,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'won' THEN 1 END) as won,
        COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost,
        CASE
          WHEN COUNT(CASE WHEN status IN ('won', 'lost') THEN 1 END) > 0 THEN
            ROUND(
              COUNT(CASE WHEN status = 'won' THEN 1 END)::numeric /
              COUNT(CASE WHEN status IN ('won', 'lost') THEN 1 END)::numeric * 100,
              2
            )
          ELSE 0
        END as win_percentage
      FROM bets
      WHERE user_id = $1
      GROUP BY sport_type
      ORDER BY total DESC
    `;

    const result = await query(sql, [userId]);
    return result.rows;
  }

  /**
   * Check if user owns bet
   * @param {string} betId - Bet ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Ownership status
   */
  static async isOwner(betId, userId) {
    const sql = `SELECT 1 FROM bets WHERE id = $1 AND user_id = $2`;
    const result = await query(sql, [betId, userId]);
    return result.rows.length > 0;
  }
}

module.exports = Bet;
