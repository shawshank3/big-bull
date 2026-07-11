/**
 * Unit tests and property-based tests for tax.service.js pure functions.
 *
 * Tests cover:
 *  - getFYDateRange: FY date range computation
 *  - getCurrentFY: current financial year detection
 *  - matchGains: two-phase matching engine (same-day intraday netting + delivery FIFO)
 *  - computeEstimatedTax: tax computation with rates and exemption
 *
 * Runner: Jest
 * Library: fast-check (property-based testing)
 */
'use strict';

const fc = require('fast-check');
const {
  GAIN_TYPES,
  getFYDateRange,
  getCurrentFY,
  matchGains,
  computeEstimatedTax,
} = require('./tax.service');

// All tests use matchGains directly — no backward-compat alias imported.
const match = matchGains;

// ── getFYDateRange ────────────────────────────────────────────────────────────

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

// ── getCurrentFY ──────────────────────────────────────────────────────────────

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

// ── matchGains ────────────────────────────────────────────────────────────────
// Two-phase engine:
//   Phase 1 — same-day intraday netting (INTRADAY, speculative income §43(5))
//   Phase 2 — delivery FIFO on remaining quantities (STCG / LTCG)

describe('matchGains', () => {
  // ── Basic edge cases ───────────────────────────────────────────────────────

  it('returns empty array when no sell transactions', () => {
    const buyLots = [
      { executedAt: new Date('2024-01-01'), quantity: 10, pricePerUnit: 100, remainingQty: 10 },
    ];
    expect(match(buyLots, [])).toEqual([]);
  });

  it('returns empty array when no buy lots', () => {
    const sellTxns = [{ executedAt: new Date('2024-06-01'), quantity: 5, pricePerUnit: 120 }];
    expect(match([], sellTxns)).toEqual([]);
  });

  // ── Phase 2: Delivery FIFO (no same-day buys) ─────────────────────────────

  it('delivery: matches single sell against single buy lot (full consumption)', () => {
    const buyLots = [
      { executedAt: new Date('2024-01-01'), quantity: 10, pricePerUnit: 100, remainingQty: 10 },
    ];
    const gains = match(buyLots, [
      { executedAt: new Date('2024-06-01'), quantity: 10, pricePerUnit: 150 },
    ]);
    expect(gains).toHaveLength(1);
    expect(gains[0].quantity).toBe(10);
    expect(gains[0].gain).toBe(500); // (150-100)*10
    expect(gains[0].gainType).toBe(GAIN_TYPES.STCG);
  });

  it('delivery: splits sell across multiple buy lots in FIFO order', () => {
    const buyLots = [
      { executedAt: new Date('2024-01-01'), quantity: 5, pricePerUnit: 100, remainingQty: 5 },
      { executedAt: new Date('2024-02-01'), quantity: 10, pricePerUnit: 110, remainingQty: 10 },
    ];
    const gains = match(buyLots, [
      { executedAt: new Date('2024-07-01'), quantity: 8, pricePerUnit: 130 },
    ]);
    expect(gains).toHaveLength(2);
    expect(gains[0].quantity).toBe(5);
    expect(gains[0].gain).toBe(150); // (130-100)*5
    expect(gains[1].quantity).toBe(3);
    expect(gains[1].gain).toBe(60); // (130-110)*3
  });

  it('delivery: partially consumes buy lot and leaves remainder', () => {
    const buyLots = [
      { executedAt: new Date('2024-01-01'), quantity: 10, pricePerUnit: 100, remainingQty: 10 },
    ];
    match(buyLots, [{ executedAt: new Date('2024-06-01'), quantity: 3, pricePerUnit: 120 }]);
    expect(buyLots[0].remainingQty).toBe(7);
  });

  it('delivery: classifies as LTCG when holding period >= 365 days', () => {
    const buyLots = [
      { executedAt: new Date('2023-01-01'), quantity: 10, pricePerUnit: 100, remainingQty: 10 },
    ];
    const gains = match(buyLots, [
      { executedAt: new Date('2024-01-01'), quantity: 10, pricePerUnit: 150 },
    ]);
    expect(gains[0].gainType).toBe(GAIN_TYPES.LTCG);
    expect(gains[0].holdingDays).toBeGreaterThanOrEqual(365);
  });

  it('delivery: classifies as STCG when holding period is 1–364 days', () => {
    const buyLots = [
      { executedAt: new Date('2024-01-01'), quantity: 10, pricePerUnit: 100, remainingQty: 10 },
    ];
    const gains = match(buyLots, [
      { executedAt: new Date('2024-06-01'), quantity: 10, pricePerUnit: 150 },
    ]);
    expect(gains[0].gainType).toBe(GAIN_TYPES.STCG);
    expect(gains[0].holdingDays).toBeGreaterThan(0);
    expect(gains[0].holdingDays).toBeLessThan(365);
  });

  it('delivery: computes negative gain (loss) correctly', () => {
    const buyLots = [
      { executedAt: new Date('2024-01-01'), quantity: 10, pricePerUnit: 200, remainingQty: 10 },
    ];
    const gains = match(buyLots, [
      { executedAt: new Date('2024-06-01'), quantity: 10, pricePerUnit: 150 },
    ]);
    expect(gains[0].gain).toBe(-500); // (150-200)*10
  });

  it('delivery: multiple sells consume lots in FIFO order', () => {
    const buyLots = [
      { executedAt: new Date('2024-01-01'), quantity: 5, pricePerUnit: 100, remainingQty: 5 },
      { executedAt: new Date('2024-02-01'), quantity: 5, pricePerUnit: 110, remainingQty: 5 },
      { executedAt: new Date('2024-03-01'), quantity: 5, pricePerUnit: 120, remainingQty: 5 },
    ];
    const gains = match(buyLots, [
      { executedAt: new Date('2024-07-01'), quantity: 7, pricePerUnit: 130 },
      { executedAt: new Date('2024-08-01'), quantity: 4, pricePerUnit: 140 },
    ]);
    expect(gains.reduce((s, g) => s + g.quantity, 0)).toBe(11);
  });

  // ── Phase 1: Same-day intraday netting ────────────────────────────────────

  it('INTRADAY: same-day buy+sell with no prior holdings is fully intraday', () => {
    const buyLots = [
      {
        executedAt: new Date('2024-06-15T04:00:00.000Z'),
        quantity: 10,
        pricePerUnit: 100,
        remainingQty: 10,
      },
    ];
    const gains = match(buyLots, [
      { executedAt: new Date('2024-06-15T09:45:00.000Z'), quantity: 10, pricePerUnit: 120 },
    ]);
    expect(gains).toHaveLength(1);
    expect(gains[0].gainType).toBe(GAIN_TYPES.INTRADAY);
    expect(gains[0].holdingDays).toBe(0);
    expect(gains[0].gain).toBe(200); // (120-100)*10
  });

  it('INTRADAY: same-day loss is computed correctly', () => {
    const buyLots = [
      {
        executedAt: new Date('2024-06-15T04:00:00.000Z'),
        quantity: 10,
        pricePerUnit: 500,
        remainingQty: 10,
      },
    ];
    const gains = match(buyLots, [
      { executedAt: new Date('2024-06-15T09:00:00.000Z'), quantity: 10, pricePerUnit: 480 },
    ]);
    expect(gains[0].gainType).toBe(GAIN_TYPES.INTRADAY);
    expect(gains[0].gain).toBe(-200); // (480-500)*10
  });

  it('INTRADAY: spec example — same-day buy does NOT consume prior delivery holdings', () => {
    // 02 Jul BUY 4 | 11 Jul BUY 1 | 11 Jul SELL 2 | 11 Jul SELL 1
    // Expected: INTRADAY 1 unit (11-Jul BUY ↔ 11-Jul SELL 1)
    //           STCG 2 units     (02-Jul BUY ↔ 11-Jul SELL 2)
    //           Remaining: 2 units from 02-Jul lot
    const buyLots = [
      {
        executedAt: new Date('2026-07-02T07:26:00.000Z'),
        quantity: 4,
        pricePerUnit: 7139.45,
        remainingQty: 4,
      },
      {
        executedAt: new Date('2026-07-11T09:37:00.000Z'),
        quantity: 1,
        pricePerUnit: 7960.79,
        remainingQty: 1,
      },
    ];
    const sellTxns = [
      { executedAt: new Date('2026-07-11T09:36:00.000Z'), quantity: 2, pricePerUnit: 7992.06 },
      { executedAt: new Date('2026-07-11T09:38:00.000Z'), quantity: 1, pricePerUnit: 8013.54 },
    ];

    const gains = match(buyLots, sellTxns);
    const intraday = gains.filter((g) => g.gainType === GAIN_TYPES.INTRADAY);
    const delivery = gains.filter((g) => g.gainType !== GAIN_TYPES.INTRADAY);

    expect(intraday).toHaveLength(1);
    expect(intraday[0].quantity).toBe(1);
    expect(intraday[0].buyPrice).toBe(7960.79);

    expect(delivery.reduce((s, g) => s + g.quantity, 0)).toBe(2);
    delivery.forEach((g) => {
      expect(g.gainType).toBe(GAIN_TYPES.STCG);
      expect(g.buyPrice).toBe(7139.45);
    });

    expect(buyLots[0].remainingQty).toBe(2);
    expect(buyLots[1].remainingQty).toBe(0);
  });

  it('INTRADAY: partial cover — remaining sell qty flows to delivery FIFO', () => {
    // 02-Jul BUY 4, 11-Jul BUY 1, 11-Jul SELL 3
    // Phase 1: 1 intraday (all same-day buy consumed)
    // Phase 2: 2 STCG from 02-Jul lot
    const buyLots = [
      {
        executedAt: new Date('2024-07-02T05:00:00.000Z'),
        quantity: 4,
        pricePerUnit: 100,
        remainingQty: 4,
      },
      {
        executedAt: new Date('2024-07-11T05:00:00.000Z'),
        quantity: 1,
        pricePerUnit: 110,
        remainingQty: 1,
      },
    ];
    const gains = match(buyLots, [
      { executedAt: new Date('2024-07-11T08:00:00.000Z'), quantity: 3, pricePerUnit: 120 },
    ]);

    const intraday = gains.filter((g) => g.gainType === GAIN_TYPES.INTRADAY);
    const delivery = gains.filter((g) => g.gainType !== GAIN_TYPES.INTRADAY);

    expect(intraday[0].quantity).toBe(1);
    expect(intraday[0].buyPrice).toBe(110);
    expect(delivery[0].quantity).toBe(2);
    expect(delivery[0].gainType).toBe(GAIN_TYPES.STCG);
    expect(delivery[0].buyPrice).toBe(100);
  });

  it('INTRADAY: sell exceeds same-day buy — same-day buy qty is intraday, rest is delivery', () => {
    // 01-Jan BUY 10, 15-Jun BUY 3, 15-Jun SELL 8
    // Phase 1: 3 intraday (same-day buy exhausted)
    // Phase 2: 5 STCG from 01-Jan lot
    const buyLots = [
      {
        executedAt: new Date('2024-01-01T05:00:00.000Z'),
        quantity: 10,
        pricePerUnit: 80,
        remainingQty: 10,
      },
      {
        executedAt: new Date('2024-06-15T04:00:00.000Z'),
        quantity: 3,
        pricePerUnit: 100,
        remainingQty: 3,
      },
    ];
    const gains = match(buyLots, [
      { executedAt: new Date('2024-06-15T09:00:00.000Z'), quantity: 8, pricePerUnit: 110 },
    ]);

    const intraday = gains.filter((g) => g.gainType === GAIN_TYPES.INTRADAY);
    const delivery = gains.filter((g) => g.gainType !== GAIN_TYPES.INTRADAY);

    expect(intraday[0].quantity).toBe(3);
    expect(intraday[0].buyPrice).toBe(100);
    expect(delivery[0].quantity).toBe(5);
    expect(delivery[0].gainType).toBe(GAIN_TYPES.STCG);
    expect(delivery[0].buyPrice).toBe(80);
  });

  it('next-day sell is NOT intraday even when delivery holdingDays rounds to 0', () => {
    // Buy late evening, sell just after midnight next day
    const buyLots = [
      {
        executedAt: new Date('2024-06-15T18:25:00.000Z'),
        quantity: 10,
        pricePerUnit: 100,
        remainingQty: 10,
      },
    ];
    const gains = match(buyLots, [
      { executedAt: new Date('2024-06-16T00:05:00.000Z'), quantity: 10, pricePerUnit: 110 },
    ]);
    expect(gains[0].gainType).toBe(GAIN_TYPES.STCG);
  });

  // ── Properties ────────────────────────────────────────────────────────────

  it('PROPERTY: total matched qty == total sell qty when buy supply is sufficient', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 50 }),
        fc.nat({ max: 500 }),
        fc.nat({ max: 500 }),
        (buyQty, sellQty, buyPrice, sellPrice) => {
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
          const gains = match(buyLots, sellTxns);
          expect(gains.reduce((s, g) => s + g.quantity, 0)).toBe(sellQty);
        }
      )
    );
  });

  it('PROPERTY: gain formula is (sellPrice - buyPrice) * quantity per record', () => {
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
          const gains = match(buyLots, [
            { executedAt: new Date('2024-06-01'), quantity: qty, pricePerUnit: sellPrice },
          ]);
          expect(gains[0].gain).toBe((sellPrice - buyPrice) * qty);
        }
      )
    );
  });

  it('PROPERTY: same-day only buy+sell always yields exclusively INTRADAY records', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 0, max: 22 }),
        (qty, buyPrice, sellPrice, buyHour) => {
          const date = '2024-06-15';
          const sellHour = buyHour + 1; // sell always after buy, still same day
          const buyLots = [
            {
              executedAt: new Date(`${date}T${String(buyHour).padStart(2, '0')}:00:00.000Z`),
              quantity: qty,
              pricePerUnit: buyPrice,
              remainingQty: qty,
            },
          ];
          const gains = match(buyLots, [
            {
              executedAt: new Date(`${date}T${String(sellHour).padStart(2, '0')}:00:00.000Z`),
              quantity: qty,
              pricePerUnit: sellPrice,
            },
          ]);
          expect(gains.every((g) => g.gainType === GAIN_TYPES.INTRADAY)).toBe(true);
        }
      )
    );
  });
});

