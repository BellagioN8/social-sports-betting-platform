/**
 * Score Service
 * Business logic for live scores with caching
 */

const Score = require('../models/Score');
const SportsAPIService = require('./sportsApiService');

// Cache TTL in seconds
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300; // 5 minutes default

class ScoreService {
  /**
   * Get live scores with caching
   * @param {string} sportType - Sport type
   * @param {boolean} forceRefresh - Force API fetch
   * @returns {Promise<object>} Scores and metadata
   */
  static async getLiveScores(sportType, forceRefresh = false) {
    // Validate sport type
    const validSports = ['football', 'basketball', 'baseball', 'soccer', 'hockey', 'other'];
    if (!validSports.includes(sportType)) {
      throw new Error('Invalid sport type');
    }

    // Check cache status
    const cacheStatus = await Score.getCacheStatus(sportType);
    const cacheAge = cacheStatus.last_update
      ? (Date.now() - new Date(cacheStatus.last_update).getTime()) / 1000
      : Infinity;

    // Refresh if needed
    if (forceRefresh || cacheAge > CACHE_TTL) {
      await this.refreshScores(sportType);
    }

    // Get scores from database
    const liveGames = await Score.findLive(sportType);
    const upcomingGames = await Score.findUpcoming(sportType, 5);
    const recentGames = await Score.findRecentlyCompleted(sportType, 24, 5);

    return {
      live: liveGames,
      upcoming: upcomingGames,
      recent: recentGames,
      cacheAge: Math.floor(cacheAge),
      lastUpdate: cacheStatus.last_update,
    };
  }

  /**
   * Get game details by ID
   * @param {string} gameId - Game ID
   * @returns {Promise<object>} Game details
   */
  static async getGameById(gameId) {
    // Check database first
    let game = await Score.findByGameId(gameId);

    // If not in cache or outdated, fetch from API
    if (!game || this._isStale(game.last_updated)) {
      const apiGame = await SportsAPIService.fetchGameById(gameId);

      if (apiGame) {
        game = await Score.upsert(apiGame);
      }
    }

    if (!game) {
      throw new Error('Game not found');
    }

    return game;
  }

  /**
   * Get scores by date range
   * @param {string} sportType - Sport type
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Scores
   */
  static async getScoresByDateRange(sportType, startDate, endDate) {
    // Validate dates
    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    // Check if range is reasonable (max 7 days)
    const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) {
      throw new Error('Date range cannot exceed 7 days');
    }

    // Get from database
    const scores = await Score.findByDateRange(sportType, startDate, endDate);

    return scores;
  }

  /**
   * Get upcoming games
   * @param {string} sportType - Sport type
   * @param {number} days - Days ahead to fetch
   * @returns {Promise<Array>} Upcoming games
   */
  static async getUpcomingGames(sportType, days = 7) {
    // Fetch from API
    const apiGames = await SportsAPIService.fetchUpcomingGames(sportType, days);

    // Update cache
    for (const game of apiGames) {
      await Score.upsert(game);
    }

    // Return from database
    const games = await Score.findUpcoming(sportType, days * 5);
    return games;
  }

  /**
   * Refresh scores from API
   * @param {string} sportType - Sport type
   * @returns {Promise<number>} Number of games updated
   */
  static async refreshScores(sportType) {
    try {
      // Fetch from API
      const apiScores = await SportsAPIService.fetchLiveScores(sportType);

      let updateCount = 0;

      // Update database
      for (const score of apiScores) {
        await Score.upsert(score);
        updateCount++;
      }

      console.log(`Refreshed ${updateCount} ${sportType} scores`);
      return updateCount;
    } catch (error) {
      console.error(`Error refreshing ${sportType} scores:`, error.message);
      throw error;
    }
  }

  /**
   * Refresh all sports
   * @returns {Promise<object>} Update counts by sport
   */
  static async refreshAllScores() {
    const sports = ['football', 'basketball', 'baseball', 'soccer', 'hockey'];
    const results = {};

    for (const sport of sports) {
      try {
        results[sport] = await this.refreshScores(sport);
      } catch (error) {
        console.error(`Failed to refresh ${sport}:`, error.message);
        results[sport] = 0;
      }
    }

    return results;
  }

  /**
   * Get games by status
   * @param {string} status - Game status
   * @param {string} sportType - Optional sport type
   * @returns {Promise<Array>} Games
   */
  static async getGamesByStatus(status, sportType = null) {
    const validStatuses = ['scheduled', 'live', 'halftime', 'final', 'postponed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      throw new Error('Invalid game status');
    }

    return await Score.findByStatus(status, sportType);
  }

  /**
   * Clean up old scores
   * @param {number} days - Days to keep
   * @returns {Promise<number>} Number of deleted records
   */
  static async cleanupOldScores(days = 7) {
    const deleted = await Score.deleteOld(days);
    console.log(`Deleted ${deleted} old score records`);
    return deleted;
  }

  /**
   * Get cache statistics
   * @returns {Promise<object>} Cache stats for all sports
   */
  static async getCacheStatistics() {
    const sports = ['football', 'basketball', 'baseball', 'soccer', 'hockey'];
    const stats = {};

    for (const sport of sports) {
      stats[sport] = await Score.getCacheStatus(sport);
    }

    return stats;
  }

  /**
   * Check if score data is stale
   * @private
   * @param {Date} lastUpdated - Last update timestamp
   * @returns {boolean} Is stale
   */
  static _isStale(lastUpdated) {
    if (!lastUpdated) return true;

    const ageSeconds = (Date.now() - new Date(lastUpdated).getTime()) / 1000;
    return ageSeconds > CACHE_TTL;
  }
}

module.exports = ScoreService;
