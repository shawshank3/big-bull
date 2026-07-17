// Validation Rules and Regex Constants

// Regular Expressions
const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  SYMBOL: /^[A-Z]{1,10}$/,
  POSITIVE_NUMBER: /^\d*\.?\d+$/,
  INTEGER: /^\d+$/,
  DECIMAL: /^\d+(\.\d{1,2})?$/,
};

// String Length Limits
const STRING_LIMITS = {
  USERNAME: { MIN: 3, MAX: 50 },
  PASSWORD: { MIN: 8, MAX: 128 },
  EMAIL: { MIN: 5, MAX: 100 },
  NAME: { MIN: 2, MAX: 100 },
  SYMBOL: { MIN: 1, MAX: 10 },
  DESCRIPTION: { MIN: 10, MAX: 1000 },
  COMMENT: { MIN: 1, MAX: 500 },
  TITLE: { MIN: 3, MAX: 200 },
  SEARCH_QUERY: { MIN: 2, MAX: 100 },
};

// Numeric Limits
const NUMERIC_LIMITS = {
  PRICE: { MIN: 0.01, MAX: 1000000 },
  QUANTITY: { MIN: 1, MAX: 1000000 },
  AMOUNT: { MIN: 0.01, MAX: 10000000 },
  PERCENTAGE: { MIN: 0, MAX: 100 },
  AGE: { MIN: 18, MAX: 120 },
  RATING: { MIN: 1, MAX: 5 },
};

// File Upload Limits
const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  MAX_FILES: 10,
};

// Rate Limiting Rules
const RATE_LIMITS = {
  LOGIN_ATTEMPTS: {
    MAX: 5,
    WINDOW: 15 * 60 * 1000, // 15 minutes
    BLOCK_DURATION: 30 * 60 * 1000, // 30 minutes
  },
  API_REQUESTS: {
    MAX: 100,
    WINDOW: 15 * 60 * 1000, // 15 minutes
  },
  PASSWORD_RESET: {
    MAX: 3,
    WINDOW: 60 * 60 * 1000, // 1 hour
  },
};

// Validation Error Messages
const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PASSWORD:
    'Password must contain at least 8 characters, including uppercase, lowercase, number and special character',
  INVALID_PHONE: 'Please enter a valid phone number',
  MIN_LENGTH: (min) => `Minimum length is ${min} characters`,
  MAX_LENGTH: (max) => `Maximum length is ${max} characters`,
  MIN_VALUE: (min) => `Minimum value is ${min}`,
  MAX_VALUE: (max) => `Maximum value is ${max}`,
  INVALID_FORMAT: 'Invalid format',
  PASSWORDS_NOT_MATCH: 'Passwords do not match',
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
};

module.exports = {
  REGEX,
  STRING_LIMITS,
  NUMERIC_LIMITS,
  FILE_LIMITS,
  RATE_LIMITS,
  VALIDATION_MESSAGES,
};
