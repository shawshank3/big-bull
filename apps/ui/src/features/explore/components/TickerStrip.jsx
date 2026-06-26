import { memo } from 'react';
import { useGetTickerQuotesQuery } from '@/features/market';
import { TICKER_ITEMS } from '../constants';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/shared/utils/format';

const TickerItem = memo(({ item, isLive }) => (
  <>
    <span className="inline-flex shrink-0 items-center gap-2 text-xs font-medium">
      <span className="font-semibold text-foreground tracking-wide">{item.label}</span>
      {isLive && item.price != null && (
        <span className="text-muted">{formatCurrency(item.price)}</span>
      )}
      <span className={cn('font-medium tabular-nums', item.up ? 'text-success' : 'text-danger')}>
        {item.changePercent ?? item.change}
      </span>
    </span>
    <span
      className="inline-flex shrink-0 items-center px-4 text-border text-xs select-none"
      aria-hidden="true"
    >
      •
    </span>
  </>
));

/**
 * A single scrolling track. Two identical tracks are rendered side-by-side;
 * each translates from 0 → -100% of its own width, creating a seamless loop.
 * Because each track translates by exactly its own content width, the second
 * track fills the gap left by the first — no jump/flicker on reset.
 */
const TickerTrack = memo(({ items, isLive }) => (
  <div className="flex shrink-0 animate-ticker-track will-change-transform">
    {items.map((item, i) => (
      <TickerItem key={i} item={item} isLive={isLive} />
    ))}
  </div>
));

export const TickerStrip = () => {
  const { data: liveItems, isSuccess } = useGetTickerQuotesQuery();
  const isLive = isSuccess && liveItems?.length > 0;
  const items = isLive ? liveItems : TICKER_ITEMS;

  return (
    <div
      className={cn(
        'border-y border-border bg-surface py-2.5 overflow-hidden relative left-1/2 right-1/2 w-[100vw] -ml-[50vw] -mr-[50vw]'
      )}
    >
      {/* Two identical tracks — when the first scrolls fully left, the second
          occupies the exact starting position, creating an infinite seamless loop. */}
      <div className="flex whitespace-nowrap">
        <TickerTrack items={items} isLive={isLive} />
        <TickerTrack items={items} isLive={isLive} />
      </div>
    </div>
  );
};

export default TickerStrip;
