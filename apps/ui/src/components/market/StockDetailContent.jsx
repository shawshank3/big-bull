/**
 * StockDetailContent
 * Shows the current simulated price of a stock and an inline BUY/SELL order form.
 * Resolves the asset _id via GET /api/v1/market/assets/:ticker so the order form
 * always works regardless of whether navigation state included assetId.
 */
import { useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PageHeader } from '../layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert } from '../common';
import { Spinner } from '../ui/spinner';
import { useGetStockQuoteQuery, useGetAssetByTickerQuery } from '../../api/marketApi';
import { MARKET_ASSET_LABELS } from '../../constants/market';
import { MarketQuoteCard } from './MarketQuoteCard';
import { OrderForm } from './OrderForm';

const fmt = (n, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);

const PriceChange = ({ change, changePercent }) => {
  if (change == null) return null;
  const up = change >= 0;
  return (
    <span className={['text-sm font-semibold tabular-nums', up ? 'text-success' : 'text-danger'].join(' ')}>
      {up ? '▲' : '▼'} {fmt(Math.abs(change))} ({changePercent})
    </span>
  );
};

export const StockDetailContent = () => {
  const { symbol } = useParams();                     // plain NSE ticker from URL
  const location = useLocation();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const displayName = location.state?.name || symbol;

  // Use plain NSE ticker — server now resolves quotes from the Asset catalog / Redis
  const quoteSymbol = symbol;

  const { data: quote, isLoading, isError } = useGetStockQuoteQuery(quoteSymbol, {
    skip: !symbol,
    pollingInterval: 30000,
  });

  // Catalog lookup uses the plain NSE ticker stored in our Asset collection
  const { data: asset } = useGetAssetByTickerQuery(symbol, { skip: !symbol });

  return (
    <>
      <PageHeader
        title={displayName}
        description={`${MARKET_ASSET_LABELS.stock} · ${symbol}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* ── Left: price card ── */}
        <MarketQuoteCard quote={quote} isLoading={isLoading} isError={isError}>
          <MarketQuoteCard.Loading />
          <MarketQuoteCard.Error />
          <MarketQuoteCard.Empty />
          <MarketQuoteCard.Data>
            <MarketQuoteCard.Header title={displayName} subtitle={symbol} />
            <MarketQuoteCard.Content>
              <MarketQuoteCard.Price
                value={quote?.price}
                currency={quote?.currency ?? 'INR'}
                label={quote?.priceLabel}
              />
              <PriceChange change={quote?.change} changePercent={quote?.changePercent} />
              <MarketQuoteCard.AsOf date={quote?.asOf} />
            </MarketQuoteCard.Content>
          </MarketQuoteCard.Data>
        </MarketQuoteCard>

        {/* ── Right: order form ── */}
        {isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Place Order</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && <Spinner label="Loading price…" />}
              {isError && <Alert variant="danger">Price unavailable — cannot place order.</Alert>}
              {!isLoading && !isError && !asset && (
                <Alert variant="warning">
                  {symbol} is not in the simulation catalog. Only seeded Indian stocks are tradeable.
                </Alert>
              )}
              {!isLoading && !isError && asset && (
                <OrderForm
                  asset={{ ...asset, ticker: symbol }}
                  currentPrice={quote?.price ?? asset?.basePrice}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default StockDetailContent;
