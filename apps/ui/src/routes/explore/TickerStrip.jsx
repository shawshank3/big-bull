import { useGetTickerQuotesQuery } from '../../api/marketApi';
import { TICKER_ITEMS } from './constants';
import { cn } from '../../lib/utils';

const TickerItem = ({ item, isLive }) => (
  <>
    <span className="inline-flex shrink-0 items-center gap-2 text-xs font-medium">
      {/* Symbol */}
      <span className="font-semibold text-foreground tracking-wide">{item.label}</span>

      {/* Price — only shown when live data is available */}
      {isLive && item.price != null && (
        <span className="text-muted">
          ₹
          {Number(item.price).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      )}

      {/* Change % */}
      <span className={cn('font-medium tabular-nums', item.up ? 'text-success' : 'text-danger')}>
        {item.changePercent ?? item.change}
      </span>
    </span>

    {/* Dot divider — sits between items, not inside them */}
    <span
      className="inline-flex shrink-0 items-center px-4 text-border text-xs select-none"
      aria-hidden="true"
    >
      •
    </span>
  </>
);

/**
 * Full-width scrolling ticker strip.
 * - Breaks out of the page's horizontal padding using a viewport-width trick.
 * - Continuously scrolls (CSS animation, no pause).
 * - Shows live data from the API; falls back to static while the cache warms up.
 */
export const TickerStrip = () => {
  const { data: liveItems, isSuccess } = useGetTickerQuotesQuery(undefined, {
    pollingInterval: 5 * 60_000,
  });

  const isLive = isSuccess && liveItems?.length > 0;
  const items = isLive ? liveItems : TICKER_ITEMS;

  // Duplicate enough times to guarantee seamless looping at any viewport width.
  // 4 copies ensures the strip never looks empty even on very wide screens.
  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div
      className={cn(
        'border-y border-border bg-surface py-2.5 overflow-hidden relative left-1/2 right-1/2 w-[100vw] -ml-[50vw] -mr-[50vw]'
      )}
    >
      <div className="flex animate-ticker whitespace-nowrap will-change-transform">
        {repeated.map((item, i) => (
          <TickerItem key={i} item={item} isLive={isLive} />
        ))}
      </div>
    </div>
  );
};

export default TickerStrip;
