/**
 * Score Updater Job
 * Background job to periodically update live scores
 */

const ScoreService = require('../services/scoreService');

// Update interval in milliseconds
const UPDATE_INTERVAL = parseInt(process.env.SCORE_UPDATE_INTERVAL) || 60000; // 1 minute default
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

class ScoreUpdater {
  constructor() {
    this.updateTimer = null;
    this.cleanupTimer = null;
    this.isRunning = false;
    this.lastUpdate = null;
    this.updateCount = 0;
  }

  /**
   * Start the background job
   */
  start() {
    if (this.isRunning) {
      console.log('Score updater is already running');
      return;
    }

    console.log('='.repeat(50));
    console.log('Starting Score Updater Job');
    console.log(`Update interval: ${UPDATE_INTERVAL / 1000}s`);
    console.log('='.repeat(50));

    this.isRunning = true;

    // Run initial update
    this.updateScores();

    // Schedule periodic updates
    this.updateTimer = setInterval(() => {
      this.updateScores();
    }, UPDATE_INTERVAL);

    // Schedule daily cleanup
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, CLEANUP_INTERVAL);

    // Initial cleanup
    this.cleanup();
  }

  /**
   * Stop the background job
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping Score Updater Job');

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.isRunning = false;
  }

  /**
   * Update scores from API
   */
  async updateScores() {
    const startTime = Date.now();

    try {
      console.log(`[${new Date().toISOString()}] Updating scores...`);

      const results = await ScoreService.refreshAllScores();

      const totalUpdated = Object.values(results).reduce((sum, count) => sum + count, 0);

      this.lastUpdate = new Date();
      this.updateCount++;

      const duration = Date.now() - startTime;

      console.log(
        `[${new Date().toISOString()}] ✓ Updated ${totalUpdated} games in ${duration}ms`,
        results
      );
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ✗ Score update failed:`, error.message);
    }
  }

  /**
   * Clean up old scores
   */
  async cleanup() {
    try {
      console.log(`[${new Date().toISOString()}] Running score cleanup...`);

      const deleted = await ScoreService.cleanupOldScores(7);

      console.log(`[${new Date().toISOString()}] ✓ Cleaned up ${deleted} old score records`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ✗ Cleanup failed:`, error.message);
    }
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastUpdate: this.lastUpdate,
      updateCount: this.updateCount,
      updateInterval: UPDATE_INTERVAL,
    };
  }

  /**
   * Force immediate update
   */
  async forceUpdate() {
    console.log('Forcing immediate score update...');
    await this.updateScores();
  }
}

// Singleton instance
const updater = new ScoreUpdater();

module.exports = updater;
