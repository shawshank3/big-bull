/**
 * Format Utilities
 * Pure helpers for formatting currency, numbers, percentages, and dates.
 */

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatPercentage = (value, decimals = 2) => {
  return `${Number(value).toFixed(decimals)}%`;
};

export const formatNumber = (value, decimals = 2) => {
  return Number(value).toFixed(decimals);
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN');
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const calculateReturn = (investedAmount, currentValue) => {
  return currentValue - investedAmount;
};

export const calculateReturnPercentage = (investedAmount, currentValue) => {
  if (investedAmount === 0) return 0;
  return ((currentValue - investedAmount) / investedAmount) * 100;
};

export const getReturnColor = (returnValue) => {
  if (returnValue > 0) return 'text-success';
  if (returnValue < 0) return 'text-danger';
  return 'text-gray-500';
};

export const getReturnBadgeVariant = (returnValue) => {
  if (returnValue > 0) return 'success';
  if (returnValue < 0) return 'danger';
  return 'info';
};
