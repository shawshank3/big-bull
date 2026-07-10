const {
  toPaise,
  fromPaise,
  roundRupee,
  moneyAdd,
  moneySubtract,
  moneyMultiply,
} = require('./money');

describe('money helpers', () => {
  test('toPaise and fromPaise convert correctly', () => {
    expect(toPaise(123.45)).toBe(12345);
    expect(fromPaise(12345)).toBe(123.45);
  });

  test('roundRupee protects against floating point drift', () => {
    expect(roundRupee(0.1 + 0.2)).toBe(0.3);
    expect(roundRupee(0.1 + 0.7)).toBe(0.8);
  });

  test('moneyAdd handles many values in paise', () => {
    expect(moneyAdd(100.01, 200.02, 300.03)).toBe(600.06);
  });

  test('moneySubtract handles precise subtraction', () => {
    expect(moneySubtract(500.15, 123.45)).toBe(376.7);
  });

  test('moneyMultiply uses paise rounding', () => {
    expect(moneyMultiply(123.45, 2)).toBe(246.9);
    expect(moneyMultiply(10.01, 0.1)).toBe(1.0);
  });
});
