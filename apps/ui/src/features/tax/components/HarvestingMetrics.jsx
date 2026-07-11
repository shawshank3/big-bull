import { Card, CardContent } from '@/shared/components/card';
import { MutedText, StatValue } from '@/shared/ui/typography';
import { formatCurrency } from '@/shared/utils';
import { STCG_RATE, LTCG_RATE, LTCG_EXEMPTION, computeTax } from '../utils/taxCalculations';

/**
 * HarvestingMetrics
 *
 * Shows summary metric cards and an insight card for a single tax bucket
 * (STCG or LTCG). Each bucket is fully independent — STCG losses only
 * offset STCG gains, LTCG losses only offset LTCG gains.
 *
 * @param {{ opportunities: Array, summary: object, bucket: 'STCG'|'LTCG' }} props
 */
export const HarvestingMetrics = ({ opportunities = [], summary = {}, bucket = 'STCG' }) => {
  const isSTCG = bucket === 'STCG';

  // Filter to just this bucket's opportunities
  const bucketOpps = opportunities.filter((o) => o.lossType === bucket);
  const totalHarvestableLoss = bucketOpps.reduce((s, o) => s + o.unrealizedLoss, 0);
  const potentialTaxSavings = bucketOpps.reduce((s, o) => s + o.estimatedSaving, 0);

  const totalSTCG = summary.totalSTCG ?? 0;
  const totalLTCG = summary.totalLTCG ?? 0;

  // Current bucket tax — computed via shared utility
  const currentBucketGain = isSTCG ? totalSTCG : totalLTCG;
  const currentBucketTax = isSTCG ? computeTax(totalSTCG, 0) : computeTax(0, totalLTCG);

  // Post-harvest bucket tax — same utility with harvested gain
  const effectiveGainAfter = Math.max(0, currentBucketGain - totalHarvestableLoss);
  const taxAfterHarvest = isSTCG
    ? computeTax(effectiveGainAfter, 0)
    : computeTax(0, effectiveGainAfter);

  const actualSavings = currentBucketTax - taxAfterHarvest;

  // Insight logic
  const lossNeeded = isSTCG ? Math.max(0, totalSTCG) : Math.max(0, totalLTCG - LTCG_EXEMPTION);

  const lossUsed = Math.min(totalHarvestableLoss, lossNeeded);
  const hasExcess = lossNeeded > 0 && totalHarvestableLoss > lossNeeded;
  const isInsufficient =
    lossNeeded > 0 && totalHarvestableLoss > 0 && totalHarvestableLoss < lossNeeded;
  const taxAfterStr = formatCurrency(taxAfterHarvest);

  let insightText = null;
  if (hasExcess) {
    insightText = `Only ${formatCurrency(lossUsed)} of your ${formatCurrency(totalHarvestableLoss)} ${bucket} losses are needed to fully offset your ${formatCurrency(currentBucketTax)} ${bucket} tax.`;
  } else if (isInsufficient) {
    insightText = `${bucket} losses can reduce ${bucket} tax from ${formatCurrency(currentBucketTax)} to ${taxAfterStr} — not enough to wipe it out.`;
  }

  const harvestLabel = hasExcess ? 'After Optimal Harvest' : 'After Full Harvest';
  const harvestSubtitle = hasExcess
    ? `Save ${formatCurrency(actualSavings)} • Selective harvest sufficient`
    : `Save ${formatCurrency(actualSavings)}`;

  const rateNote = isSTCG
    ? `${formatCurrency(currentBucketGain)} × ${STCG_RATE * 100}%`
    : `${formatCurrency(totalLTCG)} × ${LTCG_RATE * 100}% (above ₹1.25L)`;

  const metrics = [
    { label: `${bucket} Gain This FY`, value: formatCurrency(currentBucketGain) },
    { label: `${bucket} Tax`, value: formatCurrency(currentBucketTax) },
    { label: `Harvestable ${bucket} Losses`, value: formatCurrency(totalHarvestableLoss) },
    { label: 'Potential Tax Saving', value: formatCurrency(potentialTaxSavings) },
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

      {/* Insight card — only when there's tax to save */}
      {currentBucketTax > 0 && potentialTaxSavings > 0 && (
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex flex-col gap-3">
              {insightText && (
                <div className="flex items-start gap-2">
                  <span className="inline-flex shrink-0 items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                    💡 Insight
                  </span>
                  <span className="text-sm text-muted-foreground">{insightText}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{bucket} Gain</span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(currentBucketGain)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{bucket} Tax</span>
                  <span className="text-sm font-semibold tabular-nums text-danger">
                    {formatCurrency(currentBucketTax)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{rateNote}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Current {bucket} Tax</span>
                  <span className="text-sm font-semibold tabular-nums text-danger">
                    {formatCurrency(currentBucketTax)}
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
