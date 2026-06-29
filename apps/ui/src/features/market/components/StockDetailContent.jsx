import { useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/features/auth';
import { Alert } from '@/shared/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/card';
import { Spinner } from '@/shared/ui/spinner';
import { formatCurrency } from '@/shared/utils';
import { useGetStockQuoteQuery, useGetAssetByTickerQuery } from '../api/marketApi';
import { MARKET_ASSET_LABELS } from '../constants/market';
import { OrderForm } from './OrderForm';
import { PriceChart } from './PriceChart';
import { AssetTransactionsTable } from '@/features/transaction';

// ─── Chart header slot ────────────────────────────────────────────────────────

/**
 * Renders the price headline beside the chart. The +/- shown next to the
 * live price reflects the chart's baseline (previous-day close on 1D, the
 * close from N days ago on multi-day ranges). When the chart is still loading
 * a baseline, we fall back to no delta rather than display a stale tick-level
 * value that contradicts the chart.
 */
const ChartHeader = ({ name, symbol, assetLabel, price, currency, delta }) => {
  const up = delta != null && delta.up;
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
          {delta && (
            <span
              className={[
                'text-sm font-semibold tabular-nums',
                up ? 'text-success' : delta.delta === 0 ? 'text-muted' : 'text-danger',
              ].join(' ')}
            >
              {up ? '▲' : delta.delta === 0 ? '•' : '▼'}{' '}
              {formatCurrency(Math.abs(delta.delta), currency ?? 'INR')} ({up ? '+' : ''}
              {delta.pct.toFixed(2)}%)
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
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const {
    data: quote,
    isLoading: quoteLoading,
    isError: quoteError,
  } = useGetStockQuoteQuery(symbol, { skip: !symbol });
  const { data: asset } = useGetAssetByTickerQuery(symbol, { skip: !symbol });

  const displayName = quote?.name || asset?.name || symbol;

  const chartHeader = ({ delta }) => (
    <ChartHeader
      name={displayName}
      symbol={quote?.symbol || asset?.ticker || symbol}
      assetLabel={MARKET_ASSET_LABELS.stock}
      price={quote?.price ?? asset?.basePrice}
      currency={quote?.currency}
      delta={delta}
    />
  );

  return (
    <div className="flex flex-col gap-6">
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

      {/* ── Transactions table (full width, auth-gated) ── */}
      {isAuthenticated && asset && (
        <AssetTransactionsTable assetId={asset.id ?? asset._id} assetType="STOCK" />
      )}
    </div>
  );
};

export default StockDetailContent;
