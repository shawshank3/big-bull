/**
 * Property-based tests for parseExpiry (auth.service.js)
 *
 * Property 1: parseExpiry multiplier correctness
 *   Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
 *
 * Property 2: parseExpiry rejects invalid inputs
 *   Validates: Requirements 1.6
 */

'use strict';

const fc = require('fast-check');
const { parseExpiry } = require('../auth.service');

const MULTIPLIERS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
const VALID_UNITS = ['s', 'm', 'h', 'd'];
const EXPIRY_RE = /^(\d+)(s|m|h|d)$/;

// ─── Property 1: multiplier correctness ────────────────────────────────────
// **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

describe('Property 1: parseExpiry multiplier correctness', () => {
  it('returns n * MULTIPLIERS[unit] for any positive integer n and valid unit', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000 }),
        fc.constantFrom(...VALID_UNITS),
        (n, unit) => {
          const result = parseExpiry(`${n}${unit}`);
          expect(result).toBe(n * MULTIPLIERS[unit]);
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ─── Property 2: invalid input rejection ────────────────────────────────────
// **Validates: Requirements 1.6**

/**
 * Arbitrary that generates strings NOT matching /^(\d+)(s|m|h|d)$/.
 * Covers the full space of invalid inputs by building them from several
 * generators and filtering out any that accidentally match the valid pattern.
 */
const invalidExpiryArb = fc.oneof(
  // empty string
  fc.constant(''),
  // whitespace only
  fc.stringMatching(/^\s+$/),
  // digits followed by an unsupported suffix (not s/m/h/d)
  fc.tuple(
    fc.integer({ min: 1, max: 9999 }).map(String),
    fc.stringMatching(/^[^smhd\s]$/)
  ).map(([n, suffix]) => `${n}${suffix}`),
  // non-numeric prefix
  fc.tuple(
    fc.stringMatching(/^[a-zA-Z]+/),
    fc.constantFrom(...VALID_UNITS)
  ).map(([prefix, unit]) => `${prefix}${unit}`),
  // valid number + valid unit but with leading/trailing whitespace
  fc.tuple(
    fc.integer({ min: 1, max: 9999 }).map(String),
    fc.constantFrom(...VALID_UNITS)
  ).map(([n, unit]) => ` ${n}${unit}`),
  fc.tuple(
    fc.integer({ min: 1, max: 9999 }).map(String),
    fc.constantFrom(...VALID_UNITS)
  ).map(([n, unit]) => `${n}${unit} `),
  // extra characters appended after valid pattern
  fc.tuple(
    fc.integer({ min: 1, max: 9999 }).map(String),
    fc.constantFrom(...VALID_UNITS),
    fc.string({ minLength: 1 })
  ).map(([n, unit, extra]) => `${n}${unit}${extra}`),
  // arbitrary strings that may or may not look like expiry strings
  fc.string({ minLength: 0, maxLength: 20 })
).filter((s) => !EXPIRY_RE.test(s));

describe('Property 2: parseExpiry rejects invalid inputs', () => {
  it('throws an Error for every string that does not match /^(\\d+)(s|m|h|d)$/', () => {
    fc.assert(
      fc.property(invalidExpiryArb, (invalidStr) => {
        expect(() => parseExpiry(invalidStr)).toThrow(Error);
      }),
      { numRuns: 500 }
    );
  });

  it('error message contains the invalid string', () => {
    fc.assert(
      fc.property(invalidExpiryArb, (invalidStr) => {
        let thrownError;
        try {
          parseExpiry(invalidStr);
        } catch (e) {
          thrownError = e;
        }
        expect(thrownError).toBeInstanceOf(Error);
        expect(thrownError.message).toContain(invalidStr);
      }),
      { numRuns: 500 }
    );
  });

  // Explicit spot-checks for documentation purposes
  it('throws for empty string', () => {
    expect(() => parseExpiry('')).toThrow(Error);
  });

  it('throws for non-numeric prefix (e.g. "abc")', () => {
    expect(() => parseExpiry('abc')).toThrow(/abc/);
  });

  it('throws for unsupported suffix (e.g. "30x")', () => {
    const err = (() => {
      try { parseExpiry('30x'); } catch (e) { return e; }
    })();
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain('30x');
  });

  it('throws for string with leading whitespace (e.g. " 30s")', () => {
    expect(() => parseExpiry(' 30s')).toThrow(/ 30s/);
  });

  it('throws for string with trailing whitespace (e.g. "30s ")', () => {
    expect(() => parseExpiry('30s ')).toThrow(/30s /);
  });
});
