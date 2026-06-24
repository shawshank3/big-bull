/**
 * Unit tests and property-based tests for tax.service.js pure functions.
 *
 * Tests cover:
 *  - getFYDateRange: FY date range computation
 *  - getCurrentFY: current financial year detection
 *  - matchFIFO: FIFO cost basis matching algorithm
 *  - computeEstimatedTax: tax computation with rates and exemption
 *
 * Runner: Jest
 * Library: fast-check (property-based testing)
 */
const fc = require('fast-check');
const { getFYDateRange, getCurrentFY, matchFIFO, computeEstimatedTax } = require('./tax.service');

// ── getFYDateRange ───────────────────────────────────────────────────────────

describe('getFYDateRange', () => {
  it('returns April 1 as start for given year', () => {
    const { start } = getFYDateRange(2025);
    expect(start.getUTCFullYear()).toBe(2025);
    expect(start.getUTCMonth()).toBe(3); // April = 3 (0-indexed)
    expect(start.getUTCDate()).toBe(1);
  });

  it('returns March 31 of next year as end', () => {
    const { end } = getFYDateRange(2025);
    expect(end.getUTCFullYear()).toBe(2026);
    expect(end.getUTCMonth()).toBe(2); // March = 2 (0-indexed)
    expect(end.getUTCDate()).toBe(31);
  });

  it('end includes full day (23:59:59.999)', () => {
    const { end } = getFYDateRange(2025);
    expect(end.getUTCHours()).toBe(23);
    expect(end.getUTCMinutes()).toBe(59);
    expect(end.getUTCSeconds()).toBe(59);
    expect(end.getUTCMilliseconds()).toBe(999);
  });

  it('start is always before end', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2000, max: 2100 }), (year) => {
        const { start, end } = getFYDateRange(year);
        expect(start.getTime()).toBeLessThan(end.getTime());
      })
    );
  });

  it('FY span is approximately 365-366 days', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2000, max: 2100 }), (year) => {
        const { start, end } = getFYDateRange(year);
        const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        expect(days).toBeGreaterThanOrEqual(364);
        expect(days).toBeLessThanOrEqual(366);
      })
    );
  });
});

// ── getCurrentFY ─────────────────────────────────────────────────────────────

describe('getCurrentFY', () => {
  it('returns a 4-digit year', () => {
    const fy = getCurrentFY();
    expect(fy).toBeGreaterThanOrEqual(2000);
    expect(fy).toBeLessThanOrEqual(2100);
  });

  it('returns a number', () => {
    expect(typeof getCurrentFY()).toBe('number');
  });
});

// ── matchFIFO ────────────────────────────────────────────────────────────────

