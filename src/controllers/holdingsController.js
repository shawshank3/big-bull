/**
 * Holdings Controller
 * Handles holdings CRUD operations
 */
const Holding = require('../models/Holding');
const { sendSuccess, sendError } = require('../utils/response');

// Get all holdings for user
const getAllHoldings = async (req, res) => {
  try {
    const holdings = await Holding.find({ user: req.user.id }).sort({ createdAt: -1 });

    // Calculate portfolio stats
    let totalInvested = 0;
    let totalCurrent = 0;

    holdings.forEach(h => {
      totalInvested += h.qty * h.avgPrice;
      totalCurrent += h.qty * h.currentPrice;
    });

    return sendSuccess(res, {
      holdings,
      stats: {
        totalInvested,
        totalCurrent,
        totalReturn: totalCurrent - totalInvested,
        returnPercentage: totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested * 100).toFixed(2) : 0,
      },
    }, 'Holdings retrieved successfully');
  } catch (error) {
    console.error('Get holdings error:', error);
    return sendError(res, error.message || 'Failed to get holdings', 500);
  }
};

// Get mutual funds
const getMutuals = async (req, res) => {
  try {
    const mutuals = await Holding.find({ 
      user: req.user.id,
      type: 'mutual' 
    }).sort({ createdAt: -1 });

    return sendSuccess(res, mutuals, 'Mutual funds retrieved successfully');
  } catch (error) {
    console.error('Get mutuals error:', error);
    return sendError(res, error.message || 'Failed to get mutual funds', 500);
  }
};

// Get stocks
const getStocks = async (req, res) => {
  try {
    const stocks = await Holding.find({ 
      user: req.user.id,
      type: 'stock' 
    }).sort({ createdAt: -1 });

    return sendSuccess(res, stocks, 'Stocks retrieved successfully');
  } catch (error) {
    console.error('Get stocks error:', error);
    return sendError(res, error.message || 'Failed to get stocks', 500);
  }
};

// Get single holding
const getHolding = async (req, res) => {
  try {
    const holding = await Holding.findOne({ 
      _id: req.params.id,
      user: req.user.id 
    });

    if (!holding) {
      return sendError(res, 'Holding not found', 404);
    }

    return sendSuccess(res, holding, 'Holding retrieved successfully');
  } catch (error) {
    console.error('Get holding error:', error);
    return sendError(res, error.message || 'Failed to get holding', 500);
  }
};

// Create holding
const createHolding = async (req, res) => {
  try {
    const { type, name, symbol, qty, avgPrice, currentPrice, notes } = req.body;

    // Validation
    if (!type || !qty || !avgPrice || !currentPrice) {
      return sendError(res, 'Please provide all required fields', 400);
    }

    const holding = await Holding.create({
      user: req.user.id,
      type,
      name,
      symbol,
      qty,
      avgPrice,
      currentPrice,
      notes,
    });

    return sendSuccess(res, holding, 'Holding created successfully', 201);
  } catch (error) {
    console.error('Create holding error:', error);
    return sendError(res, error.message || 'Failed to create holding', 500);
  }
};

// Update holding
const updateHolding = async (req, res) => {
  try {
    const { qty, avgPrice, currentPrice, notes } = req.body;

    const holding = await Holding.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { qty, avgPrice, currentPrice, notes },
      { new: true, runValidators: true }
    );

    if (!holding) {
      return sendError(res, 'Holding not found', 404);
    }

    return sendSuccess(res, holding, 'Holding updated successfully');
  } catch (error) {
    console.error('Update holding error:', error);
    return sendError(res, error.message || 'Failed to update holding', 500);
  }
};

// Delete holding
const deleteHolding = async (req, res) => {
  try {
    const holding = await Holding.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!holding) {
      return sendError(res, 'Holding not found', 404);
    }

    return sendSuccess(res, {}, 'Holding deleted successfully');
  } catch (error) {
    console.error('Delete holding error:', error);
    return sendError(res, error.message || 'Failed to delete holding', 500);
  }
};

// Get portfolio summary
const getPortfolioSummary = async (req, res) => {
  try {
    const holdings = await Holding.find({ user: req.user.id });

    let totalInvested = 0;
    let totalCurrent = 0;
    let mutualCount = 0;
    let stockCount = 0;

    holdings.forEach(h => {
      totalInvested += h.qty * h.avgPrice;
      totalCurrent += h.qty * h.currentPrice;
      if (h.type === 'mutual') mutualCount++;
      else stockCount++;
    });

    const totalReturn = totalCurrent - totalInvested;
    const returnPercentage = totalInvested > 0 ? ((totalReturn) / totalInvested * 100).toFixed(2) : 0;

    return sendSuccess(res, {
      totalInvested,
      totalCurrent,
      totalReturn,
      returnPercentage,
      holdingCount: holdings.length,
      mutualCount,
      stockCount,
    }, 'Portfolio summary retrieved successfully');
  } catch (error) {
    console.error('Get portfolio summary error:', error);
    return sendError(res, error.message || 'Failed to get portfolio summary', 500);
  }
};

module.exports = {
  getAllHoldings,
  getMutuals,
  getStocks,
  getHolding,
  createHolding,
  updateHolding,
  deleteHolding,
  getPortfolioSummary,
};
