import { Button } from '@/shared/ui/button';
import { formatCurrency } from '@/shared/utils/format';

/**
 * WhatIfPanel
 *
 * In-flow summary panel shown below a harvesting table when one or more
 * rows are selected. Renders bucket-specific before/after tax impact.
 *
 * Used for both STCG and LTCG tabs (bucket prop controls labels).
 */
export const WhatIfPanel = ({
  bucket = 'STCG',
  selectedLossesTotal,
  bucketGain,
  postHarvestGain,
  taxBefore,
  taxAfter,
  netSavings,
  onReset,
}) => {
  const bucketLabel = bucket === 'STCG' ? 'STCG' : 'LTCG';
  const rateNote = bucket === 'STCG' ? '20%' : '12.5% above ₹1.25L';

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:flex lg:gap-8">
            <MetricItem
              label="Selected Losses"
              value={formatCurrency(selectedLossesTotal)}
              tone="danger"
            />
            <MetricItem label={`${bucketLabel} Gain This FY`} value={formatCurrency(bucketGain)} />
            <MetricItem
              label={`Post-Harvest ${bucketLabel}`}
              value={formatCurrency(postHarvestGain)}
            />
            <MetricItem
              label={`${bucketLabel} Tax Before`}
              sublabel={rateNote}
              value={formatCurrency(taxBefore)}
            />
            <MetricItem label={`${bucketLabel} Tax After`} value={formatCurrency(taxAfter)} />
            <MetricItem label="Net Savings" value={formatCurrency(netSavings)} tone="success" />
          </div>

          <div className="shrink-0">
            <Button variant="outline" size="sm" onClick={onReset}>
              Reset Selection
            </Button>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Simulation only — not real tax advice. Consult a qualified tax advisor before making
          investment decisions.
        </p>
      </div>
    </div>
  );
};

/**
 * IntradayWhatIfPanel — same layout but for intraday simulator.
 */
export const IntradayWhatIfPanel = ({
  slabRateLabel,
  selectedLossesTotal,
  currentIntradayGain,
  postHarvestIntraday,
  taxBefore,
  taxAfter,
  netSavings,
  onReset,
}) => (
  <div className="rounded-xl border border-border bg-surface shadow-sm">
    <div className="px-4 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:flex lg:gap-8">
          <MetricItem
            label="Selected Losses"
            value={formatCurrency(selectedLossesTotal)}
            tone="danger"
          />
          <MetricItem label="Intraday Gain This FY" value={formatCurrency(currentIntradayGain)} />
          <MetricItem label="Post-Harvest Intraday" value={formatCurrency(postHarvestIntraday)} />
          <MetricItem
            label={`Intraday Tax Before`}
            sublabel={slabRateLabel}
            value={formatCurrency(taxBefore)}
          />
          <MetricItem label="Intraday Tax After" value={formatCurrency(taxAfter)} />
          <MetricItem label="Net Savings" value={formatCurrency(netSavings)} tone="success" />
        </div>

        <div className="shrink-0">
          <Button variant="outline" size="sm" onClick={onReset}>
            Reset Selection
          </Button>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Simulation only — not real tax advice. Consult a qualified tax advisor before making
        investment decisions.
      </p>
    </div>
  </div>
);

const MetricItem = ({ label, sublabel, value, tone }) => {
  const toneClass =
    tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-foreground';

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {sublabel && <span className="text-[11px] text-muted-foreground/70">{sublabel}</span>}
      <span className={`text-sm font-semibold tabular-nums ${toneClass}`}>{value}</span>
    </div>
  );
};

export default WhatIfPanel;
