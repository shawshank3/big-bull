import { useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PageHeader } from '@/shared/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Alert } from '@/shared/ui/alert';
import { Spinner } from '@/shared/ui/spinner';
import { useGetStockQuoteQuery, useGetAssetByTickerQuery } from '../api/marketApi';
import { MARKET_ASSET_LABELS } from '../constants/market';
import { MarketQuoteCard } from './MarketQuoteCard';
import { OrderForm } from './OrderForm';

const fmt = (n, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(
    n
  );

const PriceChange = ({ change, changePercent }) => {
  if (change == null) return null;
  const up = change >= 0;
  return (
    <span
      className={['text-sm font-semibold tabular-nums', up ? 'text-success' : 'text-danger'].join(
        ' '
      )}
    >
      {up ? '▲' : '▼'} {fmt(Math.abs(change))} ({changePercent})
    </span>
  );
};

export const StockDetailContent = () => {
  const { symbol } = useParams();
  const location = useLocation();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const displayName = location.state?.name || symbol;
  const {
    data: quote,
    isLoading,
    isError,
  } = useGetStockQuoteQuery(symbol, { skip: !symbol, pollingInterval: 60000 });
  const { data: asset } = useGetAssetByTickerQuery(symbol, { skip: !symbol });

  return (
    <>
      <PageHeader title={displayName} description={`${MARKET_ASSET_LABELS.stock} · ${symbol}`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
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
        {isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Place Order</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && <Spinner label="Loading price…" />}
              {isError && <Alert variant="danger">Price unavailable — cannot place order.</Alert>}
              {!isLoading && !isError && !asset && (
                <Alert variant="warning">{symbol} is not in the simulation catalog.</Alert>
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
