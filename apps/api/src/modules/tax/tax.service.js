/**
 * Tax Service
 * Core business logic for Indian capital gains computation and tax-loss harvesting.
 *
 * This module is READ-ONLY — it performs no writes to any MongoDB collection.
 * All calculations are derived on-demand from raw Transaction documents using
 * a two-step matching algorithm:
 *   Step 1 — symmetric same-day intraday netting:
 *              For any day that has BOTH buys AND sells for the same asset,
 *              min(totalBuyQty, totalSellQty) is matched as INTRADAY using
 *              FIFO within each side (earliest buy price vs earliest sell price).
 *              This is symmetric — sell-first (sell delivery in morning, buy
 *              back later same day) is handled identically to buy-first.
 *   Step 2 — delivery FIFO on remaining unmatched sell quantities.
 *
 * Tax Rules Applied:
 *  - INTRADAY (Speculative Business Income): same-calendar-day buy + sell →
 *      taxed at the user's income slab rate (5%–30%) under Section 43(5).
 *      The backend computes totalIntraday; the client applies the slab rate
 *      because the user's slab is a client-side preference, not server state.
 *  - STCG (Short-Term Capital Gains): holding period 1–364 days → 20% rate
 *  - LTCG (Long-Term Capital Gains): holding period >= 365 days → 12.5% above ₹1,25,000 exemption
 *
 * Intraday losses can only be set off against other speculative (intraday)
 * gains — they CANNOT offset STCG or LTCG.
 *
 * Currency: all monetary values are in ₹ (Indian Rupees).
 */
'use strict';

const mongoose = require('mongoose');
const Transaction = require('../transaction/transaction.model');
const Asset = require('../asset/asset.model');
const portfolioService = require('../portfolio/portfolio.service');
const { TRANSACTION_TYPES } = require('../../shared/constants');

// ── Tax Constants ────────────────────────────────────────────────────────────
const STCG_RATE = 0.2;
const LTCG_RATE = 0.125;
const LTCG_EXEMPTION = 125000;
const HOLDING_PERIOD_THRESHOLD = 365; // days

// Gain type identifiers
const GAIN_TYPES = Object.freeze({
  INTRADAY: 'INTRADAY', // same-calendar-day buy + sell (speculative business income)
  STCG: 'STCG', // held 1–364 days (short-term capital gain)
  LTCG: 'LTCG', // held 365+ days (long-term capital gain)
});

// ── Utility Helpers ──────────────────────────────────────────────────────────

/**
 * daysBetween(dateA, dateB)
 *
 * Computes the number of full days between two dates.
 *
 * @param {Date} dateA - Start date
 * @param {Date} dateB - End date
 * @returns {number} Number of days (always positive)
 */
const daysBetween = (dateA, dateB) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = Math.abs(new Date(dateB).getTime() - new Date(dateA).getTime());
  return Math.floor(diffMs / msPerDay);
};

// ── FY Scoping Functions ─────────────────────────────────────────────────────

/**
 * getFYDateRange(taxYear)
 *
 * Computes the Indian Financial Year date range for a given start year.
 * FY 2025 → April 1, 2025 to March 31, 2026 (23:59:59.999).
 *
 * @param {number} taxYear - FY start year (e.g., 2025)
 * @returns {{ start: Date, end: Date }}
 */
const getFYDateRange = (taxYear) => {
  const start = new Date(`${taxYear}-04-01T00:00:00.000Z`);
  const end = new Date(`${taxYear + 1}-03-31T23:59:59.999Z`);
  return { start, end };
};

/**
 * getCurrentFY()
 *
 * Returns the Indian FY start year based on today's date.
 * January–March belongs to the previous FY (e.g., Feb 2026 → FY 2025).
 * April–December belongs to the current year's FY.
 *
 * @returns {number} FY start year
 */
const getCurrentFY = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed: 0=Jan, 1=Feb, 2=Mar, 3=Apr
  const year = now.getFullYear();
  return month < 3 ? year - 1 : year;
};

// ── Matching Engine ──────────────────────────────────────────────────────────

