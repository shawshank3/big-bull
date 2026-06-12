/**
 * Global Error Handler Middleware
 * Single exit point for all API error responses.
 * Distinguishes operational errors (AppError) from unexpected programming errors.
 */
const AppError = require('../shared/AppError');

const errorHandler = (err, req, res, next) => {
  // Determine if this is a known operational error or an unexpected crash
  const isOperational = err instanceof AppError && err.isOperational;
  const statusCode = isOperational ? err.statusCode : 500;

  // In production, hide internal error details from clients for non-operational errors
  const message = isOperational
    ? err.message
    : process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again later.'
      : err.message;

  // Always log the full error server-side
  console.error(`[${new Date().toISOString()}] ${statusCode} ${req.method} ${req.originalUrl}`, {
    message: err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });

  const body = {
    success: false,
    data: null,
    error: {
      code: statusCode,
      message,
    },
    timestamp: new Date().toISOString(),
  };

  // Include stack trace in development for easier debugging
  if (process.env.NODE_ENV === 'development') {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};

module.exports = errorHandler;
