import { Button } from '@/shared/ui/button';
import { formatCurrency } from '@/shared/utils/format';

/**
 * WhatIfPanel — Sticky bottom panel showing What-If simulation results.
 * Only visible when opportunities are selected.
 */
export const WhatIfPanel = ({
  selectedLossesTotal,
  currentFYGain,
  postHarvestGain,
  taxBefore,
  taxAfter,
  netSavings,
  onReset,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface shadow-[0_-4px_12px_rgba(0,0,0,0.25)]">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:flex lg:gap-6">
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

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outline" size="sm" onClick={onReset}>
              Reset Selection
            </Button>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-2 text-xs text-muted-foreground">
          This is a simulation — not real tax advice. Consult a qualified tax advisor before making
          investment decisions.
        </p>
      </div>
    </div>
  );
};

const MetricItem = ({ label, value, tone }) => {
  const toneClass =
    tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-foreground';

  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${toneClass}`}>{value}</span>
    </div>
  );
};

export default WhatIfPanel;