describe('matchFIFO', () => {
  it('returns empty array when no sell transactions', () => {
    const buyLots = [
      { executedAt: new Date('2024-01-01'), quantity: 10, pricePerUnit: 100, remainingQty: 10 },
    ];
    const result = matchFIFO(buyLots, []);
    expect(result).toEqual([]);
  });

  it('returns empty array when no buy lots', () => {
    const sellTxns = [{ executedAt: new Date('2024-06-01'), quantity: 5, pricePerUnit: 120 }];
    const result = matchFIFO([], sellTxns);
    expect(result).toEqual([]);
  });

  it('matches single sell against single buy lot (full consumption)', () => {
    const buyLots = [
      { executedAt: new Date('2024-01-01'), quantity: 10, pricePerUnit: 100, remainingQty: 10 },
    ];
    const sellTxns = [{ executedAt: new Date('2024-06-01'), quantity: 10, pricePerUnit: 150 }];

    const gains = matchFIFO(buyLots, sellTxns);

    expect(gains).toHaveLength(1);
    expect(gains[0].quantity).toBe(10);
    expect(gains[0].buyPrice).toBe(100);
    expect(gains[0].sellPrice).toBe(150);
    expect(gains[0].gain).toBe(500); // (150-100) * 10
    expect(gains[0].gainType).toBe('STCG'); // < 365 days
  });

  it('splits sell across multiple buy lots', () => {
    const buyLots = [
      { executedAt: new Date('2024-01-01'), quantity: 5, pricePerUnit: 100, remainingQty: 5 },
      { executedAt: new Date('2024-02-01'), quantity: 10, pricePerUnit: 110, remainingQty: 10 },
    ];
    const sellTxns = [{ executedAt: new Date('2024-07-01'), quantity: 8, pricePerUnit: 130 }];

    const gains = matchFIFO(buyLots, sellTxns);

    expect(gains).toHaveLength(2);
    // First lot: consume all 5 units
    expect(gains[0].quantity).toBe(5);
    expect(gains[0].buyPrice).toBe(100);
    expect(gains[0].gain).toBe(150); // (130-100) * 5
    // Second lot: consume 3 units
    expect(gains[1].quantity).toBe(3);
    expect(gains[1].buyPrice).toBe(110);
    expect(gains[1].gain).toBe(60); // (130-110) * 3
  });

  it('partially consumes buy lot and leaves remainder', () => {
    const buyLots = [
      { executedAt: new Date('2024-01-01'), quantity: 10, pricePerUnit: 100, remainingQty: 10 },
    ];
    const sellTxns = [{ executedAt: new Date('2024-06-01'), quantity: 3, pricePerUnit: 120 }];

    const gains = matchFIFO(buyLots, sellTxns);

    expect(gains).toHaveLength(1);
    expect(gains[0].quantity).toBe(3);
    expect(buyLots[0].remainingQty).toBe(7); // 10 - 3 remaining
  });

  it('classifies as LTCG when holding period >= 365 days', () => {
    const buyLots = [
      { executedAt: new Date('2023-01-01'), quantity: 10, pricePerUnit: 100, remainingQty: 10 },
    ];
    const sellTxns = [{ executedAt: new Date('2024-01-01'), quantity: 10, pricePerUnit: 150 }];

    const gains = matchFIFO(buyLots, sellTxns);

    expect(gains[0].gainType).toBe('LTCG');
    expect(gains[0].holdingDays).toBeGreaterThanOrEqual(365);
  });

  it('classifies as STCG when holding period < 365 days', () => {
    const buyLots = [
      { executedAt: new Date('2024-01-01'), quantity: 10, pricePerUnit: 100, remainingQty: 10 },
    ];
    const sellTxns = [{ executedAt: new Date('2024-06-01'), quantity: 10, pricePerUnit: 150 }];

    const gains = matchFIFO(buyLots, sellTxns);

    expect(gains[0].gainType).toBe('STCG');
    expect(gains[0].holdingDays).toBeLessThan(365);
  });

  it('handles multiple sells consuming lots in FIFO order', () => {
    const buyLots = [
      { executedAt: new Date('2024-01-01'), quantity: 5, pricePerUnit: 100, remainingQty: 5 },
      { executedAt: new Date('2024-02-01'), quantity: 5, pricePerUnit: 110, remainingQty: 5 },
      { executedAt: new Date('2024-03-01'), quantity: 5, pricePerUnit: 120, remainingQty: 5 },
    ];
    const sellTxns = [
      { executedAt: new Date('2024-07-01'), quantity: 7, pricePerUnit: 130 },
      { executedAt: new Date('2024-08-01'), quantity: 4, pricePerUnit: 140 },
    ];

    const gains = matchFIFO(buyLots, sellTxns);

    // First sell (7 units): 5 from lot1 + 2 from lot2
    // Second sell (4 units): 3 from lot2 + 1 from lot3
    const totalMatched = gains.reduce((sum, g) => sum + g.quantity, 0);
    expect(totalMatched).toBe(11); // 7 + 4
  });

  it('computes negative gain (loss) correctly', () => {
    const buyLots = [
      { executedAt: new Date('2024-01-01'), quantity: 10, pricePerUnit: 200, remainingQty: 10 },
    ];
    const sellTxns = [{ executedAt: new Date('2024-06-01'), quantity: 10, pricePerUnit: 150 }];

    const gains = matchFIFO(buyLots, sellTxns);

    expect(gains[0].gain).toBe(-500); // (150-200) * 10
  });

  // Property: total matched quantity equals total sell quantity (when buy supply is sufficient)
  it('PROPERTY: total matched qty == total sell qty when supply sufficient', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 50 }),
        fc.nat({ max: 500 }),
        fc.nat({ max: 500 }),
        (buyQty, sellQty, buyPrice, sellPrice) => {
          // Ensure buy supply >= sell demand
          const actualBuyQty = Math.max(buyQty, sellQty);
          const buyLots = [
            {
              executedAt: new Date('2024-01-01'),
              quantity: actualBuyQty,
              pricePerUnit: buyPrice + 1,
              remainingQty: actualBuyQty,
            },
          ];
          const sellTxns = [
            {
              executedAt: new Date('2024-06-01'),
              quantity: sellQty,
              pricePerUnit: sellPrice + 1,
            },
          ];

          const gains = matchFIFO(buyLots, sellTxns);
          const totalMatched = gains.reduce((sum, g) => sum + g.quantity, 0);
          expect(totalMatched).toBe(sellQty);
        }
      )
    );
  });

  // Property: gain = (sellPrice - buyPrice) * quantity for each record
  it('PROPERTY: gain formula is (sellPrice - buyPrice) * quantity', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (qty, buyPrice, sellPrice) => {
          const buyLots = [
            {
              executedAt: new Date('2024-01-01'),
              quantity: qty,
              pricePerUnit: buyPrice,
              remainingQty: qty,
            },
          ];
          const sellTxns = [
            { executedAt: new Date('2024-06-01'), quantity: qty, pricePerUnit: sellPrice },
          ];

          const gains = matchFIFO(buyLots, sellTxns);
          expect(gains[0].gain).toBe((sellPrice - buyPrice) * qty);
        }
      )
    );
  });
});

