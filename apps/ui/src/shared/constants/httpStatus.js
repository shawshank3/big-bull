// HTTP Status Code Constants - UI Version (mirrors API constants)
export const HTTP_STATUS = {
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

// User-friendly error messages for UI
export const HTTP_ERROR_MESSAGES = {
  [HTTP_STATUS.BAD_REQUEST]: 'Invalid request. Please check your input and try again.',
  [HTTP_STATUS.UNAUTHORIZED]: 'Your session has expired. Please log in again.',
  [HTTP_STATUS.FORBIDDEN]: "You don't have permission to perform this action.",
  [HTTP_STATUS.NOT_FOUND]: 'The requested resource was not found.',
  [HTTP_STATUS.CONFLICT]: 'This action conflicts with existing data.',
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'Please check your input and try again.',
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Too many requests. Please wait a moment and try again.',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Something went wrong on our end. Please try again later.',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
};

// Success messages for UI
export const HTTP_SUCCESS_MESSAGES = {
  [HTTP_STATUS.OK]: 'Operation completed successfully',
  [HTTP_STATUS.CREATED]: 'Created successfully',
  [HTTP_STATUS.ACCEPTED]: 'Request accepted',
  [HTTP_STATUS.NO_CONTENT]: 'Completed successfully',
};

export default HTTP_STATUS;
