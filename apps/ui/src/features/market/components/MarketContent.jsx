import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/shared/layout/PageHeader';
import { Card, CardContent } from '@/shared/components/card';
import { Badge } from '@/shared/ui/badge';
import { Spinner } from '@/shared/ui/spinner';
import { Alert } from '@/shared/ui/alert';
import { ServerDataTable } from '@/shared/ui/server-data-table';
import { formatCurrency, humanize } from '@/shared/utils/format';
import { useListAssetsQuery } from '../api/marketApi';
import { buildStockDetailPath, buildMutualDetailPath } from '../constants/market';
import { ASSET_TYPES } from '@/shared/constants/assetTypes';

const TABS = [
  { label: 'All', value: '' },
  { label: 'Stocks', value: ASSET_TYPES.STOCK },
  { label: 'Mutual Funds', value: ASSET_TYPES.MUTUAL_FUND },
];

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
    header: 'Price',
    cell: ({ getValue }) => (
      <span className="tabular-nums text-sm font-semibold">{formatCurrency(getValue() ?? 0)}</span>
    ),
    meta: { className: 'text-right' },
    enableSorting: false,
  },
];

export const MarketContent = () => {
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState('');

  // Server-side pagination state
  const [paginationParams, setPaginationParams] = useState({ page: 1, limit: 5 });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(undefined);

  const {
    data: listData,
    isLoading,
    isFetching,
    isError,
  } = useListAssetsQuery({
    pagination: paginationParams,
    filters: activeType ? { assetType: activeType } : {},
    search,
    sort,
  });

  const assets = listData?.items ?? [];
  const pagination = listData?.pagination ?? {
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const handleRowClick = (asset) => {
    if (asset.assetType === ASSET_TYPES.STOCK)
      navigate(buildStockDetailPath(asset.ticker), {
        state: { name: asset.name, assetId: asset.id },
      });
    else
      navigate(buildMutualDetailPath(asset.ticker), {
        state: { name: asset.name, assetId: asset.id },
      });
  };

  const tableColumns = useMemo(() => columns, []);

  const handlePaginationChange = useCallback(({ page, limit }) => {
    setPaginationParams({ page, limit });
  }, []);

  const handleSearchChange = useCallback((term) => {
    setSearch(term);
    setPaginationParams((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleSortChange = useCallback((newSort) => {
    setSort(newSort);
  }, []);

  const handleTabChange = useCallback((value) => {
    setActiveType(value);
    setPaginationParams((prev) => ({ ...prev, page: 1 }));
  }, []);

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
            onClick={() => handleTabChange(value)}
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
      {isLoading && assets.length === 0 ? (
        <Spinner label="Loading market…" />
      ) : !isLoading && assets.length === 0 && !isFetching && !search ? (
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
              data={assets}
              pagination={pagination}
              onPaginationChange={handlePaginationChange}
              onSearchChange={handleSearchChange}
              onSortChange={handleSortChange}
              searchPlaceholder="Search by ticker, name, or sector…"
              onRowClick={handleRowClick}
              isLoading={isFetching}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default MarketContent;