// ── computeEstimatedTax ──────────────────────────────────────────────────────

describe('computeEstimatedTax', () => {
  it('returns zero tax for negative STCG and negative LTCG', () => {
    const result = computeEstimatedTax(-5000, -10000);
    expect(result.stcgTax).toBe(0);
    expect(result.ltcgTax).toBe(0);
    expect(result.estimatedTax).toBe(0);
  });

  it('computes 20% STCG tax on positive short-term gains', () => {
    const result = computeEstimatedTax(10000, 0);
    expect(result.stcgTax).toBe(2000); // 10000 * 0.2
    expect(result.ltcgTax).toBe(0);
    expect(result.estimatedTax).toBe(2000);
  });

  it('applies ₹1,25,000 exemption on LTCG', () => {
    const result = computeEstimatedTax(0, 100000);
    expect(result.ltcgTax).toBe(0); // Below exemption
    expect(result.estimatedTax).toBe(0);
  });

  it('applies ₹1,25,000 exemption — tax only on excess', () => {
    const result = computeEstimatedTax(0, 225000);
    // (225000 - 125000) * 0.125 = 100000 * 0.125 = 12500
    expect(result.ltcgTax).toBe(12500);
    expect(result.estimatedTax).toBe(12500);
  });

  it('computes combined tax for both positive STCG and LTCG', () => {
    const result = computeEstimatedTax(50000, 200000);
    // STCG: 50000 * 0.2 = 10000
    // LTCG: (200000 - 125000) * 0.125 = 75000 * 0.125 = 9375
    expect(result.stcgTax).toBe(10000);
    expect(result.ltcgTax).toBe(9375);
    expect(result.estimatedTax).toBe(19375);
  });

  it('zero STCG produces zero stcgTax', () => {
    const result = computeEstimatedTax(0, 200000);
    expect(result.stcgTax).toBe(0);
  });

  it('LTCG exactly at exemption limit produces zero ltcgTax', () => {
    const result = computeEstimatedTax(0, 125000);
    expect(result.ltcgTax).toBe(0);
  });

  // Property: estimatedTax is always >= 0
  it('PROPERTY: estimated tax is never negative', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: 1e6 }),
        fc.double({ min: -1e6, max: 1e6 }),
        (stcg, ltcg) => {
          // Filter out NaN/Infinity
          fc.pre(isFinite(stcg) && isFinite(ltcg));
          const { estimatedTax } = computeEstimatedTax(stcg, ltcg);
          expect(estimatedTax).toBeGreaterThanOrEqual(0);
        }
      )
    );
  });

  // Property: stcgTax + ltcgTax === estimatedTax
  it('PROPERTY: estimatedTax === stcgTax + ltcgTax', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: 1e6 }),
        fc.double({ min: -1e6, max: 1e6 }),
        (stcg, ltcg) => {
          fc.pre(isFinite(stcg) && isFinite(ltcg));
          const { stcgTax, ltcgTax, estimatedTax } = computeEstimatedTax(stcg, ltcg);
          expect(estimatedTax).toBeCloseTo(stcgTax + ltcgTax, 10);
        }
      )
    );
  });

  // Property: monotonicity — more STCG/LTCG → same or more tax
  it('PROPERTY: tax is monotonically non-decreasing with increasing gains', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1e6 }),
        fc.double({ min: 0, max: 1e6 }),
        fc.double({ min: 0, max: 1e5 }),
        (stcg, ltcg, delta) => {
          fc.pre(isFinite(stcg) && isFinite(ltcg) && isFinite(delta));
          const { estimatedTax: tax1 } = computeEstimatedTax(stcg, ltcg);
          const { estimatedTax: tax2 } = computeEstimatedTax(stcg + delta, ltcg + delta);
          expect(tax2).toBeGreaterThanOrEqual(tax1 - 0.001); // floating point tolerance
        }
      )
    );
  });
});
