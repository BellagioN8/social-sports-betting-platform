/**
 * Bet Service
 * Business logic for bet operations
 */

const Bet = require('../models/Bet');

class BetService {
  /**
   * Create a new bet
   * @param {string} userId - User ID
   * @param {object} betData - Bet data
   * @returns {Promise<object>} Created bet
   */
  static async createBet(userId, betData) {
    const {
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

    // Validate required fields
    if (!gameId || !sportType || !homeTeam || !awayTeam || !gameDate) {
      throw new Error('Missing required game information');
    }

    if (!betType || !betDetails || !predictedOutcome) {
      throw new Error('Missing required bet information');
    }

    // Validate sport type
    const validSports = ['football', 'basketball', 'baseball', 'soccer', 'hockey', 'other'];
    if (!validSports.includes(sportType)) {
      throw new Error('Invalid sport type');
    }

    // Validate confidence level if provided
    if (confidenceLevel !== undefined && (confidenceLevel < 1 || confidenceLevel > 5)) {
      throw new Error('Confidence level must be between 1 and 5');
    }

    // Validate game date
    const gameDateTime = new Date(gameDate);
    if (isNaN(gameDateTime.getTime())) {
      throw new Error('Invalid game date');
    }

    // Create bet
    const bet = await Bet.create({
      userId,
      groupId,
      gameId,
      sportType,
      homeTeam,
      awayTeam,
      gameDate: gameDateTime,
      betType,
      betDetails,
      predictedOutcome,
      confidenceLevel,
      notes,
      isPublic,
    });

    return bet;
  }

  /**
   * Get bet by ID
   * @param {string} betId - Bet ID
   * @param {string} userId - Requesting user ID
   * @returns {Promise<object>} Bet details
   */
  static async getBet(betId, userId) {
    const bet = await Bet.findById(betId, true);

    if (!bet) {
      throw new Error('Bet not found');
    }

    // Check if user has access to this bet
    if (bet.user_id !== userId && !bet.is_public) {
      throw new Error('Access denied');
    }

    return bet;
  }

  /**
   * Get user's bets
   * @param {string} userId - User ID
   * @param {object} filters - Optional filters
   * @returns {Promise<object>} Bets and metadata
   */
  static async getUserBets(userId, filters = {}) {
    const bets = await Bet.findByUserId(userId, filters);
    const stats = await Bet.getUserStats(userId);
    const sportStats = await Bet.getStatsBySport(userId);

    return {
      bets,
      stats,
      sportStats,
      count: bets.length,
    };
  }

  /**
   * Get group bets
   * @param {string} groupId - Group ID
   * @param {object} filters - Optional filters
   * @returns {Promise<object>} Bets and metadata
   */
  static async getGroupBets(groupId, filters = {}) {
    const bets = await Bet.findByGroupId(groupId, filters);

    return {
      bets,
      count: bets.length,
    };
  }

  /**
   * Get bets for a specific game
   * @param {string} gameId - Game ID
   * @param {string} userId - Requesting user ID
   * @returns {Promise<Array>} Bets for the game
   */
  static async getGameBets(gameId, userId) {
    const allBets = await Bet.findByGameId(gameId);

    // Filter to only show user's own bets and public bets
    const filteredBets = allBets.filter(
      (bet) => bet.user_id === userId || bet.is_public
    );

    return filteredBets;
  }

  /**
   * Update bet
   * @param {string} betId - Bet ID
   * @param {string} userId - User ID
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} Updated bet
   */
  static async updateBet(betId, userId, updates) {
    // Check if bet exists and user owns it
    const isOwner = await Bet.isOwner(betId, userId);
    if (!isOwner) {
      throw new Error('Bet not found or access denied');
    }

    // Get current bet to check status
    const currentBet = await Bet.findById(betId);
    if (!currentBet) {
      throw new Error('Bet not found');
    }

    // Only pending bets can be updated
    if (currentBet.status !== 'pending') {
      throw new Error('Only pending bets can be updated');
    }

    // Validate confidence level if updating
    if (updates.confidenceLevel && (updates.confidenceLevel < 1 || updates.confidenceLevel > 5)) {
      throw new Error('Confidence level must be between 1 and 5');
    }

    const updatedBet = await Bet.update(betId, updates);
    return updatedBet;
  }

  /**
   * Resolve bet (mark as won/lost)
   * @param {string} betId - Bet ID
   * @param {string} userId - User ID
   * @param {string} actualOutcome - Actual game outcome
   * @param {boolean} isCorrect - Whether bet was correct
   * @returns {Promise<object>} Updated bet
   */
  static async resolveBet(betId, userId, actualOutcome, isCorrect) {
    // Check if bet exists and user owns it
    const isOwner = await Bet.isOwner(betId, userId);
    if (!isOwner) {
      throw new Error('Bet not found or access denied');
    }

    // Get current bet to check status
    const currentBet = await Bet.findById(betId);
    if (!currentBet) {
      throw new Error('Bet not found');
    }

    // Only pending bets can be resolved
    if (currentBet.status !== 'pending') {
      throw new Error('Only pending bets can be resolved');
    }

    const resolvedBet = await Bet.resolve(betId, actualOutcome, isCorrect);
    return resolvedBet;
  }

  /**
   * Cancel bet
   * @param {string} betId - Bet ID
   * @param {string} userId - User ID
   * @returns {Promise<object>} Updated bet
   */
  static async cancelBet(betId, userId) {
    // Check if bet exists and user owns it
    const isOwner = await Bet.isOwner(betId, userId);
    if (!isOwner) {
      throw new Error('Bet not found or access denied');
    }

    const cancelledBet = await Bet.cancel(betId);
    if (!cancelledBet) {
      throw new Error('Bet cannot be cancelled (already resolved or cancelled)');
    }

    return cancelledBet;
  }

  /**
   * Delete bet
   * @param {string} betId - Bet ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  static async deleteBet(betId, userId) {
    // Check if bet exists and user owns it
    const isOwner = await Bet.isOwner(betId, userId);
    if (!isOwner) {
      throw new Error('Bet not found or access denied');
    }

    // Get current bet to check status
    const currentBet = await Bet.findById(betId);
    if (!currentBet) {
      throw new Error('Bet not found');
    }

    // Only allow deleting pending or cancelled bets
    if (!['pending', 'cancelled'].includes(currentBet.status)) {
      throw new Error('Only pending or cancelled bets can be deleted');
    }

    await Bet.delete(betId);
  }

  /**
   * Get bet statistics for user
   * @param {string} userId - User ID
   * @returns {Promise<object>} Statistics
   */
  static async getUserStatistics(userId) {
    const stats = await Bet.getUserStats(userId);
    const sportStats = await Bet.getStatsBySport(userId);

    return {
      overall: stats,
      bySport: sportStats,
    };
  }
}

module.exports = BetService;
