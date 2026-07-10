// Tier 2 — Prop-Based Component
import { Card, CardContent } from '@/shared/components/card';
import { Badge } from '@/shared/ui/badge';
import { formatCurrency } from '@/shared/utils/format';

/**
 * MoverCard
 *
 * Displays a single market mover (gainer or loser) as a compact card.
 * Purely presentational — no data fetching or navigation logic.
 *
 * @param {object}   props
 * @param {object}   props.asset        - Asset DTO: { id, ticker, name, currentPrice, change, changePercent }
 * @param {'success'|'danger'} props.tone - Visual tone (green for gainers, red for losers)
 * @param {Function} props.onClick      - Called with the asset when the card is clicked
 */
export const MoverCard = ({ asset, tone, onClick }) => {
  const isGain = tone === 'success';
  const colorClass = isGain ? 'text-success' : 'text-danger';
  const sign = isGain ? '+' : '-';
  const pct = asset.changePercent ?? 0;
  const absChange = Math.abs(asset.change ?? 0);

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => onClick(asset)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(asset)}
      aria-label={`${asset.ticker} — ${asset.name}`}
    >
      <CardContent className="p-3 space-y-1.5">
        {/* Header: ticker + percent badge */}
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{asset.ticker}</p>
            <p className="text-xs text-muted truncate max-w-[100px]">{asset.name}</p>
          </div>
          <Badge variant={tone} className="shrink-0 text-xs">
            {isGain ? '+' : ''}
            {Math.abs(pct).toFixed(2)}%
          </Badge>
        </div>

        {/* Current price */}
        <div>
          <p className="text-xs text-muted">Price</p>
          <p className="text-sm font-semibold tabular-nums">
            {formatCurrency(asset.currentPrice ?? 0)}
          </p>
        </div>

        {/* Absolute change */}
        <p className={`text-xs tabular-nums font-medium ${colorClass}`}>
          {sign}
          {formatCurrency(absChange)}
        </p>
      </CardContent>
    </Card>
  );
};

export default MoverCard;
