// Validation Rules and Regex Constants - UI Version (mirrors API constants)

// Regular Expressions
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  SYMBOL: /^[A-Z]{1,10}$/,
  POSITIVE_NUMBER: /^\d*\.?\d+$/,
  INTEGER: /^\d+$/,
  DECIMAL: /^\d+(\.\d{1,2})?$/,
  USERNAME: /^[a-zA-Z0-9_]{3,50}$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  AADHAR: /^\d{12}$/,
};

// String Length Limits
export const STRING_LIMITS = {
  USERNAME: { MIN: 3, MAX: 50 },
  PASSWORD: { MIN: 8, MAX: 128 },
  EMAIL: { MIN: 5, MAX: 100 },
  NAME: { MIN: 2, MAX: 100 },
  SYMBOL: { MIN: 1, MAX: 10 },
  DESCRIPTION: { MIN: 10, MAX: 1000 },
  COMMENT: { MIN: 1, MAX: 500 },
  TITLE: { MIN: 3, MAX: 200 },
  SEARCH: { MIN: 1, MAX: 100 },
};

// Numeric Limits
export const NUMERIC_LIMITS = {
  PRICE: { MIN: 0.01, MAX: 1000000 },
  QUANTITY: { MIN: 1, MAX: 1000000 },
  AMOUNT: { MIN: 0.01, MAX: 10000000 },
  PERCENTAGE: { MIN: 0, MAX: 100 },
  AGE: { MIN: 18, MAX: 120 },
  RATING: { MIN: 1, MAX: 5 },
  OTP: { LENGTH: 6 },
};

// File Upload Limits
export const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  MAX_FILES: 10,
};

// Form validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PASSWORD:
    'Password must contain at least 8 characters with uppercase, lowercase, number and special character',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_USERNAME: 'Username can only contain letters, numbers and underscores (3-50 characters)',
  INVALID_PAN: 'Please enter a valid PAN number',
  INVALID_AADHAR: 'Please enter a valid 12-digit Aadhar number',
  MIN_LENGTH: (min) => `Minimum ${min} characters required`,
  MAX_LENGTH: (max) => `Maximum ${max} characters allowed`,
  MIN_VALUE: (min) => `Minimum value is ${min}`,
  MAX_VALUE: (max) => `Maximum value is ${max}`,
  INVALID_FORMAT: 'Invalid format',
  PASSWORDS_NOT_MATCH: 'Passwords do not match',
  FILE_TOO_LARGE: `File size must be less than ${FILE_LIMITS.MAX_SIZE / 1024 / 1024}MB`,
  INVALID_FILE_TYPE: 'Invalid file type',
  TERMS_REQUIRED: 'Please accept the terms and conditions',
  PRIVACY_REQUIRED: 'Please accept the privacy policy',
};

// Input field configurations
export const INPUT_CONFIG = {
  EMAIL: {
    type: 'email',
    autoComplete: 'email',
    placeholder: 'Enter your email address',
  },
  PASSWORD: {
    type: 'password',
    autoComplete: 'new-password',
    placeholder: 'Enter your password',
  },
  CURRENT_PASSWORD: {
    type: 'password',
    autoComplete: 'current-password',
    placeholder: 'Enter your current password',
  },
  PHONE: {
    type: 'tel',
    autoComplete: 'tel',
    placeholder: 'Enter your phone number',
  },
  USERNAME: {
    type: 'text',
    autoComplete: 'username',
    placeholder: 'Enter your username',
  },
};

export default {
  REGEX,
  STRING_LIMITS,
  NUMERIC_LIMITS,
  FILE_LIMITS,
  VALIDATION_MESSAGES,
  INPUT_CONFIG,
};
