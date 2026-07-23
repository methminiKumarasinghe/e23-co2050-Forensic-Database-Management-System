const { logger } = require('../utils/logger');

/**
 * Global error-handling middleware.
 * Must be the LAST middleware registered in app.js (4-argument signature).
 *
 * Returns a standardized JSON error body:
 *   { success: false, message, ...(errors in dev) }
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} —`, err.message);

  // PostgreSQL-specific error codes
  if (err.code === '23505') {
    // Unique constraint violation
    const detail = err.detail || '';
    let message = 'A record with this value already exists.';

    if (detail.includes('username')) message = 'Username is already taken.';
    else if (detail.includes('email')) message = 'Email is already registered.';
    else if (detail.includes('nic')) message = 'NIC is already registered.';
    else if (detail.includes('badge_number')) message = 'Badge number is already in use.';
    else if (detail.includes('registration_number')) message = 'Registration number is already in use.';
    else if (detail.includes('employee_number')) message = 'Employee number is already in use.';

    return res.status(409).json({ success: false, message });
  }

  if (err.code === '23503') {
    // Foreign key violation
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist. Please check hospital / station ID.',
    });
  }

  if (err.code === '23514') {
    // Check constraint violation
    return res.status(400).json({ success: false, message: 'Invalid value for a constrained field.' });
  }

  // JWT errors (should already be caught in auth.middleware but defensive fallback)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
  }

  // Operational / custom errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  const body = { success: false, message };

  // Expose stack in development only
  if (process.env.NODE_ENV === 'development') {
    body.stack = err.stack;
  }

  return res.status(statusCode).json(body);
};

/**
 * 404 handler — called when no route matches.
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { errorHandler, notFoundHandler };