/**
 * toDateKey(date)
 *
 * Returns the UTC calendar date string (YYYY-MM-DD) for a given date.
 * Used as a grouping key for same-day netting.
 *
 * @param {Date|string} date
 * @returns {string} e.g. "2026-07-11"
 */
const toDateKey = (date) => new Date(date).toISOString().slice(0, 10);

/**
 * matchGains(buyLots, sellTxns)
 *
 * Two-phase matching engine for a single asset.
 *
 * ── Step 1: Symmetric same-day netting (INTRADAY) ───────────────────────────
 * For each calendar day that has BOTH buys AND sells:
 *   - intradayQty = min(totalBuyQtyOnDay, totalSellQtyOnDay)
 *   - Match those quantities using FIFO within each side independently:
 *       buy FIFO  → earliest buy transactions first (by executedAt)
 *       sell FIFO → earliest sell transactions first (by executedAt)
 *   - Each intraday gain record: gain = (sellPrice_FIFO - buyPrice_FIFO) × matched
 *   - This is SYMMETRIC — sell-delivery-in-morning then buy-back-in-afternoon
 *     is treated identically to buy-first-then-sell.
 *   - Consumed quantities are removed from their respective pools before Step 2.
 *
 * ── Step 2: Delivery FIFO (STCG / LTCG) ─────────────────────────────────────
 * Remaining unmatched SELL quantities are matched against surviving BUY lots
 * in strict chronological (FIFO) order.
 * Holding period measured from the FIFO lot's executedAt date.
 * Classification: holdingDays >= 365 → LTCG, else → STCG.
 *
 * @param {Array<{ executedAt: Date, quantity: number, pricePerUnit: number, remainingQty: number }>} buyLots
 *   All BUY transactions for this asset, sorted executedAt ASC, each with a
 *   mutable `remainingQty` field initialised to `quantity`.
 * @param {Array<{ executedAt: Date, quantity: number, pricePerUnit: number }>} sellTxns
 *   All SELL transactions for this asset, sorted executedAt ASC.
 * @returns {Array<{ buyDate: Date, sellDate: Date, quantity: number, buyPrice: number,
 *   sellPrice: number, gain: number, gainType: string, holdingDays: number }>}
 */
