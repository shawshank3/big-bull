import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/shared/ui/badge';
import { MutedText, StatValue } from '@/shared/ui/typography';
import { DataTable } from '@/shared/ui/data-table';
import { formatCurrency, getHoldingReturn } from '@/shared/utils';
import { buildStockDetailPath, buildMutualDetailPath } from '@/features/market/constants/market';

const columns = [
  {
    accessorFn: (row) => row.name || row.ticker,
    id: 'name',
    header: 'Name',
    enableSorting: true,
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ getValue }) => (
      <Badge variant={getValue() === 'mutual' ? 'info' : 'warning'}>
        {getValue() === 'mutual' ? 'MF' : 'STK'}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'qty',
    header: 'Qty / Units',
    cell: ({ row }) => {
      const isMF = row.original.type === 'mutual';
      return (
        <span>
          {row.original.qty}
          {isMF && <span className="text-xs text-muted ml-1">units</span>}
        </span>
      );
    },
    meta: { className: 'text-right' },
    enableSorting: true,
  },
  {
    accessorKey: 'avgPrice',
    header: 'Avg price',
    cell: ({ getValue }) => formatCurrency(getValue()),
    meta: { className: 'text-right' },
    enableSorting: true,
  },
  {
    accessorKey: 'currentPrice',
    header: 'Current price',
    cell: ({ getValue }) => formatCurrency(getValue()),
    meta: { className: 'text-right' },
    enableSorting: true,
  },
  {
    id: 'value',
    header: 'Value',
    accessorFn: (row) => row.currentValue ?? row.qty * row.currentPrice,
    cell: ({ getValue }) => formatCurrency(getValue()),
    meta: { className: 'text-right' },
    enableSorting: true,
  },
  {
    id: 'return',
    header: 'Return',
    accessorFn: (row) => getHoldingReturn(row).value,
    cell: ({ row }) => {
      const { value, percentage } = getHoldingReturn(row.original);
      return (
        <div className="space-y-0.5">
          <StatValue tone={value >= 0 ? 'success' : 'danger'} className="text-sm">
            {formatCurrency(value)}
          </StatValue>
          <MutedText as="span" className="text-xs">
            {percentage.toFixed(2)}%
          </MutedText>
        </div>
      );
    },
    meta: { className: 'text-right' },
    enableSorting: true,
  },
];

export const HoldingsTable = ({ holdings }) => {
  const navigate = useNavigate();
  const tableColumns = useMemo(() => columns, []);

  const getDetailPath = (holding) => {
    if (holding.type === 'mutual') {
      return buildMutualDetailPath(holding.ticker);
    }
    return buildStockDetailPath(holding.ticker);
  };

  const handleRowClick = (holding) => {
    navigate(getDetailPath(holding), { state: { name: holding.name } });
  };

  return (
    <DataTable
      columns={tableColumns}
      data={holdings}
      searchPlaceholder="Search holdings…"
      searchKey="name"
      onRowClick={handleRowClick}
      pageSize={10}
    />
  );
};

export default HoldingsTable;
