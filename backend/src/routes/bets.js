/**
 * Bet Routes
 * /api/bets endpoints
 */

const express = require('express');
const router = express.Router();
const BetController = require('../controllers/betController');
const { authenticate } = require('../middleware/auth');
const { requireFields, sanitizeBody } = require('../middleware/validator');
const { asyncHandler } = require('../middleware/errorHandler');

// All bet routes require authentication
router.use(authenticate);

// Create bet
router.post(
  '/',
  sanitizeBody,
  requireFields([
    'gameId',
    'sportType',
    'homeTeam',
    'awayTeam',
    'gameDate',
    'betType',
    'betDetails',
    'predictedOutcome',
  ]),
  asyncHandler(BetController.create)
);

// Get current user's bets
router.get('/my/bets', asyncHandler(BetController.getMyBets));

// Get current user's statistics
router.get('/my/stats', asyncHandler(BetController.getMyStats));

// Get bets for a group
router.get('/group/:groupId', asyncHandler(BetController.getGroupBets));

// Get bets for a game
router.get('/game/:gameId', asyncHandler(BetController.getGameBets));

// Get bet by ID
router.get('/:id', asyncHandler(BetController.getById));

// Update bet
router.patch('/:id', sanitizeBody, asyncHandler(BetController.update));

// Resolve bet
router.post(
  '/:id/resolve',
  requireFields(['actualOutcome', 'isCorrect']),
  asyncHandler(BetController.resolve)
);

// Cancel bet
router.post('/:id/cancel', asyncHandler(BetController.cancel));

// Delete bet
router.delete('/:id', asyncHandler(BetController.delete));

module.exports = router;
