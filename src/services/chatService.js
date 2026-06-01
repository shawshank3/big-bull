/**
 * Chat service — Gemini calls and portfolio context
 */
const { GoogleGenAI } = require('@google/genai');
const Holding = require('../models/Holding');
const { API_KEY_ENV, MODEL, GENERATION, SYSTEM_INSTRUCTION } = require('../config/chat');

const getApiKey = () => (process.env[API_KEY_ENV] || '').trim();

const getClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    const err = new Error(`${API_KEY_ENV} is not configured`);
    err.status = 503;
    throw err;
  }
  return new GoogleGenAI({ apiKey });
};

const buildPortfolioContext = async (userId) => {
  const holdings = await Holding.find({ user: userId }).sort({ createdAt: -1 }).lean();

  if (!holdings.length) {
    return 'USER PORTFOLIO: No holdings saved in BigBull yet.';
  }

  let totalInvested = 0;
  let totalCurrent = 0;

  const lines = holdings.map((holding) => {
    const label = holding.symbol || holding.name || 'Unknown';
    const invested = holding.qty * holding.avgPrice;
    const current = holding.qty * holding.currentPrice;
    const pnlPct = invested > 0 ? (((current - invested) / invested) * 100).toFixed(2) : '0.00';

    totalInvested += invested;
    totalCurrent += current;

    return (
      `- ${label} (${holding.type}): qty ${holding.qty}, avg ${holding.avgPrice}, ` +
      `stored price ${holding.currentPrice}, value ${current.toFixed(2)}, P/L ${pnlPct}%`
    );
  });

  const totalReturn = totalCurrent - totalInvested;
  const returnPct = totalInvested > 0 ? ((totalReturn / totalInvested) * 100).toFixed(2) : '0.00';

  return [
    'USER PORTFOLIO (from BigBull — prices are last saved values, not live exchange ticks):',
    ...lines,
    `Totals: invested ${totalInvested.toFixed(2)}, current ${totalCurrent.toFixed(2)}, return ${totalReturn.toFixed(2)} (${returnPct}%)`,
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

module.exports = {
  ask,
};
