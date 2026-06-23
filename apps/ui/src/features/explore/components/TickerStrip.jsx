import { useMemo, memo } from 'react';
import { useGetTickerQuotesQuery } from '@/features/market/api/marketApi';
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

export const TickerStrip = () => {
  const { data: liveItems, isSuccess } = useGetTickerQuotesQuery(undefined);
  const isLive = isSuccess && liveItems?.length > 0;
  const items = isLive ? liveItems : TICKER_ITEMS;

  // Memoised so the animation container's children don't change identity on
  // every 1s price tick — only rebuilds when the items array reference changes.
  const repeated = useMemo(() => [...items, ...items, ...items, ...items], [items]);

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
