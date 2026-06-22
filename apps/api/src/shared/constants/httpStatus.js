// HTTP Status Code Constants
const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,

  // Client Error
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Error
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

// Status messages for common scenarios
const HTTP_MESSAGES = {
  [HTTP_STATUS.OK]: 'Success',
  [HTTP_STATUS.CREATED]: 'Resource created successfully',
  [HTTP_STATUS.BAD_REQUEST]: 'Bad request',
  [HTTP_STATUS.UNAUTHORIZED]: 'Unauthorized access',
  [HTTP_STATUS.FORBIDDEN]: 'Access forbidden',
  [HTTP_STATUS.NOT_FOUND]: 'Resource not found',
  [HTTP_STATUS.CONFLICT]: 'Resource conflict',
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'Validation failed',
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too many requests',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Internal server error',
};

module.exports = {
  HTTP_STATUS,
  HTTP_MESSAGES,
};
