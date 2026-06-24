import { useState } from 'react';
import { getCurrentFY } from '../utils/taxFormatters';

// Re-export for convenience (used by barrel index.js)
export { getCurrentFY };

/**
 * Custom hook for managing the selected Indian Financial Year.
 * Defaults to the current FY.
 *
 * @returns {{ taxYear: number, setTaxYear: Function }}
 */
export function useTaxYear() {
  const [taxYear, setTaxYear] = useState(getCurrentFY);

  return { taxYear, setTaxYear };
}
