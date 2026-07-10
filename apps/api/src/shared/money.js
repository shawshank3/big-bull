/**
 * Money helpers for INR currency math.
 * All values are stored and displayed in rupees, but internal arithmetic
 * is performed in paise to avoid floating-point drift.
 */

const toPaise = (value) => Math.round(Number(value) * 100);
const fromPaise = (paise) => Number(paise) / 100;

const roundRupee = (value) => fromPaise(toPaise(value));

const moneyAdd = (...values) => {
  const totalPaise = values.reduce((sum, value) => sum + toPaise(value), 0);
  return fromPaise(totalPaise);
};

const moneySubtract = (value, amount) => roundRupee(Number(value) - Number(amount));

const moneyMultiply = (value, multiplier) => roundRupee(Number(value) * Number(multiplier));

module.exports = {
  toPaise,
  fromPaise,
  roundRupee,
  moneyAdd,
  moneySubtract,
  moneyMultiply,
};
