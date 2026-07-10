// Tier 2 — Prop-Based Component
import { formatCurrency } from '@/shared/utils/format';

/**
 * AssetPriceCell
 *
 * Renders a table cell showing the current price and 1D change delta.
 * Color is green for non-negative change, red for negative.
 * Intended for use as a TanStack Table column cell renderer.
 *
 * @param {object} props
 * @param {number} props.currentPrice   - Live price in INR
 * @param {number} props.change         - Absolute 1D price change in INR
 * @param {number} props.changePercent  - 1D change as a decimal percentage (e.g. 1.23 = +1.23%)
 */
export const AssetPriceCell = ({ currentPrice, change, changePercent }) => {
  const isPositive = (change ?? 0) >= 0;
  const colorClass = isPositive ? 'text-success' : 'text-danger';
  const sign = isPositive ? '+' : '';

  return (
    <div className="text-right">
      <p className={`tabular-nums text-sm font-semibold ${colorClass}`}>
        {formatCurrency(currentPrice ?? 0)}
      </p>
      <p className={`tabular-nums text-xs ${colorClass}`}>
        {sign}
        {formatCurrency(change ?? 0)} ({sign}
        {(changePercent ?? 0).toFixed(2)}%)
      </p>
    </div>
  );
};

export default AssetPriceCell;
