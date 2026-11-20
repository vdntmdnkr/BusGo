/**
 * src/middleware/errorHandler.js
 * Global error-handling middleware — must be registered last in app.js.
 */
const { sendError } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // ── Mongoose CastError (invalid ObjectId) ─────────────
  if (err.name === 'CastError') {
    message = `Invalid ${err.path}: ${err.value}`;
    statusCode = 400;
  }

  // ── Mongoose Duplicate Key ─────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field '${field}'. Please use a different value.`;
    statusCode = 409;
  }

  // ── Mongoose Validation Error ──────────────────────────
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    message = 'Validation failed';
    statusCode = 422;
    return sendError(res, statusCode, message, errors);
  }

  // ── JWT errors ─────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    message = 'Token has expired';
    statusCode = 401;
  }

  // Log in development for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 Error:', err);
  }

  return sendError(res, statusCode, message);
};

module.exports = errorHandler;
