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

      <MarketQuoteCard
        title={title}
        subtitle={subtitle}
        quote={quote}
        isLoading={isLoading}
        isError={isError}
        emptyMessage="NAV data is not available for this scheme."
      />
    </>
  );
};

export default MutualDetailContent;
