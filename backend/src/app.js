/**
 * Express Application Setup
 * Configures middleware and routes
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const betRoutes = require('./routes/bets');
const groupRoutes = require('./routes/groups');
const scoreRoutes = require('./routes/scores');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { testConnection } = require('./config/database');

// Create Express app
const app = express();

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Global rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/bets', betRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/scores', scoreRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

/**
 * Initialize database connection
 */
async function initializeDatabase() {
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      console.log('✓ Database connection established');
    } else {
      console.error('✗ Database connection failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ Database initialization error:', error.message);
    process.exit(1);
  }
}

// Initialize database on app startup
initializeDatabase();

module.exports = app;
