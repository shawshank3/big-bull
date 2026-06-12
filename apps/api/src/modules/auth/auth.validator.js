/**
 * Auth Validator
 * Zod schemas for validating auth request bodies
 */
const { z } = require('zod');

/**
 * Schema for user registration.
 * - name: 2–50 characters
 * - email: valid email format
 * - password: min 8 chars, must contain at least one digit and one special character
 */
const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters'),
    email: z.string().email('Please provide a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/\d/, 'Password must contain at least one number')
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/,
        'Password must contain at least one special character'
      ),
  })
  .strict();

/**
 * Schema for user login.
 * - email: valid email format
 * - password: non-empty string (presence check only)
 */
const loginSchema = z
  .object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

module.exports = { registerSchema, loginSchema };
