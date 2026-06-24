import { useState, useMemo } from 'react';
import { computeTax } from '../utils/taxCalculations';

/**
 * What-If Simulator hook.
 * Manages selected opportunity IDs and computes combined tax impact.
 *
 * @param {object|null} summary - Tax summary from useGetTaxSummaryQuery
 * @param {Array} opportunities - Harvesting opportunities array
 * @returns {object} Simulator state and computed values
 */
export function useWhatIfSimulator(summary, opportunities) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleSelection = (assetId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  };

  const resetSelection = () => setSelectedIds(new Set());

  const computed = useMemo(() => {
    const selectedOpportunities = opportunities.filter((o) => selectedIds.has(o.assetId));
    const selectedLossesTotal = selectedOpportunities.reduce((sum, o) => sum + o.unrealizedLoss, 0);

    const currentFYGain = summary?.netRealizedGain ?? 0;
    const postHarvestGain = currentFYGain - selectedLossesTotal;

    // Tax before: compute from current realized gains
    const totalSTCG = summary?.totalSTCG ?? 0;
    const totalLTCG = summary?.totalLTCG ?? 0;
    const taxBefore = computeTax(totalSTCG, totalLTCG);

    // Tax after: subtract selected STCG losses from STCG gains, LTCG losses from LTCG gains
    const stcgLossSelected = selectedOpportunities
      .filter((o) => o.lossType === 'STCG')
      .reduce((sum, o) => sum + o.unrealizedLoss, 0);
    const ltcgLossSelected = selectedOpportunities
      .filter((o) => o.lossType === 'LTCG')
      .reduce((sum, o) => sum + o.unrealizedLoss, 0);

    const taxAfter = computeTax(
      Math.max(0, totalSTCG - stcgLossSelected),
      Math.max(0, totalLTCG - ltcgLossSelected)
    );

    const netSavings = taxBefore - taxAfter;

    return {
      selectedLossesTotal,
      currentFYGain,
      postHarvestGain,
      taxBefore,
      taxAfter,
      netSavings,
    };
  }, [selectedIds, summary, opportunities]);

  return {
    selectedIds,
    toggleSelection,
    resetSelection,
    hasSelection: selectedIds.size > 0,
    ...computed,
  };
}
