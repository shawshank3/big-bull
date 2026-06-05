import { useLocation, useParams } from 'react-router-dom';
import { PageHeader } from '../layout/PageHeader';
import { useGetMutualQuoteQuery } from '../../api/apiSlice';
import { MARKET_ASSET_LABELS } from '../../constants/market';
import { MarketQuoteCard } from './MarketQuoteCard';

export const MutualDetailContent = () => {
  const { schemeCode } = useParams();
  const location = useLocation();
  const displayName = location.state?.name;
  const { data: quote, isLoading, isError } = useGetMutualQuoteQuery(schemeCode, {
    skip: !schemeCode,
  });
  
  const title = displayName || quote?.name || `Scheme ${schemeCode}`;
  const subtitle = [
    MARKET_ASSET_LABELS.mutual,
    quote?.fundHouse,
    quote?.schemeCategory,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <PageHeader title={title} description={subtitle || `Scheme ${schemeCode}`} />

      <MarketQuoteCard quote={quote} isLoading={isLoading} isError={isError}>
        <MarketQuoteCard.Loading />
        <MarketQuoteCard.Error />
        <MarketQuoteCard.Empty>NAV data is not available for this scheme.</MarketQuoteCard.Empty>
        <MarketQuoteCard.Data>
          <MarketQuoteCard.Header title={title} subtitle={subtitle} />
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

export default MutualDetailContent;
