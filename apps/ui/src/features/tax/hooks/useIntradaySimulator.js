import { useState, useMemo } from 'react';
import { computeIntradayTax } from '../utils/taxCalculations';

/**
 * useIntradaySimulator
 *
 * Manages checkbox selection for intraday harvesting positions and computes
 * the intraday tax impact of closing the selected positions now.
 *
 * Intraday losses under Section 43(5) can only offset other speculative
 * (intraday) gains — they cannot be set off against STCG or LTCG.
 *
 * @param {object|null} summary              - Tax summary from useGetTaxSummaryQuery
 * @param {Array}       intradayOpportunities - Intraday opportunities array
 * @param {number}      slabRate             - User's income slab rate (e.g. 0.30)
 */
export function useIntradaySimulator(summary, intradayOpportunities = [], slabRate = 0.3) {
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
    const selected = intradayOpportunities.filter((o) => selectedIds.has(o.assetId));
    const selectedLossesTotal = selected.reduce((s, o) => s + o.unrealizedIntradayLoss, 0);

    const totalIntraday = summary?.totalIntraday ?? 0;

    // Intraday tax before closing any positions
    const taxBefore = computeIntradayTax(totalIntraday, slabRate);

    // After closing selected positions: intraday gain reduced by those losses
    const postHarvestIntraday = totalIntraday - selectedLossesTotal;
    const taxAfter = computeIntradayTax(postHarvestIntraday, slabRate);

    const netSavings = taxBefore - taxAfter;

    return {
      selectedLossesTotal,
      currentIntradayGain: totalIntraday,
      postHarvestIntraday,
      taxBefore,
      taxAfter,
      netSavings,
    };
  }, [selectedIds, intradayOpportunities, summary, slabRate]);

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    resetSelection,
    hasSelection: selectedIds.size > 0,
    ...computed,
  };
}
