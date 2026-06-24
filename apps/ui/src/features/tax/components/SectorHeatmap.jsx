import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/card';
import { formatCurrency } from '@/shared/utils';
import { groupBySector, getLossIntensity } from '../utils/taxFormatters';

const HeatmapTile = ({ sector, data, maxLoss }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const intensity = getLossIntensity(data.totalLoss, maxLoss);

  return (
    <div
      className="relative flex min-h-[100px] cursor-default flex-col items-center justify-center rounded-xl border border-border p-4 text-center transition-transform hover:scale-105"
      style={{ backgroundColor: `rgba(239, 68, 68, ${intensity})` }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
      role="button"
      aria-label={`${sector}: ${formatCurrency(data.totalLoss)} loss across ${data.count} holdings`}
    >
      <span className="text-sm font-semibold text-white drop-shadow-sm">{sector}</span>
      <span className="mt-1 text-xs text-white/80 drop-shadow-sm">
        {formatCurrency(data.totalLoss)}
      </span>

      {showTooltip && (
        <div className="absolute -top-2 left-1/2 z-10 w-52 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-surface p-3 shadow-soft">
          <p className="text-sm font-bold text-foreground">{sector}</p>
          <p className="text-xs text-muted">Total Loss: {formatCurrency(data.totalLoss)}</p>
          <p className="text-xs text-muted">Holdings: {data.count}</p>
          {data.topLoser && (
            <p className="text-xs text-muted">
              Top Loser: {data.topLoser.name || data.topLoser.ticker}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export const SectorHeatmap = ({ opportunities = [] }) => {
  const bySector = groupBySector(opportunities);
  const sectors = Object.entries(bySector);

  if (sectors.length === 0) {
    return null;
  }

  const maxLoss = Math.max(...sectors.map(([, data]) => data.totalLoss));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sector Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {sectors.map(([sector, data]) => (
            <HeatmapTile key={sector} sector={sector} data={data} maxLoss={maxLoss} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SectorHeatmap;
