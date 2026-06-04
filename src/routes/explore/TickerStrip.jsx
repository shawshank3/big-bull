import { TICKER_ITEMS } from './constants';

export const TickerStrip = () => (
  <div className="-mx-4 overflow-hidden border-y border-border bg-surface py-2 sm:-mx-6 lg:-mx-8">
    <div className="flex animate-[ticker_30s_linear_infinite] whitespace-nowrap will-change-transform">
      {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
        <span key={i} className="mx-6 inline-flex items-center gap-2 text-xs font-medium text-muted">
          <span className="font-semibold text-foreground">{item.label}</span>
          <span className={item.up ? 'text-success' : 'text-danger'}>{item.change}</span>
          <span className="text-border">|</span>
        </span>
      ))}
    </div>
  </div>
);

export default TickerStrip;
