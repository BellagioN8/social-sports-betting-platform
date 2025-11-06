/**
 * Score Controller
 * HTTP endpoints for live scores
 */

const ScoreService = require('../services/scoreService');
const scoreUpdater = require('../jobs/scoreUpdater');

/**
 * Get live scores for a sport
 * GET /api/scores/:sport/live
 */
async function getLiveScores(req, res, next) {
  try {
    const { sport } = req.params;
    const { forceRefresh } = req.query;

    const data = await ScoreService.getLiveScores(
      sport,
      forceRefresh === 'true'
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get upcoming games for a sport
 * GET /api/scores/:sport/upcoming
 */
async function getUpcomingGames(req, res, next) {
  try {
    const { sport } = req.params;
    const days = parseInt(req.query.days) || 7;

    // Validate days parameter
    if (days < 1 || days > 14) {
      return res.status(400).json({
        success: false,
        error: 'Days parameter must be between 1 and 14',
      });
    }

    const games = await ScoreService.getUpcomingGames(sport, days);

    res.json({
      success: true,
      data: {
        games,
        count: games.length,
        days,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get scores by date range
 * GET /api/scores/:sport/range
 */
async function getScoresByDateRange(req, res, next) {
  try {
    const { sport } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required',
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
      });
    }

    const scores = await ScoreService.getScoresByDateRange(sport, start, end);

    res.json({
      success: true,
      data: {
        scores,
        count: scores.length,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get specific game details
 * GET /api/scores/game/:gameId
 */
async function getGameById(req, res, next) {
  try {
    const { gameId } = req.params;

    const game = await ScoreService.getGameById(gameId);

    res.json({
      success: true,
      data: game,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get games by status
 * GET /api/scores/status/:status
 */
async function getGamesByStatus(req, res, next) {
  try {
    const { status } = req.params;
    const { sport } = req.query;

    const games = await ScoreService.getGamesByStatus(status, sport || null);

    res.json({
      success: true,
      data: {
        games,
        count: games.length,
        status,
        sport: sport || 'all',
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Force refresh of scores
 * POST /api/scores/refresh
 */
async function refreshScores(req, res, next) {
  try {
    const { sport } = req.body;

    let results;

    if (sport) {
      // Refresh specific sport
      const count = await ScoreService.refreshScores(sport);
      results = { [sport]: count };
    } else {
      // Refresh all sports
      results = await ScoreService.refreshAllScores();
    }

    res.json({
      success: true,
      message: 'Scores refreshed successfully',
      data: results,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get cache statistics
 * GET /api/scores/cache/stats
 */
async function getCacheStatistics(req, res, next) {
  try {
    const stats = await ScoreService.getCacheStatistics();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get score updater job status
 * GET /api/scores/updater/status
 */
async function getUpdaterStatus(req, res, next) {
  try {
    const status = scoreUpdater.getStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Force immediate score update
 * POST /api/scores/updater/force
 */
async function forceUpdate(req, res, next) {
  try {
    await scoreUpdater.forceUpdate();

    res.json({
      success: true,
      message: 'Score update triggered successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cleanup old scores
 * POST /api/scores/cleanup
 */
async function cleanupOldScores(req, res, next) {
  try {
    const days = parseInt(req.body.days) || 7;

    // Validate days parameter
    if (days < 1 || days > 30) {
      return res.status(400).json({
        success: false,
        error: 'Days parameter must be between 1 and 30',
      });
    }

    const deleted = await ScoreService.cleanupOldScores(days);

    res.json({
      success: true,
      message: `Cleaned up scores older than ${days} days`,
      data: {
        deleted,
        days,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLiveScores,
  getUpcomingGames,
  getScoresByDateRange,
  getGameById,
  getGamesByStatus,
  refreshScores,
  getCacheStatistics,
  getUpdaterStatus,
  forceUpdate,
  cleanupOldScores,
};
