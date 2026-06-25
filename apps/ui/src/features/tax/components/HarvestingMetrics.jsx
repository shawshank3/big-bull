import { Card, CardContent } from '@/shared/components/card';
import { MutedText, StatValue } from '@/shared/ui/typography';
import { formatCurrency } from '@/shared/utils';
import {
  computeHarvestingMetrics,
  computeTax,
  STCG_RATE,
  LTCG_RATE,
  LTCG_EXEMPTION,
} from '../utils/taxCalculations';

export const HarvestingMetrics = ({ opportunities = [], summary = {} }) => {
  const { totalHarvestableLoss, potentialTaxSavings, stcgOffsets, ltcgOffsets } =
    computeHarvestingMetrics(opportunities);

  const totalSTCG = summary.totalSTCG ?? 0;
  const totalLTCG = summary.totalLTCG ?? 0;

  // Current per-bucket tax
  const currentStcgTax = totalSTCG > 0 ? totalSTCG * STCG_RATE : 0;
  const currentLtcgTax = totalLTCG > LTCG_EXEMPTION ? (totalLTCG - LTCG_EXEMPTION) * LTCG_RATE : 0;
  const currentTax = currentStcgTax + currentLtcgTax;

  // Post-harvest tax — STCG losses cap STCG gains, LTCG losses cap LTCG gains (independent buckets)
  const effectiveStcgAfter = Math.max(0, totalSTCG - stcgOffsets);
  const effectiveLtcgAfter = Math.max(0, totalLTCG - ltcgOffsets);
  const stcgTaxAfter = effectiveStcgAfter > 0 ? effectiveStcgAfter * STCG_RATE : 0;
  const ltcgTaxAfter =
    effectiveLtcgAfter > LTCG_EXEMPTION ? (effectiveLtcgAfter - LTCG_EXEMPTION) * LTCG_RATE : 0;
  const taxAfterHarvest = computeTax(effectiveStcgAfter, effectiveLtcgAfter);
  const actualSavings = currentTax - taxAfterHarvest;

  // Per-bucket: how much loss is needed to fully eliminate that bucket's tax
  const stcgLossNeeded = Math.max(0, totalSTCG); // bring STCG gain to zero
  const ltcgLossNeeded = Math.max(0, totalLTCG - LTCG_EXEMPTION); // bring LTCG to exemption
  const stcgLossUsed = Math.min(stcgOffsets, stcgLossNeeded);
  const ltcgLossUsed = Math.min(ltcgOffsets, ltcgLossNeeded);

  // Per-bucket state classification
  const stcgHasExcess = stcgLossNeeded > 0 && stcgOffsets > stcgLossNeeded;
  const stcgInsufficient = stcgLossNeeded > 0 && stcgOffsets > 0 && stcgOffsets < stcgLossNeeded;

  const ltcgHasExcess = ltcgLossNeeded > 0 && ltcgOffsets > ltcgLossNeeded;
  const ltcgInsufficient = ltcgLossNeeded > 0 && ltcgOffsets > 0 && ltcgOffsets < ltcgLossNeeded;

  // Build per-bucket insight messages (separate, not awkwardly merged)
  const insightPoints = [];
  if (stcgHasExcess) {
    insightPoints.push(
      `Only ${formatCurrency(stcgLossUsed)} of your ${formatCurrency(stcgOffsets)} STCG losses are needed to fully offset your ${formatCurrency(currentStcgTax)} STCG tax.`
    );
  } else if (stcgInsufficient) {
    insightPoints.push(
      `STCG losses can reduce STCG tax from ${formatCurrency(currentStcgTax)} to ${formatCurrency(stcgTaxAfter)} — not enough to wipe it out.`
    );
  }
  if (ltcgHasExcess) {
    insightPoints.push(
      `Only ${formatCurrency(ltcgLossUsed)} of your ${formatCurrency(ltcgOffsets)} LTCG losses are needed to fully offset your ${formatCurrency(currentLtcgTax)} LTCG tax.`
    );
  } else if (ltcgInsufficient) {
    insightPoints.push(
      `LTCG losses can reduce LTCG tax from ${formatCurrency(currentLtcgTax)} to ${formatCurrency(ltcgTaxAfter)} — not enough to wipe it out.`
    );
  }

  // Column label: "After Optimal Harvest" when at least one bucket has excess losses
  // (selective harvesting works); otherwise "After Full Harvest" (every available loss is used).
  const hasAnyExcess = stcgHasExcess || ltcgHasExcess;
  const harvestLabel = hasAnyExcess ? 'After Optimal Harvest' : 'After Full Harvest';
  const harvestSubtitle = hasAnyExcess
    ? `Save ${formatCurrency(actualSavings)} • Selective harvest sufficient`
    : `Save ${formatCurrency(actualSavings)}`;

  const metrics = [
    { label: 'Total Harvestable Loss', value: formatCurrency(totalHarvestableLoss) },
    { label: 'Potential Tax Savings', value: formatCurrency(potentialTaxSavings) },
    { label: 'STCG Offsets Available', value: formatCurrency(stcgOffsets) },
    { label: 'LTCG Offsets Available', value: formatCurrency(ltcgOffsets) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="stat-grid">
        {metrics.map((item) => (
          <Card key={item.label}>
            <CardContent className="space-y-1 pt-6">
              <MutedText>{item.label}</MutedText>
              <StatValue>{item.value}</StatValue>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Net Tax Insight Card */}
      {currentTax > 0 && potentialTaxSavings > 0 && (
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex flex-col gap-3">
              {/* Insights — one per applicable bucket */}
              {insightPoints.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="inline-flex shrink-0 items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                    💡 Insight
                  </span>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    {insightPoints.map((point, idx) => (
                      <span key={idx}>{point}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tax breakdown row */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">STCG Tax</span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(currentStcgTax)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatCurrency(totalSTCG)} × {STCG_RATE * 100}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">LTCG Tax</span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(currentLtcgTax)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatCurrency(totalLTCG)} × {LTCG_RATE * 100}% (above ₹1.25L)
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Current Total Tax</span>
                  <span className="text-sm font-semibold tabular-nums text-danger">
                    {formatCurrency(currentTax)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{harvestLabel}</span>
                  <span className="text-sm font-semibold tabular-nums text-success">
                    {formatCurrency(taxAfterHarvest)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{harvestSubtitle}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HarvestingMetrics;
