export const getAllocationValue = (allocation, key) =>
  key === 'mutual' ? allocation.mutualAllocation : allocation.stockAllocation;

export const getAllocationAmount = (allocation, key) =>
  key === 'mutual' ? allocation.mutualValue : allocation.stockValue;
