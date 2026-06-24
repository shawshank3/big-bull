/**
 * inputFilters
 * Reusable event handlers for restricting native input behaviour.
 */

// Keys disallowed in <input type="number"> when only whole-number values
// are acceptable. Browsers normally let these through for "number" inputs,
// so we block them at the keydown level.
const DECIMAL_INPUT_KEYS = ['.', ',', 'e', 'E', '+', '-'];

/**
 * blockDecimalKeys(event)
 *
 * onKeyDown handler that prevents users from typing characters which would
 * produce a fractional or signed number. Use on integer-only numeric inputs
 * (e.g. stock quantity).
 *
 * @param {KeyboardEvent} event
 */
export const blockDecimalKeys = (event) => {
  if (DECIMAL_INPUT_KEYS.includes(event.key)) {
    event.preventDefault();
  }
};
