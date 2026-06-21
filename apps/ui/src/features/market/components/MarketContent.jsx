import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/shared/layout/PageHeader';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Spinner } from '@/shared/ui/spinner';
import { Alert } from '@/shared/ui/alert';
import { useGetAssetsQuery } from '../api/marketApi';
import { buildStockDetailPath, buildMutualDetailPath } from '../constants/market';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n ?? 0);

const TABS = [
  { label: 'All', value: '' },
  { label: 'Stocks', value: 'STOCK' },
  { label: 'Mutual Funds', value: 'MUTUAL_FUND' },
];

const AssetRow = ({ asset, onClick }) => (
  <tr
    className="border-b border-border last:border-0 hover:bg-muted/5 cursor-pointer transition-colors"
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick()}
  >
    <td className="py-3 pl-6 pr-4">
      <p className="font-semibold text-sm">{asset.ticker}</p>
      <p className="text-xs text-muted truncate max-w-[200px]">{asset.name}</p>
    </td>
    <td className="py-3 pr-4">
      <Badge variant={asset.assetType === 'STOCK' ? 'warning' : 'info'}>
        {asset.assetType === 'STOCK' ? 'NSE' : 'MF'}
      </Badge>
    </td>
    <td className="py-3 pr-4 text-sm text-muted">{asset.sector?.replace(/_/g, ' ')}</td>
    <td className="py-3 pr-6 tabular-nums text-right text-sm font-semibold">
      {fmt(asset.currentPrice)}
    </td>
  </tr>
);

export const MarketContent = () => {
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState('');
  const {
    data: assets = [],
    isLoading,
    isError,
  } = useGetAssetsQuery(activeType ? { type: activeType } : undefined, { pollingInterval: 60000 });

  const handleRowClick = (asset) => {
    if (asset.assetType === 'STOCK')
      navigate(buildStockDetailPath(asset.ticker), {
        state: { name: asset.name, assetId: asset.id },
      });
    else
      navigate(buildMutualDetailPath(asset.ticker), {
        state: { name: asset.name, assetId: asset.id },
      });
  };

  return (
    <>
      <PageHeader
        title="Market"
        description="Browse and trade simulated Indian stocks and mutual funds."
      />
      <div className="flex gap-2 border-b border-border pb-0 mb-6">
        {TABS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveType(value)}
            className={[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeType === value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>
      {isError && <Alert variant="danger">Unable to load assets right now.</Alert>}
      {isLoading ? (
        <Spinner label="Loading market…" />
      ) : assets.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted">
            No assets found. Run the seed script to populate the market catalog.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted text-xs uppercase tracking-wide">
                  <th className="py-3 pl-6 pr-4 text-left font-medium">Asset</th>
                  <th className="py-3 pr-4 text-left font-medium">Type</th>
                  <th className="py-3 pr-4 text-left font-medium">Sector</th>
                  <th className="py-3 pr-6 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <AssetRow key={asset.id} asset={asset} onClick={() => handleRowClick(asset)} />
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default MarketContent;
