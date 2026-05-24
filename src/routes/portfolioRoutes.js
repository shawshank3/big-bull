/**
 * Portfolio Routes
 * Routes for portfolio operations
 */
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Holding = require('../models/Holding');
const { sendSuccess, sendError } = require('../utils/response');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Get portfolio summary
router.get('/summary', async (req, res) => {
  try {
    const holdings = await Holding.find({ user: req.user.id });

    let totalInvested = 0;
    let totalCurrent = 0;
    let mutualValue = 0;
    let stockValue = 0;

    holdings.forEach(h => {
      const investedAmount = h.qty * h.avgPrice;
      const currentValue = h.qty * h.currentPrice;
      totalInvested += investedAmount;
      totalCurrent += currentValue;

      if (h.type === 'mutual') {
        mutualValue += currentValue;
      } else {
        stockValue += currentValue;
      }
    });

    const totalReturn = totalCurrent - totalInvested;
    const returnPercentage = totalInvested > 0 ? ((totalReturn) / totalInvested * 100).toFixed(2) : 0;

    return sendSuccess(res, {
      totalInvested,
      totalCurrent,
      totalReturn,
      returnPercentage,
      mutualAllocation: totalCurrent > 0 ? ((mutualValue / totalCurrent) * 100).toFixed(2) : 0,
      stockAllocation: totalCurrent > 0 ? ((stockValue / totalCurrent) * 100).toFixed(2) : 0,
      mutualValue,
      stockValue,
    });
  } catch (error) {
    console.error('Get portfolio summary error:', error);
    return sendError(res, error.message || 'Failed to get portfolio summary', 500);
  }
});

// Get portfolio stats
router.get('/stats', async (req, res) => {
  try {
    const holdings = await Holding.find({ user: req.user.id });

    const stats = {
      totalHoldings: holdings.length,
      totalMutuals: holdings.filter(h => h.type === 'mutual').length,
      totalStocks: holdings.filter(h => h.type === 'stock').length,
      topPerformer: null,
      worstPerformer: null,
    };

    if (holdings.length > 0) {
      let maxReturn = -Infinity;
      let minReturn = Infinity;

      holdings.forEach(h => {
        const returnPercentage = ((h.currentPrice - h.avgPrice) / h.avgPrice * 100);
        if (returnPercentage > maxReturn) {
          maxReturn = returnPercentage;
          stats.topPerformer = { name: h.name || h.symbol, returnPercentage };
        }
        if (returnPercentage < minReturn) {
          minReturn = returnPercentage;
          stats.worstPerformer = { name: h.name || h.symbol, returnPercentage };
        }
      });
    }

    return sendSuccess(res, stats);
  } catch (error) {
    console.error('Get portfolio stats error:', error);
    return sendError(res, error.message || 'Failed to get portfolio stats', 500);
  }
});

module.exports = router;
