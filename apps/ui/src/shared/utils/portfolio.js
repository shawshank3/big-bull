import { calculateReturnPercentage } from './format';
import { HOLDING_TYPES } from '../constants/assetTypes';

export const getHoldingValue = (holding) => holding.qty * holding.currentPrice;

export const getHoldingInvestedValue = (holding) => holding.qty * holding.avgPrice;

export const getHoldingReturn = (holding) => {
  const invested = getHoldingInvestedValue(holding);
  const current = getHoldingValue(holding);

  return {
    value: current - invested,
    percentage: calculateReturnPercentage(invested, current),
  };
};

export const getPortfolioSummary = (holdings = []) => {
  const totalInvested = holdings.reduce(
    (sum, holding) => sum + getHoldingInvestedValue(holding),
    0
  );
  const totalValue = holdings.reduce((sum, holding) => sum + getHoldingValue(holding), 0);
  const totalReturn = totalValue - totalInvested;

  return {
    totalInvested,
    totalValue,
    totalReturn,
    returnPercentage: calculateReturnPercentage(totalInvested, totalValue),
    holdingCount: holdings.length,
  };
};

export const getAllocation = (holdings = []) => {
  const mutualValue = holdings
    .filter((holding) => holding.type === 'mutual')
    .reduce((sum, holding) => sum + getHoldingValue(holding), 0);

  const stockValue = holdings
    .filter((holding) => holding.type === HOLDING_TYPES.STOCK)
    .reduce((sum, holding) => sum + getHoldingValue(holding), 0);

  const total = mutualValue + stockValue;

  return {
    mutualValue,
    stockValue,
    total,
    mutualAllocation: total ? (mutualValue / total) * 100 : 0,
    stockAllocation: total ? (stockValue / total) * 100 : 0,
  };
};
