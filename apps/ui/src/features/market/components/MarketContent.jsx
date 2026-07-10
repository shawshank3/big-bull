import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/shared/layout/PageHeader';
import { Card, CardContent } from '@/shared/components/card';
import { Badge } from '@/shared/ui/badge';
import { Spinner } from '@/shared/ui/spinner';
import { Alert } from '@/shared/ui/alert';
import { ServerDataTable } from '@/shared/ui/server-data-table';
import { humanize } from '@/shared/utils/format';
import { ASSET_TYPES } from '@/shared/constants/assetTypes';
import { useInfiniteAssets } from '../hooks/useInfiniteAssets';
import { buildStockDetailPath, buildMutualDetailPath, MARKET_LIST_TABS } from '../constants/market';
import { AssetTypeTabBar } from './AssetTypeTabBar';
import { AssetPriceCell } from './AssetPriceCell';

/** Column definitions — defined at module scope so the array reference is stable. */
const columns = [
  {
    accessorKey: 'ticker',
    header: 'Asset',
    cell: ({ row }) => (
      <div>
        <p className="font-semibold text-sm">{row.original.ticker}</p>
        <p className="text-xs text-muted truncate max-w-[200px]">{row.original.name}</p>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'assetType',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant={row.original.assetType === ASSET_TYPES.STOCK ? 'warning' : 'info'}>
        {row.original.assetType === ASSET_TYPES.STOCK ? 'NSE' : 'MF'}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'sector',
    header: 'Sector',
    cell: ({ getValue }) => <span className="text-sm text-muted">{humanize(getValue())}</span>,
    enableSorting: true,
  },
  {
    accessorKey: 'currentPrice',
    header: 'Price / 1D Change',
    cell: ({ row }) => (
      <AssetPriceCell
        currentPrice={row.original.currentPrice}
        change={row.original.change}
        changePercent={row.original.changePercent}
      />
    ),
    meta: { className: 'text-right' },
    enableSorting: false,
  },
];

export const MarketContent = () => {
  const navigate = useNavigate();

  const {
    allAssets,
    total,
    hasNextPage,
    isLoading,
    isFetching,
    isError,
    activeType,
    search,
    sentinelRef,
    handleTabChange,
    handleSearchChange,
    handleSortChange,
  } = useInfiniteAssets();

  // Stable reference — columns array is already module-level, useMemo guards
  // against future accidental inline redefinitions.
  const tableColumns = useMemo(() => columns, []);

  const handleRowClick = (asset) => {
    if (asset.assetType === ASSET_TYPES.STOCK) {
      navigate(buildStockDetailPath(asset.ticker), {
        state: { name: asset.name, assetId: asset.id },
      });
    } else {
      navigate(buildMutualDetailPath(asset.ticker), {
        state: { name: asset.name, assetId: asset.id },
      });
    }
  };

  const showEmptyState = !isFetching && !isLoading && allAssets.length === 0 && !search;

  return (
    <>
      <PageHeader
        title="Market"
        description="Browse and trade simulated Indian stocks and mutual funds."
      />

      <AssetTypeTabBar
        tabs={MARKET_LIST_TABS}
        activeValue={activeType}
        onChange={handleTabChange}
      />

      {isError && <Alert variant="danger">Unable to load assets right now.</Alert>}

      {isLoading && allAssets.length === 0 ? (
        <Spinner label="Loading market…" />
      ) : showEmptyState ? (
        <Card>
          <CardContent className="py-16 text-center text-muted">
            No assets found. Run the seed script to populate the market catalog.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ServerDataTable
              columns={tableColumns}
              data={allAssets}
              onSearchChange={handleSearchChange}
              onSortChange={handleSortChange}
              searchPlaceholder="Search by ticker, name, or sector…"
              onRowClick={handleRowClick}
              isLoading={isLoading && allAssets.length === 0}
              showPagination={false}
            />

            {/* Sentinel — ref callback attaches the IntersectionObserver here.
                Rendered only when there are more pages to load. */}
            {hasNextPage && (
              <div ref={sentinelRef} className="flex justify-center py-3 min-h-[40px]">
                {isFetching && <Spinner label="Loading more…" />}
              </div>
            )}

            {/* End-of-list indicator */}
            {!hasNextPage && allAssets.length > 0 && (
              <p className="text-center text-xs text-muted py-3">All {total} assets loaded</p>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default MarketContent;
