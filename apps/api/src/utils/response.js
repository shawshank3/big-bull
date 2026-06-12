/**
 * Response Utils
 * Utility functions for standardized API responses
 */
const sendSuccess = (res, data, message = 'Success', status = 200) => {
  res.status(status).json({
    success: true,
    message,
    data,
    error: null,
    timestamp: new Date().toISOString(),
  });
};

const sendError = (res, message = 'Error', status = 400) => {
  res.status(status).json({
    success: false,
    data: null,
    error: {
      code: status,
      message,
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
