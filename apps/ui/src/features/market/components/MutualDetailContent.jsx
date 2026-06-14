import { useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PageHeader } from '@/shared/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Alert } from '@/shared/ui/alert';
import { Spinner } from '@/shared/ui/spinner';
import { useGetMutualQuoteQuery, useGetAssetByTickerQuery } from '../api/marketApi';
import { MARKET_ASSET_LABELS } from '../constants/market';
import { MarketQuoteCard } from './MarketQuoteCard';
import { OrderForm } from './OrderForm';

export const MutualDetailContent = () => {
  const { schemeCode } = useParams();
  const location = useLocation();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const displayName = location.state?.name;
  const {
    data: quote,
    isLoading,
    isError,
  } = useGetMutualQuoteQuery(schemeCode, { skip: !schemeCode, pollingInterval: 30000 });
  const { data: asset } = useGetAssetByTickerQuery(schemeCode, { skip: !schemeCode });
  const title = displayName || quote?.name || `Scheme ${schemeCode}`;
  const subtitle = [MARKET_ASSET_LABELS.mutual, quote?.fundHouse, quote?.schemeCategory]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <PageHeader title={title} description={subtitle || `Scheme ${schemeCode}`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
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
            </MarketQuoteCard.Content>
          </MarketQuoteCard.Data>
        </MarketQuoteCard>
        {isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Place Order</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && <Spinner label="Loading NAV…" />}
              {isError && <Alert variant="danger">NAV unavailable — cannot place order.</Alert>}
              {!isLoading && !isError && !asset && (
                <Alert variant="warning">
                  Scheme {schemeCode} is not in the simulation catalog.
                </Alert>
              )}
              {!isLoading && !isError && asset && (
                <OrderForm
                  asset={{ ...asset, ticker: schemeCode }}
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

export default MutualDetailContent;
