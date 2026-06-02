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

      <MarketQuoteCard
        title={displayName}
        subtitle={symbol}
        quote={quote}
        isLoading={isLoading}
        isError={isError}
      />
    </>
  );
};

export default StockDetailContent;
