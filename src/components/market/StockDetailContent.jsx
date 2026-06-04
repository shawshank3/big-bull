import { useLocation, useParams } from 'react-router-dom';
import { PageHeader } from '../layout/PageHeader';
import { useGetStockQuoteQuery } from '../../api/apiSlice';
import { MARKET_ASSET_LABELS } from '../../constants/market';
import { MarketQuoteCard } from './MarketQuoteCard';

export const StockDetailContent = () => {
  const { symbol } = useParams();
  const location = useLocation();
  const displayName = location.state?.name || symbol;
  const { data: quote, isLoading, isError } = useGetStockQuoteQuery(symbol, {
    skip: !symbol,
  });

  return (
    <>
      <PageHeader
        title={displayName}
        description={`${MARKET_ASSET_LABELS.stock} · ${symbol}`}
      />

      <MarketQuoteCard quote={quote} isLoading={isLoading} isError={isError}>
        <MarketQuoteCard.Loading />
        <MarketQuoteCard.Error />
        <MarketQuoteCard.Empty />
        <MarketQuoteCard.Data>
          <MarketQuoteCard.Header title={displayName} subtitle={symbol} />
          <MarketQuoteCard.Content>
            <MarketQuoteCard.Price
              value={quote?.price}
              currency={quote?.currency}
              label={quote?.priceLabel}
            />
            <MarketQuoteCard.AsOf date={quote?.asOf} />
            <MarketQuoteCard.Notice>
              Charts, history, and additional metrics will appear here in a future update.
            </MarketQuoteCard.Notice>
          </MarketQuoteCard.Content>
        </MarketQuoteCard.Data>
      </MarketQuoteCard>
    </>
  );
};

export default StockDetailContent;
