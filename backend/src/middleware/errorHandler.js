/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

/**
 * Error handler middleware
 * Catches and formats errors
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Default error
  let status = 500;
  let message = 'Internal server error';
  let errors = null;

  // Validation errors (JSON stringified from service layer)
  if (err.message && err.message.startsWith('{')) {
    try {
      errors = JSON.parse(err.message);
      status = 400;
      message = 'Validation failed';
    } catch (e) {
      // Not JSON, treat as regular error
      message = err.message;
    }
  }
  // Known errors with messages
  else if (err.message) {
    const knownErrors = {
      'Email already registered': 409,
      'Username already taken': 409,
      'Invalid credentials': 401,
      'Account is deactivated': 403,
      'User not found': 404,
      'Invalid or expired token': 401,
      'Invalid or expired refresh token': 401,
      'Refresh token has been revoked or expired': 401,
      'Refresh token required': 400,
      'No authorization token provided': 401,
      'Email verification required': 403,
    };

    status = knownErrors[err.message] || 500;
    message = err.message;
  }

  // Database errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        status = 409;
        message = 'Resource already exists';
        break;
      case '23503': // Foreign key violation
        status = 400;
        message = 'Invalid reference';
        break;
      case '23502': // Not null violation
        status = 400;
        message = 'Required field missing';
        break;
      case '22P02': // Invalid text representation
        status = 400;
        message = 'Invalid data format';
        break;
    }
  }

  // Send error response
  const response = {
    success: false,
    error: message,
  };

  if (errors) {
    response.errors = errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(status).json(response);
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
  });
}

/**
 * Async handler wrapper
 * Catches errors in async route handlers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
