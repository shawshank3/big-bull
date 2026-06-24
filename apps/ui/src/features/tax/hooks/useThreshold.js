import { useState } from 'react';

const STORAGE_KEY = 'tax_minLoss_threshold';

/**
 * Reads the persisted threshold value from localStorage.
 * Returns 0 if nothing is stored or the value is invalid.
 */
function getStoredThreshold() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored == null) return 0;
    const parsed = Number(stored);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

/**
 * Custom hook for managing the minLoss threshold with localStorage persistence.
 * Defaults to ₹0 when no localStorage value exists.
 *
 * @returns {{ threshold: number, setThreshold: Function }}
 */
export function useThreshold() {
  const [threshold, setThresholdState] = useState(getStoredThreshold);

  const setThreshold = (value) => {
    const numValue = Number(value);
    const safeValue = Number.isFinite(numValue) && numValue >= 0 ? numValue : 0;
    setThresholdState(safeValue);
    try {
      localStorage.setItem(STORAGE_KEY, String(safeValue));
    } catch {
      // localStorage may be unavailable — fail silently
    }
  };

  return { threshold, setThreshold };
}
