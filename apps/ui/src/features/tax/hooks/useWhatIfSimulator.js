import { useState, useMemo } from 'react';
import {
  computeTax,
  computeIntradayTax,
  STCG_RATE,
  LTCG_RATE,
  LTCG_EXEMPTION,
} from '../utils/taxCalculations';

/**
 * useWhatIfSimulator
 *
 * Manages checkbox selection for a set of delivery harvesting opportunities
 * and computes the per-bucket (STCG or LTCG) tax impact of harvesting
 * the selected positions.
 *
 * Loss set-off rules (Indian tax law):
 *  - STCG losses → offset STCG gains only
 *  - LTCG losses → offset LTCG gains only (above ₹1,25,000 exemption)
 *
 * The hook is bucket-aware: pass `bucket='STCG'` to get STCG-specific
 * before/after figures, or `bucket='LTCG'` for LTCG.
 *
 * @param {object|null} summary   - Tax summary from useGetTaxSummaryQuery
 * @param {Array}       opps      - Opportunities array (already filtered to the bucket)
 * @param {'STCG'|'LTCG'} bucket - Which tax bucket this simulator is for
 * @param {number}      slabRate  - User intraday slab rate (carried through for total tax display)
 */
export function useWhatIfSimulator(summary, opps = [], bucket = 'STCG', slabRate = 0.3) {
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
    const selected = opps.filter((o) => selectedIds.has(o.assetId));
    const selectedLossesTotal = selected.reduce((s, o) => s + o.unrealizedLoss, 0);

    const totalSTCG = summary?.totalSTCG ?? 0;
    const totalLTCG = summary?.totalLTCG ?? 0;
    const totalIntraday = summary?.totalIntraday ?? 0;

    // Per-bucket tax before
    const taxBeforeSTCG = totalSTCG > 0 ? totalSTCG * STCG_RATE : 0;
    const taxBeforeLTCG = totalLTCG > LTCG_EXEMPTION ? (totalLTCG - LTCG_EXEMPTION) * LTCG_RATE : 0;
    const intradayTax = computeIntradayTax(totalIntraday, slabRate);

    let bucketGain, taxBefore, taxAfter;

    if (bucket === 'STCG') {
      bucketGain = totalSTCG;
      taxBefore = taxBeforeSTCG;
      const postHarvestSTCG = Math.max(0, totalSTCG - selectedLossesTotal);
      taxAfter = postHarvestSTCG > 0 ? postHarvestSTCG * STCG_RATE : 0;
    } else {
      bucketGain = totalLTCG;
      taxBefore = taxBeforeLTCG;
      const postHarvestLTCG = Math.max(0, totalLTCG - selectedLossesTotal);
      taxAfter =
        postHarvestLTCG > LTCG_EXEMPTION ? (postHarvestLTCG - LTCG_EXEMPTION) * LTCG_RATE : 0;
    }

    const netSavings = taxBefore - taxAfter;
    const postHarvestGain = Math.max(0, bucketGain - selectedLossesTotal);

    return {
      selectedLossesTotal,
      bucketGain,
      postHarvestGain,
      taxBefore,
      taxAfter,
      netSavings,
      intradayTax, // passed through for the full-tax display if needed
    };
  }, [selectedIds, opps, summary, bucket, slabRate]);

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    resetSelection,
    hasSelection: selectedIds.size > 0,
    ...computed,
  };
}
