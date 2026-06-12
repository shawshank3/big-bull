/**
 * catchAsync
 * Wraps async Express route handlers to eliminate repetitive try/catch blocks.
 * Any unhandled rejection is forwarded to the Express global error handler via next(err).
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
