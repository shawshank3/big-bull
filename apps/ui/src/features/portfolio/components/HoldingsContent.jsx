import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors';
import { Alert } from '@/shared/ui/alert';
import { Card, CardContent } from '@/shared/components/card';
import { Spinner } from '@/shared/ui/spinner';
import { MutedText, StatValue } from '@/shared/ui/typography';
import { PageHeader } from '@/shared/layout/PageHeader';
import { DataTable } from '@/shared/ui/data-table';
import { Button } from '@/shared/ui/button';
import { ROUTES } from '@/shared/constants/routes';
import { useGetPortfolioHoldingsQuery, useGetPortfolioSummaryQuery } from '../api/portfolioApi';
import { formatCurrency } from '@/shared/utils/format';
import { buildStockDetailPath, buildMutualDetailPath } from '@/features/market/constants/market';

const pct = (n) => `${n >= 0 ? '+' : ''}${(n ?? 0).toFixed(2)}%`;

const SummaryBar = ({ summary }) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
    {[
      { label: 'Invested', value: formatCurrency(summary?.totalInvested ?? 0) },
      { label: 'Current value', value: formatCurrency(summary?.currentValue ?? 0) },
      {
        label: 'Total P&L',
        value: formatCurrency(summary?.totalPnL ?? 0),
        className: summary?.totalPnL >= 0 ? 'text-success' : 'text-danger',
      },
      { label: 'Cash balance', value: formatCurrency(summary?.cashBalance ?? 0) },
    ].map(({ label, value, className }) => (
      <Card key={label}>
        <CardContent className="py-4">
          <p className="text-xs text-muted mb-1">{label}</p>
          <p className={['text-lg font-bold tabular-nums', className ?? ''].join(' ')}>{value}</p>
        </CardContent>
      </Card>
    ))}
  </div>
);

const columns = [
  {
    accessorFn: (row) => row.asset?.ticker ?? '',
    id: 'ticker',
    header: 'Asset',
    cell: ({ row }) => (
      <div>
        <p className="font-semibold">{row.original.asset?.ticker}</p>
        <MutedText className="text-xs truncate max-w-[160px]">{row.original.asset?.name}</MutedText>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'netQuantity',
    header: 'Qty / Units',
    cell: ({ row }) => {
      const isMF = row.original.asset?.assetType === 'MUTUAL_FUND';
      return (
        <span>
          {row.original.netQuantity}
          {isMF && <span className="text-xs text-muted ml-1">units</span>}
        </span>
      );
    },
    meta: { className: 'text-right' },
    enableSorting: true,
  },
  {
    accessorKey: 'avgCostBasis',
    header: 'Avg Cost',
    cell: ({ getValue }) => formatCurrency(getValue()),
    meta: { className: 'text-right' },
    enableSorting: true,
  },
  {
    accessorKey: 'currentPrice',
    header: 'Price',
    cell: ({ getValue }) => formatCurrency(getValue()),
    meta: { className: 'text-right' },
    enableSorting: true,
  },
  {
    accessorKey: 'unrealisedPnL',
    header: 'Unrealised P&L',
    cell: ({ row }) => {
      const pnlUp = row.original.unrealisedPnL >= 0;
      return (
        <div className="space-y-0.5">
          <StatValue tone={pnlUp ? 'success' : 'danger'} className="text-sm">
            {formatCurrency(row.original.unrealisedPnL)}
          </StatValue>
          <MutedText as="span" className="text-xs">
            {pct(row.original.unrealisedPnLPercent)}
          </MutedText>
        </div>
      );
    },
    meta: { className: 'text-right' },
    enableSorting: true,
  },
];

export const HoldingsContent = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const navigate = useNavigate();

  const { data: summary, isLoading: summaryLoading } = useGetPortfolioSummaryQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  });
  const {
    data: holdingsData,
    isLoading,
    error,
  } = useGetPortfolioHoldingsQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  });
  const holdings = holdingsData ?? [];

  const tableColumns = useMemo(() => columns, []);

  const handleRowClick = (holding) => {
    const path =
      holding.asset?.assetType === 'MUTUAL_FUND'
        ? buildMutualDetailPath(holding.asset.ticker)
        : buildStockDetailPath(holding.asset.ticker);
    navigate(path, { state: { name: holding.asset?.name } });
  };

  const pageLoading = isLoading || summaryLoading;

  return (
    <>
      <PageHeader
        title="Portfolio"
        description="Holdings are derived from your transaction history in real time."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.TAX}>Tax Center</Link>
          </Button>
        }
      />
      {pageLoading ? (
        <Spinner label="Loading portfolio…" />
      ) : (
        <>
          <SummaryBar summary={summary} />
          {error ? <Alert variant="danger">Unable to load holdings right now.</Alert> : null}
          {holdings.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted">
                No holdings yet. Buy some assets from the Market page to get started.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <DataTable
                  columns={tableColumns}
                  data={holdings}
                  searchPlaceholder="Search holdings…"
                  searchKey="ticker"
                  onRowClick={handleRowClick}
                  pageSize={10}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  );
};

export default HoldingsContent;
