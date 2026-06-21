import { useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Alert } from '@/shared/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Spinner } from '@/shared/ui/spinner';
import { formatCurrency } from '@/shared/utils';
import { useGetStockQuoteQuery, useGetAssetByTickerQuery } from '../api/marketApi';
import { MARKET_ASSET_LABELS } from '../constants/market';
import { OrderForm } from './OrderForm';
import { PriceChart, DeltaBadge } from './PriceChart';

// ─── Chart header slot ────────────────────────────────────────────────────────

const ChartHeader = ({ name, symbol, assetLabel, price, currency, change, changePercent }) => {
  const up = change != null && change >= 0;
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <p className="text-xs text-muted truncate">
        {assetLabel} · {symbol}
      </p>
      <h1 className="text-lg font-bold leading-tight truncate">{name}</h1>
      {price != null && (
        <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
          <span className="text-2xl font-black tabular-nums tracking-tight">
            {formatCurrency(price, currency ?? 'INR')}
          </span>
          {change != null && (
            <span
              className={[
                'text-sm font-semibold tabular-nums',
                up ? 'text-success' : 'text-danger',
              ].join(' ')}
            >
              {up ? '▲' : '▼'} {formatCurrency(Math.abs(change))} ({changePercent})
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export const StockDetailContent = () => {
  const { symbol } = useParams();
  const location = useLocation();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const displayName = location.state?.name || symbol;

  const {
    data: quote,
    isLoading: quoteLoading,
    isError: quoteError,
  } = useGetStockQuoteQuery(symbol, { skip: !symbol, pollingInterval: 60000 });
  const { data: asset } = useGetAssetByTickerQuery(symbol, { skip: !symbol });

  const chartHeader = (
    <ChartHeader
      name={displayName}
      symbol={symbol}
      assetLabel={MARKET_ASSET_LABELS.stock}
      price={quote?.price ?? asset?.basePrice}
      currency={quote?.currency}
      change={quote?.change}
      changePercent={quote?.changePercent}
    />
  );

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* ── Left: chart (expands to fill) ── */}
      <div className="flex-1 min-w-0">
        {symbol && (
          <PriceChart
            ticker={symbol}
            assetType="STOCK"
            currentPrice={quote?.price ?? asset?.basePrice}
            header={chartHeader}
          />
        )}
      </div>

      {/* ── Right: order form card (fixed width, auth-gated) ── */}
      {isAuthenticated && (
        <aside className="w-full lg:w-80 shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Place Order</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {quoteLoading && <Spinner label="Loading price…" />}
              {quoteError && (
                <Alert variant="danger">Price unavailable — cannot place order.</Alert>
              )}
              {!quoteLoading && !quoteError && !asset && (
                <Alert variant="warning">{symbol} is not in the simulation catalog.</Alert>
              )}
              {!quoteLoading && !quoteError && asset && (
                <OrderForm
                  asset={{ ...asset, ticker: symbol }}
                  currentPrice={quote?.price ?? asset?.basePrice}
                />
              )}
            </CardContent>
          </Card>
        </aside>
      )}
    </div>
  );
};

export default StockDetailContent;
