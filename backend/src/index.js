/**
 * Server Entry Point
 * Starts the Express server
 */

const app = require('./app');
const { initializeWebSocketServer } = require('./websocket');
const scoreUpdater = require('./jobs/scoreUpdater');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log('='.repeat(50));
  console.log('Social Sports Betting Platform - Backend API');
  console.log('='.repeat(50));
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log(`API endpoints: http://${HOST}:${PORT}/api`);
  console.log(`WebSocket: ws://${HOST}:${PORT}/ws`);
  console.log('='.repeat(50));
});

// Initialize WebSocket server
initializeWebSocketServer(server);

// Start score updater job
scoreUpdater.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server gracefully...');
  scoreUpdater.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Closing server gracefully...');
  scoreUpdater.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = server;
