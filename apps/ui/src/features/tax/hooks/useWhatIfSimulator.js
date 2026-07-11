import { useState, useMemo } from 'react';
import { computeTax, computeIntradayTax } from '../utils/taxCalculations';

/**
 * What-If Simulator hook.
 * Manages selected opportunity IDs and computes combined tax impact.
 *
 * Loss set-off rules (Indian tax law):
 *  - STCG losses offset STCG gains only
 *  - LTCG losses offset LTCG gains only
 *  - Intraday losses can only offset other speculative (intraday) gains —
 *    they CANNOT be set off against STCG or LTCG
 *
 * @param {object|null} summary - Tax summary from useGetTaxSummaryQuery
 * @param {Array} opportunities - Harvesting opportunities array
 * @param {number} slabRate - User's income slab rate for intraday tax (e.g. 0.30)
 * @returns {object} Simulator state and computed values
 */
export function useWhatIfSimulator(summary, opportunities, slabRate = 0.3) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleSelection = (assetId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  };

  const selectAll = (ids) => setSelectedIds(new Set(ids));

  const resetSelection = () => setSelectedIds(new Set());

  const computed = useMemo(() => {
    const selectedOpportunities = opportunities.filter((o) => selectedIds.has(o.assetId));
    const selectedLossesTotal = selectedOpportunities.reduce((sum, o) => sum + o.unrealizedLoss, 0);

    const currentFYGain = summary?.netRealizedGain ?? 0;
    const postHarvestGain = currentFYGain - selectedLossesTotal;

    const totalSTCG = summary?.totalSTCG ?? 0;
    const totalLTCG = summary?.totalLTCG ?? 0;
    const totalIntraday = summary?.totalIntraday ?? 0;

    // Tax before harvesting
    const taxBefore =
      computeTax(totalSTCG, totalLTCG) + computeIntradayTax(totalIntraday, slabRate);

    // Separate selected losses by type.
    // Intraday losses ONLY offset intraday gains (Section 43(5) — speculative
    // losses cannot be set off against capital gains).
    const stcgLossSelected = selectedOpportunities
      .filter((o) => o.lossType === 'STCG')
      .reduce((sum, o) => sum + o.unrealizedLoss, 0);

    const ltcgLossSelected = selectedOpportunities
      .filter((o) => o.lossType === 'LTCG')
      .reduce((sum, o) => sum + o.unrealizedLoss, 0);

    // Intraday losses are not eligible for harvesting against CG — excluded here.
    // (Harvesting opportunities are delivery-based positions held overnight;
    // they are classified as STCG or LTCG, never INTRADAY.)

    const taxAfter =
      computeTax(
        Math.max(0, totalSTCG - stcgLossSelected),
        Math.max(0, totalLTCG - ltcgLossSelected)
      ) + computeIntradayTax(totalIntraday, slabRate);

    const netSavings = taxBefore - taxAfter;

    return {
      selectedLossesTotal,
      currentFYGain,
      postHarvestGain,
      taxBefore,
      taxAfter,
      netSavings,
    };
  }, [selectedIds, summary, opportunities, slabRate]);

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    resetSelection,
    hasSelection: selectedIds.size > 0,
    ...computed,
  };
}
