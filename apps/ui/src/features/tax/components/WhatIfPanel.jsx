import { Button } from '@/shared/ui/button';
import { formatCurrency } from '@/shared/utils/format';

/**
 * WhatIfPanel — in-flow summary panel shown below the opportunities table
 * when one or more rows are selected.
 *
 * Intentionally NOT fixed/sticky: it renders as a normal block element so the
 * footer sits naturally below it and the whole page scrolls without any overlap.
 */
export const WhatIfPanel = ({
  selectedLossesTotal,
  currentFYGain,
  postHarvestGain,
  taxBefore,
  taxAfter,
  netSavings,
  onReset,
}) => (
  <div className="rounded-xl border border-border bg-surface shadow-sm">
    <div className="px-4 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:flex lg:gap-8">
          <MetricItem
            label="Selected Losses"
            value={formatCurrency(selectedLossesTotal)}
            tone="danger"
          />
          <MetricItem label="Current FY Gain" value={formatCurrency(currentFYGain)} />
          <MetricItem label="Post-Harvest Gain" value={formatCurrency(postHarvestGain)} />
          <MetricItem label="Tax Before" value={formatCurrency(taxBefore)} />
          <MetricItem label="Tax After" value={formatCurrency(taxAfter)} />
          <MetricItem label="Net Savings" value={formatCurrency(netSavings)} tone="success" />
        </div>

        {/* Reset action */}
        <div className="shrink-0">
          <Button variant="outline" size="sm" onClick={onReset}>
            Reset Selection
          </Button>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mt-3 text-xs text-muted-foreground">
        This is a simulation — not real tax advice. Consult a qualified tax advisor before making
        investment decisions.
      </p>
    </div>
  </div>
);

const MetricItem = ({ label, value, tone }) => {
  const toneClass =
    tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-foreground';

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${toneClass}`}>{value}</span>
    </div>
  );
};

export default WhatIfPanel;
