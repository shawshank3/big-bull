import { useState, useMemo, useCallback } from 'react';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/card';
import { Spinner } from '@/shared/ui/spinner';
import { Alert } from '@/shared/ui/alert';
import { MutedText } from '@/shared/ui/typography';
import { ServerDataTable } from '@/shared/ui/server-data-table';
import { DateRangePicker } from '@/shared/components/date-range-picker';
import { formatCurrency, formatDateTime } from '@/shared/utils/format';
import { useListTransactionsQuery } from '../api/transactionApi';

const buildColumns = (qtyHeader = 'Qty') => [
  {
    accessorKey: 'transactionType',
    header: 'Type',
    cell: ({ getValue }) => (
      <Badge variant={getValue() === 'BUY' ? 'success' : 'danger'}>{getValue()}</Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'quantity',
    header: qtyHeader,
    meta: { className: 'text-right tabular-nums' },
    enableSorting: true,
  },
  {
    accessorKey: 'pricePerUnit',
    header: 'Price / unit',
    cell: ({ getValue }) => formatCurrency(getValue()),
    meta: { className: 'text-right tabular-nums' },
    enableSorting: true,
  },
  {
    id: 'total',
    header: 'Total',
    accessorFn: (row) => row.quantity * row.pricePerUnit,
    cell: ({ getValue }) => <span className="font-semibold">{formatCurrency(getValue())}</span>,
    meta: { className: 'text-right tabular-nums' },
    enableSorting: false,
  },
  {
    accessorKey: 'fees',
    header: 'Fees',
    cell: ({ getValue }) => (getValue() > 0 ? formatCurrency(getValue()) : '—'),
    meta: { className: 'text-right tabular-nums' },
    enableSorting: true,
  },
  {
    accessorKey: 'executedAt',
    header: 'Date & time',
    cell: ({ getValue }) => <MutedText className="text-xs">{formatDateTime(getValue())}</MutedText>,
    meta: { className: 'text-right' },
    enableSorting: true,
  },
];

/**
 * AssetTransactionsTable
 *
 * Renders a server-paginated data table for a specific asset's transactions.
 * Includes a date range filter rendered to the right of the search input via
 * the ServerDataTable `toolbar` slot.
 *
 * @param {string} assetId - MongoDB ObjectId of the asset
 * @param {string} [assetType] - 'STOCK' | 'MUTUAL_FUND' — drives column header label
 */
export const AssetTransactionsTable = ({ assetId, assetType }) => {
  const [paginationParams, setPaginationParams] = useState({ page: 1, limit: 5 });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(undefined);
  // Date range filter — { from?: Date, to?: Date } | undefined
  const [dateRange, setDateRange] = useState(undefined);

  const filters = useMemo(() => {
    const f = { assetId };
    if (dateRange?.from) f.dateFrom = dateRange.from.toISOString();
    if (dateRange?.to) f.dateTo = dateRange.to.toISOString();
    return f;
  }, [assetId, dateRange]);

  const {
    data: listData,
    isLoading,
    isFetching,
    isError,
  } = useListTransactionsQuery(
    {
      pagination: paginationParams,
      filters,
      search,
      sort,
    },
    { skip: !assetId }
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
  const tableColumns = useMemo(
    () => buildColumns(assetType === 'MUTUAL_FUND' ? 'Units' : 'Qty'),
    [assetType]
  );

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
    // Reset to page 1 whenever the date filter changes so users always see
    // the first page of the new result set.
    setPaginationParams((prev) => ({ ...prev, page: 1 }));
  }, []);

  const hasDateFilter = Boolean(dateRange?.from);

  const dateRangeToolbar = (
    <div className="ml-auto">
      <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="py-3 px-6">
        <CardTitle className="text-base">Transaction History</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pt-0 pb-2">
        {isLoading && transactions.length === 0 && <Spinner label="Loading transactions…" />}
        {isError && (
          <div className="px-6 pt-4">
            <Alert variant="danger">Unable to load transactions.</Alert>
          </div>
        )}
        {!isLoading &&
          !isError &&
          pagination.total === 0 &&
          !isFetching &&
          !search &&
          !hasDateFilter && (
            <div className="py-10 text-center">
              <MutedText>No transactions</MutedText>
            </div>
          )}
        {(transactions.length > 0 || isFetching || search || hasDateFilter) && !isError && (
          <ServerDataTable
            columns={tableColumns}
            data={transactions}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            onSearchChange={handleSearchChange}
            onSortChange={handleSortChange}
            searchPlaceholder="Filter transactions…"
            toolbar={dateRangeToolbar}
            isLoading={isFetching}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default AssetTransactionsTable;
