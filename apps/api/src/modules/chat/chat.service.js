/**
 * Chat Service — Gemini calls and portfolio context
 */
const { GoogleGenAI } = require('@google/genai');
const portfolioService = require('../portfolio/portfolio.service');
const { API_KEY_ENV, MODEL, GENERATION, SYSTEM_INSTRUCTION } = require('../../config/chat');

const getClient = () => {
  const apiKey = (process.env[API_KEY_ENV] || '').trim();
  if (!apiKey) {
    const err = new Error(`${API_KEY_ENV} is not configured`);
    err.status = 503;
    throw err;
  }
  return new GoogleGenAI({ apiKey });
};

const buildPortfolioContext = async (userId) => {
  const holdings = await portfolioService.computeHoldings(userId);

  if (!holdings.length) {
    return 'USER PORTFOLIO: No holdings saved in BigBull yet.';
  }

  let totalInvested = 0;
  let totalCurrent = 0;

  const lines = holdings.map((h) => {
    const label = h.asset.ticker || h.asset.name || 'Unknown';
    const current = h.currentValue;
    const invested = h.totalInvested;
    const pnlPct = invested > 0 ? (((current - invested) / invested) * 100).toFixed(2) : '0.00';

    totalInvested += invested;
    totalCurrent += current;

    return (
      `- ${label} (${h.asset.assetType}): qty ${h.netQuantity}, avg ${h.avgCostBasis}, ` +
      `value ${current.toFixed(2)}, P/L ${pnlPct}%`
    );
  });

  const totalReturn = totalCurrent - totalInvested;
  const returnPct = totalInvested > 0
    ? ((totalReturn / totalInvested) * 100).toFixed(2) : '0.00';

  return [
    'USER PORTFOLIO (prices from Redis cache, not live exchange ticks):',
    ...lines,
    `Totals: invested ${totalInvested.toFixed(2)}, current ${totalCurrent.toFixed(2)}, ` +
    `return ${totalReturn.toFixed(2)} (${returnPct}%)`,
  ].join('\n');
};

const ask = async (userId, message) => {
  const portfolioContext = await buildPortfolioContext(userId);
  const prompt = `${portfolioContext}\n\nUser question: ${message.trim()}`;

  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
      ...GENERATION,
    },
  });

  return response.text?.trim() || null;
};

module.exports = { ask };
