import { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectIsAuthenticated } from '@/features/auth';
import { Alert } from '@/shared/ui/alert';
import { Card, CardContent } from '@/shared/components/card';
import { Spinner } from '@/shared/ui/spinner';
import { Badge } from '@/shared/ui/badge';
import { MutedText } from '@/shared/ui/typography';
import { PageHeader } from '@/shared/layout/PageHeader';
import { ServerDataTable } from '@/shared/ui/server-data-table';
import { DateRangePicker } from '@/shared/components/date-range-picker';
import { useGetWalletQuery, useListWalletTransactionsQuery } from '@/features/wallet';
import { formatCurrency, formatDateTime } from '@/shared/utils/format';
import { buildStockDetailPath, buildMutualDetailPath } from '@/features/market';
import { ASSET_TYPES } from '@/shared/constants/assetTypes';

const WalletBalanceCard = ({ balance, isLoading }) => (
  <Card>
    <CardContent className="py-6">
      <p className="text-sm text-muted mb-1">Wallet Balance</p>
      {isLoading ? (
        <div className="h-9 w-40 animate-pulse rounded bg-muted/20" />
      ) : (
        <p className="text-3xl font-bold tabular-nums text-foreground">{formatCurrency(balance)}</p>
      )}
    </CardContent>
  </Card>
);

/**
 * Build the table columns. The Stock column uses a parent-supplied click
 * handler so the asset ticker/name navigates to the asset detail page —
 * matching the behaviour of the Market table.
 */
const buildColumns = (onAssetClick) => [
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ getValue }) => {
      const isDebit = getValue() === 'DEBIT';
      return <Badge variant={isDebit ? 'danger' : 'success'}>{getValue()}</Badge>;
    },
    enableSorting: false,
  },
  {
    accessorFn: (row) => row.asset?.ticker ?? '',
    id: 'stock',
    header: 'Stock',
    cell: ({ row }) => {
      const asset = row.original.asset;
      if (!asset) {
        return (
          <div>
            <p className="font-semibold">—</p>
          </div>
        );
      }
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAssetClick?.(asset);
          }}
          className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
        >
          <p className="font-semibold text-primary">{asset.ticker ?? '—'}</p>
          <MutedText className="text-xs truncate max-w-[160px]">{asset.name ?? ''}</MutedText>
        </button>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'quantity',
    header: 'Qty / Units',
    cell: ({ row }) => {
      const isMF = row.original.asset?.assetType === 'MUTUAL_FUND';
      return (
        <span>
          {row.original.quantity}
          {isMF && <span className="text-xs text-muted ml-1">units</span>}
        </span>
      );
    },
    meta: { className: 'tabular-nums' },
    enableSorting: true,
  },
  {
    accessorKey: 'pricePerUnit',
    header: 'Price',
    cell: ({ getValue }) => formatCurrency(getValue()),
    meta: { className: 'text-right tabular-nums' },
    enableSorting: true,
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => {
      const isDebit = row.original.type === 'DEBIT';
      return (
        <span className={`font-medium ${isDebit ? 'text-danger' : 'text-success'}`}>
          {isDebit ? '−' : '+'} {formatCurrency(row.original.amount)}
        </span>
      );
    },
    meta: { className: 'text-right tabular-nums' },
    enableSorting: false,
  },
  {
    accessorKey: 'executedAt',
    header: 'Date',
    cell: ({ getValue }) => <MutedText className="text-xs">{formatDateTime(getValue())}</MutedText>,
    meta: { className: 'text-right' },
    enableSorting: true,
  },
];

export const WalletContent = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const navigate = useNavigate();

  // Server-side pagination state
  const [paginationParams, setPaginationParams] = useState({ page: 1, limit: 5 });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(undefined);
  // Date range filter — { from?: Date, to?: Date } | undefined
  const [dateRange, setDateRange] = useState(undefined);

  const filters = useMemo(() => {
    const f = {};
    if (dateRange?.from) f.dateFrom = dateRange.from.toISOString();
    if (dateRange?.to) f.dateTo = dateRange.to.toISOString();
    return f;
  }, [dateRange]);

  const {
    data: wallet,
    isLoading: walletLoading,
    error: walletError,
  } = useGetWalletQuery(undefined, { skip: !isAuthenticated });

  const {
    data: listData,
    isLoading: historyLoading,
    isFetching,
    error: historyError,
  } = useListWalletTransactionsQuery(
    {
      pagination: paginationParams,
      search,
      sort,
      filters,
    },
    { skip: !isAuthenticated }
  );

  const transactions = listData?.items ?? [];
  const pagination = listData?.pagination ?? {
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const handleAssetClick = useCallback(
    (asset) => {
      if (!asset?.ticker) return;
      const path =
        asset.assetType === ASSET_TYPES.MUTUAL_FUND
          ? buildMutualDetailPath(asset.ticker)
          : buildStockDetailPath(asset.ticker);
      navigate(path, { state: { name: asset.name } });
    },
    [navigate]
  );

  const tableColumns = useMemo(() => buildColumns(handleAssetClick), [handleAssetClick]);

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

  const handleDateRangeChange = useCallback((range) => {
    setDateRange(range);
    setPaginationParams((prev) => ({ ...prev, page: 1 }));
  }, []);

  const hasDateFilter = Boolean(dateRange?.from);

  const dateRangeToolbar = (
    <div className="ml-auto">
      <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
    </div>
  );

  return (
    <>
      <PageHeader
        title="Wallet"
        description="Your wallet balance and complete transaction history."
      />

      {walletError ? (
        <Alert variant="danger">Unable to load wallet balance.</Alert>
      ) : (
        <WalletBalanceCard balance={wallet?.balance ?? 0} isLoading={walletLoading} />
      )}

      <div className="mt-6">
        <h2 className="text-lg font-bold text-foreground mb-3">Transaction History</h2>

        {historyError ? (
          <Alert variant="danger">Unable to load transactions.</Alert>
        ) : historyLoading && transactions.length === 0 ? (
          <Spinner label="Loading transactions…" />
        ) : transactions.length === 0 && !isFetching && !search && !hasDateFilter ? (
          <Card>
            <CardContent className="py-16 text-center text-muted">
              No transactions yet. Start trading from the Market page.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ServerDataTable
                columns={tableColumns}
                data={transactions}
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
                onSearchChange={handleSearchChange}
                onSortChange={handleSortChange}
                searchPlaceholder="Search by stock name or ticker…"
                toolbar={dateRangeToolbar}
                isLoading={isFetching}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default WalletContent;
