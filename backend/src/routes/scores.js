/**
 * Score Routes
 * Routes for live scores and game data
 */

const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');
const { authenticate } = require('../middleware/auth');

// All score routes require authentication
router.use(authenticate);

/**
 * GET /api/scores/:sport/live
 * Get live scores for a specific sport
 * Query params: forceRefresh (boolean)
 */
router.get('/:sport/live', scoreController.getLiveScores);

/**
 * GET /api/scores/:sport/upcoming
 * Get upcoming games for a specific sport
 * Query params: days (number, default: 7, max: 14)
 */
router.get('/:sport/upcoming', scoreController.getUpcomingGames);

/**
 * GET /api/scores/:sport/range
 * Get scores by date range for a specific sport
 * Query params: startDate (ISO date), endDate (ISO date)
 */
router.get('/:sport/range', scoreController.getScoresByDateRange);

/**
 * GET /api/scores/game/:gameId
 * Get details for a specific game
 */
router.get('/game/:gameId', scoreController.getGameById);

/**
 * GET /api/scores/status/:status
 * Get games by status (scheduled, live, halftime, final, etc.)
 * Query params: sport (optional)
 */
router.get('/status/:status', scoreController.getGamesByStatus);

/**
 * POST /api/scores/refresh
 * Force refresh of scores from API
 * Body: sport (optional - if not provided, refreshes all sports)
 */
router.post('/refresh', scoreController.refreshScores);

/**
 * GET /api/scores/cache/stats
 * Get cache statistics for all sports
 */
router.get('/cache/stats', scoreController.getCacheStatistics);

/**
 * GET /api/scores/updater/status
 * Get score updater job status
 */
router.get('/updater/status', scoreController.getUpdaterStatus);

/**
 * POST /api/scores/updater/force
 * Force immediate score update
 */
router.post('/updater/force', scoreController.forceUpdate);

/**
 * POST /api/scores/cleanup
 * Cleanup old scores
 * Body: days (number, default: 7, max: 30)
 */
router.post('/cleanup', scoreController.cleanupOldScores);

module.exports = router;