const matchGains = (buyLots, sellTxns) => {
  const gains = [];

  // ── Step 1: Symmetric same-day netting ──────────────────────────────────

  // Group buys and sells by calendar day key
  const buysByDay = {};
  for (const lot of buyLots) {
    const key = toDateKey(lot.executedAt);
    if (!buysByDay[key]) buysByDay[key] = [];
    buysByDay[key].push(lot);
  }

  const sellsByDay = {};
  for (const sell of sellTxns) {
    const key = toDateKey(sell.executedAt);
    if (!sellsByDay[key]) sellsByDay[key] = [];
    sellsByDay[key].push(sell);
  }

  // For each day that has both buys and sells, net symmetrically
  const allDays = new Set([...Object.keys(buysByDay), ...Object.keys(sellsByDay)]);

  for (const day of allDays) {
    const dayBuys = buysByDay[day];
    const daySells = sellsByDay[day];
    if (!dayBuys || !daySells) continue; // need both sides

    // Total available on each side (only unmatched remaining qty)
    const totalBuyAvail = dayBuys.reduce((s, l) => s + l.remainingQty, 0);
    const totalSellAvail = daySells.reduce((s, s2) => s + s2.quantity, 0);

    // intradayQty = min of both sides — symmetric netting
    let intradayRemaining = Math.min(totalBuyAvail, totalSellAvail);
    if (intradayRemaining <= 0) continue;

    // Walk buy FIFO and sell FIFO simultaneously, matching intradayRemaining
    let bIdx = 0;
    let sIdx = 0;
    let buyAvailInSlot = dayBuys[0]?.remainingQty ?? 0;
    let sellAvailInSlot = daySells[0]?.quantity ?? 0;

    // Track consumed sell quantities so Phase 2 knows what's left
    const sellConsumed = new Array(daySells.length).fill(0);

    while (intradayRemaining > 0 && bIdx < dayBuys.length && sIdx < daySells.length) {
      const matched = Math.min(buyAvailInSlot, sellAvailInSlot, intradayRemaining);
      if (matched <= 0) break;

      const buyLot = dayBuys[bIdx];
      const sellTx = daySells[sIdx];
      const gain = (sellTx.pricePerUnit - buyLot.pricePerUnit) * matched;

      gains.push({
        buyDate: buyLot.executedAt,
        sellDate: sellTx.executedAt,
        quantity: matched,
        buyPrice: buyLot.pricePerUnit,
        sellPrice: sellTx.pricePerUnit,
        gain,
        gainType: GAIN_TYPES.INTRADAY,
        holdingDays: 0,
      });

      buyLot.remainingQty -= matched;
      buyAvailInSlot -= matched;
      sellAvailInSlot -= matched;
      sellConsumed[sIdx] += matched;
      intradayRemaining -= matched;

      if (buyAvailInSlot <= 0) {
        bIdx++;
        buyAvailInSlot = dayBuys[bIdx]?.remainingQty ?? 0;
      }
      if (sellAvailInSlot <= 0) {
        sIdx++;
        sellAvailInSlot = (daySells[sIdx]?.quantity ?? 0) - (sellConsumed[sIdx] ?? 0);
      }
    }

    // Mark remaining (unmatched) sell quantity for Phase 2 delivery
    for (let i = 0; i < daySells.length; i++) {
      daySells[i].deliveryQty = daySells[i].quantity - sellConsumed[i];
    }
  }

  // Mark sells on days with no same-day buys as fully delivery
  for (const [day, daySells] of Object.entries(sellsByDay)) {
    if (!buysByDay[day]) {
      for (const sell of daySells) {
        sell.deliveryQty = sell.quantity;
      }
    }
  }

  // ── Step 2: Delivery FIFO ────────────────────────────────────────────────

  const deliverySells = sellTxns
    .map((sell) => ({ ...sell, qty: sell.deliveryQty ?? sell.quantity }))
    .filter((sell) => sell.qty > 0)
    .sort((a, b) => new Date(a.executedAt) - new Date(b.executedAt));

  let buyIdx = 0;

  for (const sell of deliverySells) {
    let sellRemaining = sell.qty;

    while (sellRemaining > 0 && buyIdx < buyLots.length) {
      const lot = buyLots[buyIdx];

      if (lot.remainingQty <= 0) {
        buyIdx++;
        continue;
      }

      const matched = Math.min(lot.remainingQty, sellRemaining);
      const holdingDays = daysBetween(lot.executedAt, sell.executedAt);
      const gainType = holdingDays >= HOLDING_PERIOD_THRESHOLD ? GAIN_TYPES.LTCG : GAIN_TYPES.STCG;
      const gain = (sell.pricePerUnit - lot.pricePerUnit) * matched;

      gains.push({
        buyDate: lot.executedAt,
        sellDate: sell.executedAt,
        quantity: matched,
        buyPrice: lot.pricePerUnit,
        sellPrice: sell.pricePerUnit,
        gain,
        gainType,
        holdingDays,
      });

      lot.remainingQty -= matched;
      sellRemaining -= matched;

      if (lot.remainingQty <= 0) buyIdx++;
    }
  }

  return gains;
};

// ── Tax Computation ──────────────────────────────────────────────────────────

/**
 * computeEstimatedTax(totalSTCG, totalLTCG)
 *
 * Applies Indian capital gains tax rates to realized STCG and LTCG.
 *
 * NOTE: Intraday (speculative business income) tax is intentionally NOT
 * computed here — it depends on the user's personal income slab rate, which
 * is a client-side preference. The backend sends `totalIntraday` and the
 * frontend multiplies by the user's chosen slab rate.
 *
 * Rules:
 *  - STCG: 20% flat on positive short-term gains
 *  - LTCG: 12.5% on amount exceeding ₹1,25,000 exemption
 *  - Negative gains (losses) produce zero tax for that category
 *
 * @param {number} totalSTCG - Net short-term capital gains (can be negative)
 * @param {number} totalLTCG - Net long-term capital gains (can be negative)
 * @returns {{ stcgTax: number, ltcgTax: number, estimatedTax: number }}
 */
