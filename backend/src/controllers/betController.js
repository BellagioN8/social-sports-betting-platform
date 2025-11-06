/**
 * Bet Controller
 * Handles bet HTTP requests
 */

const BetService = require('../services/betService');

class BetController {
  /**
   * Create a new bet
   * POST /api/bets
   */
  static async create(req, res) {
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
    } = req.body;

    const bet = await BetService.createBet(req.userId, {
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
    });

    res.status(201).json({
      success: true,
      message: 'Bet created successfully',
      data: bet,
    });
  }

  /**
   * Get bet by ID
   * GET /api/bets/:id
   */
  static async getById(req, res) {
    const bet = await BetService.getBet(req.params.id, req.userId);

    res.json({
      success: true,
      data: bet,
    });
  }

  /**
   * Get current user's bets
   * GET /api/bets/my/bets
   */
  static async getMyBets(req, res) {
    const { status, sportType, groupId, limit, offset } = req.query;

    const filters = {
      status,
      sportType,
      groupId,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    };

    const result = await BetService.getUserBets(req.userId, filters);

    res.json({
      success: true,
      data: result,
    });
  }

  /**
   * Get bets for a group
   * GET /api/bets/group/:groupId
   */
  static async getGroupBets(req, res) {
    const { status, sportType, limit, offset } = req.query;

    const filters = {
      status,
      sportType,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    };

    const result = await BetService.getGroupBets(req.params.groupId, filters);

    res.json({
      success: true,
      data: result,
    });
  }

  /**
   * Get bets for a game
   * GET /api/bets/game/:gameId
   */
  static async getGameBets(req, res) {
    const bets = await BetService.getGameBets(req.params.gameId, req.userId);

    res.json({
      success: true,
      data: {
        bets,
        count: bets.length,
      },
    });
  }

  /**
   * Update bet
   * PATCH /api/bets/:id
   */
  static async update(req, res) {
    const { predictedOutcome, confidenceLevel, notes, isPublic } = req.body;

    const updates = {};
    if (predictedOutcome !== undefined) updates.predicted_outcome = predictedOutcome;
    if (confidenceLevel !== undefined) updates.confidence_level = confidenceLevel;
    if (notes !== undefined) updates.notes = notes;
    if (isPublic !== undefined) updates.is_public = isPublic;

    const bet = await BetService.updateBet(req.params.id, req.userId, updates);

    res.json({
      success: true,
      message: 'Bet updated successfully',
      data: bet,
    });
  }

  /**
   * Resolve bet (mark as won/lost)
   * POST /api/bets/:id/resolve
   */
  static async resolve(req, res) {
    const { actualOutcome, isCorrect } = req.body;

    if (actualOutcome === undefined || isCorrect === undefined) {
      return res.status(400).json({
        success: false,
        error: 'actualOutcome and isCorrect are required',
      });
    }

    const bet = await BetService.resolveBet(
      req.params.id,
      req.userId,
      actualOutcome,
      isCorrect
    );

    res.json({
      success: true,
      message: 'Bet resolved successfully',
      data: bet,
    });
  }

  /**
   * Cancel bet
   * POST /api/bets/:id/cancel
   */
  static async cancel(req, res) {
    const bet = await BetService.cancelBet(req.params.id, req.userId);

    res.json({
      success: true,
      message: 'Bet cancelled successfully',
      data: bet,
    });
  }

  /**
   * Delete bet
   * DELETE /api/bets/:id
   */
  static async delete(req, res) {
    await BetService.deleteBet(req.params.id, req.userId);

    res.json({
      success: true,
      message: 'Bet deleted successfully',
    });
  }

  /**
   * Get user statistics
   * GET /api/bets/my/stats
   */
  static async getMyStats(req, res) {
    const stats = await BetService.getUserStatistics(req.userId);

    res.json({
      success: true,
      data: stats,
    });
  }
}

module.exports = BetController;
