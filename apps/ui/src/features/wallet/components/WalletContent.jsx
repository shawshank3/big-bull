import { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Alert } from '@/shared/ui/alert';
import { Card, CardContent } from '@/shared/ui/card';
import { Spinner } from '@/shared/ui/spinner';
import { Badge } from '@/shared/ui/badge';
import { MutedText } from '@/shared/ui/typography';
import { PageHeader } from '@/shared/layout/PageHeader';
import { ServerDataTable } from '@/shared/ui/server-data-table';
import { useGetWalletQuery, useListWalletTransactionsQuery } from '@/features/wallet/api/walletApi';
import { formatCurrency, formatDateTime } from '@/shared/utils/format';

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

const columns = [
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
    cell: ({ row }) => (
      <div>
        <p className="font-semibold">{row.original.asset?.ticker ?? '—'}</p>
        <MutedText className="text-xs truncate max-w-[160px]">
          {row.original.asset?.name ?? ''}
        </MutedText>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'quantity',
    header: 'Qty',
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
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Server-side pagination state
  const [paginationParams, setPaginationParams] = useState({ page: 1, limit: 5 });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(undefined);

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
      filters: {},
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
        ) : transactions.length === 0 && !isFetching ? (
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
