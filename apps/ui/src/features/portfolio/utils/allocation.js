import { HOLDING_TYPES } from '../constants/holdings';

export const getAllocationValue = (allocation, key) =>
  key === HOLDING_TYPES.MUTUAL ? allocation.mutualAllocation : allocation.stockAllocation;

export const getAllocationAmount = (allocation, key) =>
  key === HOLDING_TYPES.MUTUAL ? allocation.mutualValue : allocation.stockValue;