const computeEstimatedTax = (totalSTCG, totalLTCG) => {
  const stcgTax = totalSTCG > 0 ? totalSTCG * STCG_RATE : 0;
  const ltcgTax = totalLTCG > LTCG_EXEMPTION ? (totalLTCG - LTCG_EXEMPTION) * LTCG_RATE : 0;
  const estimatedTax = stcgTax + ltcgTax;

  return { stcgTax, ltcgTax, estimatedTax };
};

// ── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * computeAllGains(userId, taxYear)
 *
 * Internal helper that computes the full (unpaginated) FIFO gains for a user
 * within a specified tax year. Used by both getGainsLedger and getTaxSummary.
 *
 * Gain records may have gainType of 'INTRADAY', 'STCG', or 'LTCG'.
 *
 * @param {string} userId - MongoDB ObjectId string
 * @param {number} taxYear - Indian FY start year
 * @returns {Promise<Array>} All gain records enriched with asset metadata
 */
const computeAllGains = async (userId, taxYear) => {
  const { start, end } = getFYDateRange(taxYear);

  // Step 1: Query all SELL transactions for user within FY date range
  const sellTxns = await Transaction.find({
    userId: new mongoose.Types.ObjectId(userId),
    transactionType: TRANSACTION_TYPES.SELL,
    executedAt: { $gte: start, $lte: end },
  })
    .sort({ executedAt: 1 })
    .lean();

  if (sellTxns.length === 0) {
    return [];
  }

  // Step 2: Group sells by assetId
  const sellsByAsset = {};
  for (const sell of sellTxns) {
    const key = sell.assetId.toString();
    if (!sellsByAsset[key]) {
      sellsByAsset[key] = [];
    }
    sellsByAsset[key].push(sell);
  }

  // Step 3: For each asset, fetch BUY lots and run FIFO matching
  const allGains = [];
  const assetIds = Object.keys(sellsByAsset);

  // Batch fetch asset metadata
  const assets = await Asset.find({
    _id: { $in: assetIds.map((id) => new mongoose.Types.ObjectId(id)) },
  }).lean();

  const assetMap = {};
  for (const asset of assets) {
    assetMap[asset._id.toString()] = asset;
  }

  for (const assetId of assetIds) {
    const assetSells = sellsByAsset[assetId];

    // Find the latest sell date to scope BUY lot query
    const latestSellDate = assetSells[assetSells.length - 1].executedAt;

    // Fetch all BUY transactions for this asset before/on the latest sell date
    const buyLots = await Transaction.find({
      userId: new mongoose.Types.ObjectId(userId),
      assetId: new mongoose.Types.ObjectId(assetId),
      transactionType: TRANSACTION_TYPES.BUY,
      executedAt: { $lte: latestSellDate },
    })
      .sort({ executedAt: 1 })
      .lean();

    // Add remainingQty field to each BUY lot for FIFO tracking
    const lotsWithRemaining = buyLots.map((lot) => ({
      ...lot,
      remainingQty: lot.quantity,
    }));

    // Run two-step matching (same-day intraday netting first, then delivery FIFO)
    const gains = matchGains(lotsWithRemaining, assetSells);

    // Enrich each gain record with asset metadata
    const asset = assetMap[assetId];
    for (const gain of gains) {
      allGains.push({
        assetId,
        ticker: asset?.ticker || 'UNKNOWN',
        name: asset?.name || 'Unknown Asset',
        assetType: asset?.assetType || 'STOCK',
        ...gain,
      });
    }
  }

  return allGains;
};

