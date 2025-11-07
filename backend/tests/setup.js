/**
 * Jest setup file
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_testing_only';
process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret_key';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  log: jest.fn(), // Mock console.log
  debug: jest.fn(), // Mock console.debug
  info: jest.fn(), // Mock console.info
  warn: jest.fn(), // Keep console.warn for debugging
  error: jest.fn(), // Keep console.error for debugging
};

// Add global test helpers if needed
global.testHelpers = {
  mockUser: {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    created_at: new Date(),
  },
  mockBet: {
    id: 1,
    user_id: 1,
    amount: 100,
    description: 'Test bet',
    status: 'pending',
  },
  mockGame: {
    game_id: 'test_game_1',
    sport_type: 'football',
    home_team: 'Team A',
    away_team: 'Team B',
    home_score: 14,
    away_score: 10,
    status: 'live',
  },
};
