import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Spinner } from '@/shared/ui/spinner';
import { useGetMarketMoversQuery } from '@/features/market/api/marketApi';
import { buildStockDetailPath, MARKET_MOVERS_LIMIT } from '@/features/market/constants/market';
import { MoverCard } from './MoverCard';

/**
 * TopMovers — Smart container (Tier: feature-level data-fetching component)
 *
 * Fetches top gainers and top losers from the live market simulation engine
 * and renders them as two 2×2 grids of MoverCard components.
 * Only stocks are shown (mutual funds have no intraday Redis tick data).
 */
export const TopMovers = () => {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useGetMarketMoversQuery(
    { limit: MARKET_MOVERS_LIMIT },
    {
      refetchOnMountOrArgChange: true, // fresh ranked list on every mount (reload or navigate-back)
      pollingInterval: 10000, // re-rank every 10s while dashboard is open
    }
  );

  const gainers = data?.gainers ?? [];
  const losers = data?.losers ?? [];

  if (isLoading) {
    return (
      <div className="mb-6">
        <Spinner label="Loading market movers…" />
      </div>
    );
  }

  if (isError || (gainers.length === 0 && losers.length === 0)) return null;

  const handleCardClick = (asset) => {
    navigate(buildStockDetailPath(asset.ticker), {
      state: { name: asset.name, assetId: asset.id },
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
      {gainers.length > 0 && (
        <MoverSection
          title="Top Gainers"
          icon={<TrendingUp className="h-4 w-4 text-success" aria-hidden />}
          assets={gainers}
          tone="success"
          onCardClick={handleCardClick}
        />
      )}
      {losers.length > 0 && (
        <MoverSection
          title="Top Losers"
          icon={<TrendingDown className="h-4 w-4 text-danger" aria-hidden />}
          assets={losers}
          tone="danger"
          onCardClick={handleCardClick}
        />
      )}
    </div>
  );
};

/**
 * MoverSection — internal layout component.
 * Groups a heading + icon with a 2-column grid of MoverCards.
 * Not exported — only used within TopMovers.
 */
const MoverSection = ({ title, icon, assets, tone, onCardClick }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {assets.map((asset) => (
        <MoverCard key={asset.id ?? asset.ticker} asset={asset} tone={tone} onClick={onCardClick} />
      ))}
    </div>
  </div>
);

export default TopMovers;