/**
 * getOldestUnmatchedBuyLot(userId, assetId)
 *
 * Finds the oldest BUY lot that still has unconsumed quantity for a given asset.
 * Used by the harvesting engine to determine holding period classification.
 *
 * Logic: replay all SELL transactions against BUY lots using FIFO to find
 * the first lot with remaining quantity.
 *
 * @param {string} userId - MongoDB ObjectId string
 * @param {string|object} assetId - Asset's MongoDB ObjectId
 * @returns {Promise<object|null>} Oldest unmatched BUY lot or null
 */
const getOldestUnmatchedBuyLot = async (userId, assetId) => {
  // Fetch all BUY lots for this asset
  const buyLots = await Transaction.find({
    userId: new mongoose.Types.ObjectId(userId),
    assetId: new mongoose.Types.ObjectId(assetId.toString()),
    transactionType: TRANSACTION_TYPES.BUY,
  })
    .sort({ executedAt: 1 })
    .lean();

  if (buyLots.length === 0) return null;

  // Fetch all SELL transactions for this asset (to replay FIFO consumption)
  const sellTxns = await Transaction.find({
    userId: new mongoose.Types.ObjectId(userId),
    assetId: new mongoose.Types.ObjectId(assetId.toString()),
    transactionType: TRANSACTION_TYPES.SELL,
  })
    .sort({ executedAt: 1 })
    .lean();

  // Add remainingQty to BUY lots
  const lotsWithRemaining = buyLots.map((lot) => ({
    ...lot,
    remainingQty: lot.quantity,
  }));

  // Replay the two-phase matching to consume lots against all historical sells
  matchGains(lotsWithRemaining, sellTxns);

  // Find the first lot with remaining quantity
  const oldestUnmatched = lotsWithRemaining.find((lot) => lot.remainingQty > 0);
  return oldestUnmatched || null;
};

// ── Public Service Functions ─────────────────────────────────────────────────

/**
 * getGainsLedger(userId, { taxYear, page, limit })
 *
 * Returns paginated realized gain records for a user within the specified
 * Indian Financial Year, enriched with asset metadata and a summary.
 *
 * Flow:
 *  1. Query SELL transactions within FY date range
 *  2. For each sold asset, query all BUY transactions (executedAt <= sell date)
 *  3. Run two-step matching per asset (same-day intraday netting → delivery FIFO)
 *  4. Enrich gain records with asset metadata (ticker, name, assetType)
 *  5. Paginate the final gains array
 *  6. Compute summary: totalSTCG, totalLTCG, totalIntraday, netRealizedGain
 *
 * @param {string} userId - MongoDB ObjectId string
 * @param {object} options
 * @param {number} [options.taxYear] - Indian FY start year (default: current FY)
 * @param {number} [options.page=1] - Page number for pagination
 * @param {number} [options.limit=20] - Records per page
 * @returns {Promise<{ gains: Array, summary: object, pagination: object }>}
 */
