/**
 * AppError
 * Custom operational error class for expected application failures.
 * isOperational: true signals to the global error handler that this is a
 * known, handled error (not a programming bug) and can be sent to the client.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
