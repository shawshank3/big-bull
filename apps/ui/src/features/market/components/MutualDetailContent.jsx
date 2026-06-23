import { useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Alert } from '@/shared/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/card';
import { Spinner } from '@/shared/ui/spinner';
import { formatCurrency } from '@/shared/utils';
import { useGetMutualQuoteQuery, useGetAssetByTickerQuery } from '../api/marketApi';
import { MARKET_ASSET_LABELS } from '../constants/market';
import { OrderForm } from './OrderForm';
import { PriceChart } from './PriceChart';
import { AssetTransactionsTable } from '@/features/transaction/components/AssetTransactionsTable';

// ─── Chart header slot ────────────────────────────────────────────────────────

const ChartHeader = ({ name, schemeCode, subtitle, price, currency, asOf }) => (
  <div className="flex flex-col gap-0.5 min-w-0">
    <p className="text-xs text-muted truncate">{subtitle}</p>
    <h1 className="text-lg font-bold leading-tight truncate">{name}</h1>
    {price != null && (
      <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
        <span className="text-2xl font-black tabular-nums tracking-tight">
          {formatCurrency(price, currency ?? 'INR')}
        </span>
        {asOf && <span className="text-xs text-muted">{asOf}</span>}
      </div>
    )}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const MutualDetailContent = () => {
  const { schemeCode } = useParams();
  const location = useLocation();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const displayName = location.state?.name;

  const {
    data: quote,
    isLoading: quoteLoading,
    isError: quoteError,
  } = useGetMutualQuoteQuery(schemeCode, { skip: !schemeCode });
  const { data: asset } = useGetAssetByTickerQuery(schemeCode, { skip: !schemeCode });

  const title = displayName || quote?.name || `Scheme ${schemeCode}`;
  const subtitle = [MARKET_ASSET_LABELS.mutual, quote?.fundHouse, quote?.schemeCategory]
    .filter(Boolean)
    .join(' · ');

  const chartHeader = (
    <ChartHeader
      name={title}
      schemeCode={schemeCode}
      subtitle={subtitle || MARKET_ASSET_LABELS.mutual}
      price={quote?.price ?? asset?.basePrice}
      currency={quote?.currency}
      asOf={quote?.asOf}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* ── Left: chart (expands to fill) ── */}
        <div className="flex-1 min-w-0">
          {schemeCode && (
            <PriceChart
              ticker={schemeCode}
              assetType="MUTUAL_FUND"
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
                {quoteLoading && <Spinner label="Loading NAV…" />}
                {quoteError && (
                  <Alert variant="danger">NAV unavailable — cannot place order.</Alert>
                )}
                {!quoteLoading && !quoteError && !asset && (
                  <Alert variant="warning">
                    Scheme {schemeCode} is not in the simulation catalog.
                  </Alert>
                )}
                {!quoteLoading && !quoteError && asset && (
                  <OrderForm
                    asset={{ ...asset, ticker: schemeCode }}
                    currentPrice={quote?.price ?? asset?.basePrice}
                  />
                )}
              </CardContent>
            </Card>
          </aside>
        )}
      </div>

      {/* ── Transactions table (full width, auth-gated) ── */}
      {isAuthenticated && asset && <AssetTransactionsTable assetId={asset.id ?? asset._id} />}
    </div>
  );
};

export default MutualDetailContent;