const getGainsLedger = async (userId, { taxYear, page = 1, limit = 20 } = {}) => {
  const effectiveTaxYear = taxYear || getCurrentFY();
  const allGains = await computeAllGains(userId, effectiveTaxYear);

  // Compute summary from all gains (before pagination)
  let totalSTCG = 0;
  let totalLTCG = 0;
  let totalIntraday = 0;

  for (const record of allGains) {
    if (record.gainType === GAIN_TYPES.STCG) {
      totalSTCG += record.gain;
    } else if (record.gainType === GAIN_TYPES.LTCG) {
      totalLTCG += record.gain;
    } else if (record.gainType === GAIN_TYPES.INTRADAY) {
      totalIntraday += record.gain;
    }
  }

  const netRealizedGain = totalSTCG + totalLTCG + totalIntraday;

  // Paginate
  const total = allGains.length;
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;
  const gains = allGains.slice(skip, skip + limit);

  return {
    gains,
    summary: {
      totalSTCG,
      totalLTCG,
      totalIntraday,
      netRealizedGain,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * getTaxSummary(userId, { taxYear })
 *
 * Computes a full tax year summary including realized gains totals,
 * estimated tax liability, and the number of harvesting opportunities.
 *
 * @param {string} userId - MongoDB ObjectId string
 * @param {object} options
 * @param {number} [options.taxYear] - Indian FY start year (default: current FY)
 * @returns {Promise<object>} TaxSummary object
 */
const getTaxSummary = async (userId, { taxYear } = {}) => {
  const effectiveTaxYear = taxYear || getCurrentFY();
  const allGains = await computeAllGains(userId, effectiveTaxYear);

  // Aggregate totals
  let totalSTCG = 0;
  let totalLTCG = 0;
  let totalIntraday = 0;

  for (const record of allGains) {
    if (record.gainType === GAIN_TYPES.STCG) {
      totalSTCG += record.gain;
    } else if (record.gainType === GAIN_TYPES.LTCG) {
      totalLTCG += record.gain;
    } else if (record.gainType === GAIN_TYPES.INTRADAY) {
      totalIntraday += record.gain;
    }
  }

  const netRealizedGain = totalSTCG + totalLTCG + totalIntraday;

  // Compute estimated tax
  const { stcgTax, ltcgTax, estimatedTax } = computeEstimatedTax(totalSTCG, totalLTCG);

  // Count all harvesting opportunities (delivery + intraday, using default minLoss = 0)
  let harvestingCount = 0;
  try {
    const { opportunities, intradayOpportunities } = await getHarvestingOpportunities(userId, {
      taxYear: effectiveTaxYear,
      minLoss: 0,
    });
    harvestingCount = opportunities.length + (intradayOpportunities?.length ?? 0);
  } catch {
    // If harvesting computation fails, default to 0
    harvestingCount = 0;
  }

  return {
    totalSTCG,
    totalLTCG,
    totalIntraday,
    netRealizedGain,
    stcgTax,
    ltcgTax,
    // intradayTax is computed client-side using the user's chosen slab rate
    estimatedTax,
    harvestingCount,
    taxYear: effectiveTaxYear,
  };
};

/**
 * getHarvestingOpportunities(userId, { taxYear, minLoss })
 *
 * Identifies:
 *  A) Delivery harvesting — current holdings with unrealized losses that could
 *     be sold to offset realized STCG/LTCG gains.
 *  B) Intraday harvesting — assets where TODAY's already-executed transactions
 *     create an open intraday position, and a hypothetical reverse trade at the
 *     current live price would produce an intraday loss under Section 43(5).
 *
 * ── Delivery harvesting (unchanged) ────────────────────────────────────────
 *  1. portfolioService.computeHoldings → live holdings
 *  2. Filter where unrealisedPnL < -minLoss
 *  3. Oldest unmatched BUY lot → holding period → STCG or LTCG
 *  4. estimatedSaving = |unrealizedLoss| × rate
 *
 * ── Intraday harvesting ─────────────────────────────────────────────────────
 *  For each asset that has transactions TODAY:
 *    - Net today's buys and sells: netQty = totalBuyQtyToday - totalSellQtyToday
 *    - If netQty > 0 (net long today): user bought more than sold today.
 *        Hypothetical reverse = sell at currentPrice.
 *        Walk today's BUY FIFO: for each unmatched buy lot today,
 *        if currentPrice < buyPrice → intraday loss = (buyPrice - currentPrice) × qty
 *    - If netQty < 0 (net short today, i.e. sold delivery and not yet bought back):
 *        Hypothetical reverse = buy at currentPrice.
 *        Walk today's SELL FIFO: for each unmatched sell today,
 *        if currentPrice > sellPrice → intraday loss = (currentPrice - sellPrice) × qty
 *    - Only surface if the hypothetical reverse produces a net loss (< 0)
 *    - estimatedSaving omitted — client applies slab rate
 *
 * @param {string} userId
 * @param {object} options
 * @param {number} [options.taxYear]
 * @param {number} [options.minLoss=0]
 * @returns {Promise<{ opportunities, intradayOpportunities, meta }>}
 */
const getHarvestingOpportunities = async (userId, { taxYear, minLoss = 0 } = {}) => {
  const effectiveTaxYear = taxYear || getCurrentFY();
  if (effectiveTaxYear !== getCurrentFY()) {
    return {
      opportunities: [],
      intradayOpportunities: [],
      meta: { minLoss, totalOpportunities: 0, intradayCount: 0, isCurrentFY: false },
    };
  }

  // ── A: Delivery harvesting ───────────────────────────────────────────────
  const holdings = await portfolioService.computeHoldings(userId);
  const losers = holdings.filter((h) => h.unrealisedPnL < -minLoss);

  // Build raw delivery opportunities first (before intraday deduction)
  const rawOpportunities = await Promise.all(
    losers.map(async (holding) => {
      const oldestBuy = await getOldestUnmatchedBuyLot(userId, holding.assetId);
      const holdingDays = oldestBuy ? daysBetween(oldestBuy.executedAt, new Date()) : 0;
      const lossType = holdingDays >= HOLDING_PERIOD_THRESHOLD ? 'LTCG' : 'STCG';
      const rate = lossType === 'STCG' ? STCG_RATE : LTCG_RATE;
      return {
        assetId: holding.assetId.toString(),
        ticker: holding.asset.ticker,
        name: holding.asset.name,
        assetType: holding.asset.assetType,
        sector: holding.asset.sector || null,
        currentPrice: holding.currentPrice,
        avgCostBasis: holding.avgCostBasis,
        // raw quantity from holdings (includes today's buys)
        quantity: holding.netQuantity,
        holdingDays,
        lossType,
        rate,
        offsetsGainType: lossType,
      };
    })
  );

  // ── B: Intraday harvesting ───────────────────────────────────────────────
  const { resolveAssetPrice } = require('../market/market.service');
  const todayKey = toDateKey(new Date());
  const todayStart = new Date(`${todayKey}T00:00:00.000Z`);
  const todayEnd = new Date(`${todayKey}T23:59:59.999Z`);

  const todayTxns = await Transaction.find({
    userId: new mongoose.Types.ObjectId(userId),
    executedAt: { $gte: todayStart, $lte: todayEnd },
  })
    .sort({ executedAt: 1 })
    .lean();

  const todayByAsset = {};
  for (const tx of todayTxns) {
    const key = tx.assetId.toString();
    if (!todayByAsset[key]) todayByAsset[key] = { buys: [], sells: [] };
    if (tx.transactionType === TRANSACTION_TYPES.BUY) {
      todayByAsset[key].buys.push(tx);
    } else {
      todayByAsset[key].sells.push(tx);
    }
  }

  const todayAssetIds = Object.keys(todayByAsset);
  const todayAssets = await Asset.find({
    _id: { $in: todayAssetIds.map((id) => new mongoose.Types.ObjectId(id)) },
  }).lean();
  const todayAssetMap = {};
  for (const a of todayAssets) todayAssetMap[a._id.toString()] = a;

  // Map of assetId → net unmatched buy qty today (SELL_TO_CLOSE intraday qty)
  // These units are "claimed" by intraday and must be excluded from delivery qty.
  const intradayClaimedQty = {};
  const intradayOpportunities = [];

  for (const [assetId, { buys, sells }] of Object.entries(todayByAsset)) {
    const asset = todayAssetMap[assetId];
    if (!asset) continue;

    const totalBuyQty = buys.reduce((s, t) => s + t.quantity, 0);
    const totalSellQty = sells.reduce((s, t) => s + t.quantity, 0);
    const alreadyMatchedQty = Math.min(totalBuyQty, totalSellQty);
    const netBuyQty = totalBuyQty - alreadyMatchedQty;
    const netSellQty = totalSellQty - alreadyMatchedQty;

    const currentPrice = await resolveAssetPrice(asset).catch(() => asset.basePrice);

    if (netBuyQty > 0) {
      // Net long today — hypothetical SELL at currentPrice to close
      let remainingToCheck = netBuyQty;
      let totalIntradayLoss = 0;
      let matchableQty = 0;

      for (const buy of buys) {
        if (remainingToCheck <= 0) break;
        const qty = Math.min(buy.quantity, remainingToCheck);
        const lossPer = buy.pricePerUnit - currentPrice;
        if (lossPer > 0) {
          totalIntradayLoss += lossPer * qty;
          matchableQty += qty;
        }
        remainingToCheck -= qty;
      }

      if (totalIntradayLoss > 0 && matchableQty > 0) {
        // Track how many units of this asset are claimed by intraday (SELL_TO_CLOSE)
        // so delivery harvesting can exclude them
        intradayClaimedQty[assetId] = (intradayClaimedQty[assetId] ?? 0) + matchableQty;

        intradayOpportunities.push({
          assetId,
          ticker: asset.ticker,
          name: asset.name,
          assetType: asset.assetType,
          sector: asset.sector || null,
          currentPrice,
          direction: 'SELL_TO_CLOSE',
          matchableQty,
          unrealizedIntradayLoss: totalIntradayLoss,
          lossType: 'INTRADAY',
        });
      }
    }

    if (netSellQty > 0) {
      // Net short today — hypothetical BUY at currentPrice to close
      let remainingToCheck = netSellQty;
      let totalIntradayLoss = 0;
      let matchableQty = 0;

      for (const sell of sells) {
        if (remainingToCheck <= 0) break;
        const qty = Math.min(sell.quantity, remainingToCheck);
        const lossPer = currentPrice - sell.pricePerUnit;
        if (lossPer > 0) {
          totalIntradayLoss += lossPer * qty;
          matchableQty += qty;
        }
        remainingToCheck -= qty;
      }

      if (totalIntradayLoss > 0 && matchableQty > 0) {
        intradayOpportunities.push({
          assetId,
          ticker: asset.ticker,
          name: asset.name,
          assetType: asset.assetType,
          sector: asset.sector || null,
          currentPrice,
          direction: 'BUY_TO_CLOSE',
          matchableQty,
          unrealizedIntradayLoss: totalIntradayLoss,
          lossType: 'INTRADAY',
        });
      }
    }
  }

  intradayOpportunities.sort((a, b) => b.unrealizedIntradayLoss - a.unrealizedIntradayLoss);

  // ── Deduct intraday-claimed qty from delivery opportunities ───────────────
  // Units bought today that are already surfaced as SELL_TO_CLOSE intraday
  // opportunities must not be double-counted in the delivery qty.
  // If delivery qty after deduction drops to 0, remove the opportunity entirely.
  const opportunities = rawOpportunities
    .map((opp) => {
      const claimed = intradayClaimedQty[opp.assetId] ?? 0;
      const deliveryQty = opp.quantity - claimed;
      if (deliveryQty <= 0) return null; // fully claimed by intraday — drop

      const unrealizedLoss = Math.abs((opp.avgCostBasis - opp.currentPrice) * deliveryQty);
      const estimatedSaving = unrealizedLoss * opp.rate;

      // Drop if net delivery loss is below minLoss threshold
      if (unrealizedLoss < minLoss) return null;

      return {
        assetId: opp.assetId,
        ticker: opp.ticker,
        name: opp.name,
        assetType: opp.assetType,
        sector: opp.sector,
        unrealizedLoss,
        currentPrice: opp.currentPrice,
        avgCostBasis: opp.avgCostBasis,
        quantity: deliveryQty,
        holdingDays: opp.holdingDays,
        lossType: opp.lossType,
        estimatedSaving,
        offsetsGainType: opp.offsetsGainType,
      };
    })
    .filter(Boolean);

  opportunities.sort((a, b) => b.estimatedSaving - a.estimatedSaving);

  return {
    opportunities,
    intradayOpportunities,
    meta: {
      minLoss,
      totalOpportunities: opportunities.length,
      intradayCount: intradayOpportunities.length,
      isCurrentFY: true,
    },
  };
};

module.exports = {
  GAIN_TYPES,
  getFYDateRange,
  getCurrentFY,
  matchGains,
  computeEstimatedTax,
  getGainsLedger,
  getTaxSummary,
  getHarvestingOpportunities,
};
