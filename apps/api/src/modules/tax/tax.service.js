/**
 * Tax Service
 * Core business logic for Indian capital gains computation and tax-loss harvesting.
 *
 * This module is READ-ONLY — it performs no writes to any MongoDB collection.
 * All calculations are derived on-demand from raw Transaction documents using
 * FIFO (First-In-First-Out) cost basis matching.
 *
 * Tax Rules Applied:
 *  - STCG (Short-Term Capital Gains): holding period < 365 days → 20% rate
 *  - LTCG (Long-Term Capital Gains): holding period >= 365 days → 12.5% above ₹1,25,000 exemption
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

// ── FIFO Engine ──────────────────────────────────────────────────────────────

/**
 * matchFIFO(buyLots, sellTxns)
 *
 * FIFO cost basis matching for a single asset. Consumes BUY lots in
 * chronological order against SELL transactions to produce per-lot
 * realized gain records.
 *
 * Both buyLots and sellTxns MUST be sorted by executedAt ascending.
 *
 * @param {Array<{ executedAt: Date, quantity: number, pricePerUnit: number, remainingQty: number }>} buyLots
 *   BUY transactions sorted by executedAt ASC with a mutable `remainingQty` field.
 * @param {Array<{ executedAt: Date, quantity: number, pricePerUnit: number }>} sellTxns
 *   SELL transactions sorted by executedAt ASC.
 * @returns {Array<{ buyDate: Date, sellDate: Date, quantity: number, buyPrice: number, sellPrice: number, gain: number, gainType: string, holdingDays: number }>}
 */
const matchFIFO = (buyLots, sellTxns) => {
  const gains = [];
  let buyIdx = 0;

  for (const sell of sellTxns) {
    let sellRemaining = sell.quantity;

    while (sellRemaining > 0 && buyIdx < buyLots.length) {
      const lot = buyLots[buyIdx];

      // Skip lots that are fully consumed
      if (lot.remainingQty <= 0) {
        buyIdx++;
        continue;
      }

      // Determine how much of this lot to consume
      const matched = Math.min(lot.remainingQty, sellRemaining);

      // Compute holding period and classification
      const holdingDays = daysBetween(lot.executedAt, sell.executedAt);
      const gainType = holdingDays >= HOLDING_PERIOD_THRESHOLD ? 'LTCG' : 'STCG';

      // Compute realized gain for this matched portion
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

      // Update remaining quantities
      lot.remainingQty -= matched;
      sellRemaining -= matched;

      // Move to next lot if fully consumed
      if (lot.remainingQty <= 0) {
        buyIdx++;
      }
    }
  }

  return gains;
};

// ── Tax Computation ──────────────────────────────────────────────────────────

/**
 * computeEstimatedTax(totalSTCG, totalLTCG)
 *
 * Applies Indian capital gains tax rates to realized gains.
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

    // Run FIFO matching
    const gains = matchFIFO(lotsWithRemaining, assetSells);

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

  // Replay FIFO to consume lots against all historical sells
  matchFIFO(lotsWithRemaining, sellTxns);

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
 *  3. Run matchFIFO per asset
 *  4. Enrich gain records with asset metadata (ticker, name, assetType)
 *  5. Paginate the final gains array
 *  6. Compute summary: totalSTCG, totalLTCG, netRealizedGain
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

  for (const record of allGains) {
    if (record.gainType === 'STCG') {
      totalSTCG += record.gain;
    } else {
      totalLTCG += record.gain;
    }
  }

  const netRealizedGain = totalSTCG + totalLTCG;

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

  for (const record of allGains) {
    if (record.gainType === 'STCG') {
      totalSTCG += record.gain;
    } else {
      totalLTCG += record.gain;
    }
  }

  const netRealizedGain = totalSTCG + totalLTCG;

  // Compute estimated tax
  const { stcgTax, ltcgTax, estimatedTax } = computeEstimatedTax(totalSTCG, totalLTCG);

  // Count harvesting opportunities (using default minLoss = 0)
  let harvestingCount = 0;
  try {
    const { opportunities } = await getHarvestingOpportunities(userId, {
      taxYear: effectiveTaxYear,
      minLoss: 0,
    });
    harvestingCount = opportunities.length;
  } catch {
    // If harvesting computation fails, default to 0
    harvestingCount = 0;
  }

  return {
    totalSTCG,
    totalLTCG,
    netRealizedGain,
    stcgTax,
    ltcgTax,
    estimatedTax,
    harvestingCount,
    taxYear: effectiveTaxYear,
  };
};

/**
 * getHarvestingOpportunities(userId, { taxYear, minLoss })
 *
 * Identifies current holdings with unrealized losses that could be sold
 * to offset realized gains (tax-loss harvesting).
 *
 * Flow:
 *  1. Call portfolioService.computeHoldings(userId) for live holdings
 *  2. Filter holdings where unrealisedPnL < -minLoss
 *  3. For each loser, find the oldest unmatched BUY lot (via FIFO state)
 *  4. Classify: if days since oldest buy >= 365 → LTCG loss, else STCG loss
 *  5. Compute estimatedSaving = |unrealizedLoss| × applicable rate
 *  6. Sort by estimatedSaving descending
 *
 * @param {string} userId - MongoDB ObjectId string
 * @param {object} options
 * @param {number} [options.taxYear] - Indian FY start year (unused directly, kept for API consistency)
 * @param {number} [options.minLoss=0] - Minimum unrealized loss threshold (₹)
 * @returns {Promise<{ opportunities: Array, meta: object }>}
 */
const getHarvestingOpportunities = async (userId, { taxYear, minLoss = 0 } = {}) => {
  // Step 1: Get current holdings with live prices
  const holdings = await portfolioService.computeHoldings(userId);

  // Step 2: Filter to holdings with unrealized losses exceeding threshold
  const losers = holdings.filter((h) => h.unrealisedPnL < -minLoss);

  // Step 3–5: For each loser, determine holding period and compute savings
  const opportunities = await Promise.all(
    losers.map(async (holding) => {
      // Find oldest unmatched BUY lot for holding period classification
      const oldestBuy = await getOldestUnmatchedBuyLot(userId, holding.assetId);

      const holdingDays = oldestBuy ? daysBetween(oldestBuy.executedAt, new Date()) : 0;

      const lossType = holdingDays >= HOLDING_PERIOD_THRESHOLD ? 'LTCG' : 'STCG';
      const rate = lossType === 'STCG' ? STCG_RATE : LTCG_RATE;
      const unrealizedLoss = Math.abs(holding.unrealisedPnL);
      const estimatedSaving = unrealizedLoss * rate;

      return {
        assetId: holding.assetId.toString(),
        ticker: holding.asset.ticker,
        name: holding.asset.name,
        assetType: holding.asset.assetType,
        sector: holding.asset.sector || null,
        unrealizedLoss,
        currentPrice: holding.currentPrice,
        avgCostBasis: holding.avgCostBasis,
        quantity: holding.netQuantity,
        holdingDays,
        lossType,
        estimatedSaving,
        offsetsGainType: lossType,
      };
    })
  );

  // Step 6: Sort by estimated savings descending
  opportunities.sort((a, b) => b.estimatedSaving - a.estimatedSaving);

  return {
    opportunities,
    meta: {
      minLoss,
      totalOpportunities: opportunities.length,
    },
  };
};

module.exports = {
  getFYDateRange,
  getCurrentFY,
  matchFIFO,
  computeEstimatedTax,
  getGainsLedger,
  getTaxSummary,
  getHarvestingOpportunities,
};
