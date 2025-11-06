/**
 * Validation Utilities
 * Input validation helpers
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Valid status
 */
function isValidEmail(email) {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {object} Validation result with errors
 */
function validateUsername(username) {
  const errors = [];

  if (!username || typeof username !== 'string') {
    errors.push('Username is required');
    return { valid: false, errors };
  }

  if (username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }

  if (username.length > 50) {
    errors.push('Username must not exceed 50 characters');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, hyphens, and underscores');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with errors
 */
function validatePassword(password) {
  const errors = [];

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { valid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[@$!%*?&#]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&#)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate registration input
 * @param {object} data - Registration data
 * @returns {object} Validation result
 */
function validateRegistration(data) {
  const errors = {};

  // Username validation
  const usernameResult = validateUsername(data.username);
  if (!usernameResult.valid) {
    errors.username = usernameResult.errors;
  }

  // Email validation
  if (!data.email) {
    errors.email = ['Email is required'];
  } else if (!isValidEmail(data.email)) {
    errors.email = ['Invalid email format'];
  }

  // Password validation
  const passwordResult = validatePassword(data.password);
  if (!passwordResult.valid) {
    errors.password = passwordResult.errors;
  }

  // Display name validation (optional)
  if (data.display_name && data.display_name.length > 100) {
    errors.display_name = ['Display name must not exceed 100 characters'];
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate login input
 * @param {object} data - Login data
 * @returns {object} Validation result
 */
function validateLogin(data) {
  const errors = {};

  // Email or username required
  if (!data.email && !data.username) {
    errors.credential = ['Email or username is required'];
  }

  // Validate email format if email is provided
  if (data.email && !isValidEmail(data.email)) {
    errors.email = ['Invalid email format'];
  }

  // Password required
  if (!data.password) {
    errors.password = ['Password is required'];
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Sanitize user input (remove extra whitespace)
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim();
}

module.exports = {
  isValidEmail,
  validateUsername,
  validatePassword,
  validateRegistration,
  validateLogin,
  sanitizeInput,
};