// ── computeEstimatedTax ───────────────────────────────────────────────────────

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

  it('applies ₹1,25,000 exemption on LTCG — no tax below threshold', () => {
    const result = computeEstimatedTax(0, 100000);
    expect(result.ltcgTax).toBe(0);
    expect(result.estimatedTax).toBe(0);
  });

  it('applies ₹1,25,000 exemption — tax only on the excess', () => {
    const result = computeEstimatedTax(0, 225000);
    // (225000 - 125000) * 0.125 = 12500
    expect(result.ltcgTax).toBe(12500);
    expect(result.estimatedTax).toBe(12500);
  });

  it('computes combined STCG + LTCG tax correctly', () => {
    const result = computeEstimatedTax(50000, 200000);
    // STCG: 50000 * 0.20 = 10000
    // LTCG: (200000 - 125000) * 0.125 = 9375
    expect(result.stcgTax).toBe(10000);
    expect(result.ltcgTax).toBe(9375);
    expect(result.estimatedTax).toBe(19375);
  });

  it('zero STCG produces zero stcgTax', () => {
    expect(computeEstimatedTax(0, 200000).stcgTax).toBe(0);
  });

  it('LTCG exactly at exemption limit produces zero ltcgTax', () => {
    expect(computeEstimatedTax(0, 125000).ltcgTax).toBe(0);
  });

  it('PROPERTY: estimated tax is never negative', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e6, max: 1e6 }),
        fc.double({ min: -1e6, max: 1e6 }),
        (stcg, ltcg) => {
          fc.pre(isFinite(stcg) && isFinite(ltcg));
          const { estimatedTax } = computeEstimatedTax(stcg, ltcg);
          expect(estimatedTax).toBeGreaterThanOrEqual(0);
        }
      )
    );
  });

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
          expect(tax2).toBeGreaterThanOrEqual(tax1 - 0.001);
        }
      )
    );
  });
});
