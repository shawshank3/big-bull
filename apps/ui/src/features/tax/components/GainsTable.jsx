import { useMemo } from 'react';
import { DataTable } from '@/shared/ui/data-table';
import { MutedText } from '@/shared/ui/typography';
import { formatCurrency, formatDate } from '@/shared/utils';

const columns = [
  {
    accessorKey: 'ticker',
    header: 'Asset',
    cell: ({ row }) => (
      <div>
        <p className="font-semibold">{row.original.ticker}</p>
        <MutedText className="text-xs truncate max-w-[140px]">{row.original.name}</MutedText>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'gainType',
    header: 'Type',
    cell: ({ getValue }) => {
      const type = getValue();
      return (
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
            type === 'LTCG'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
          }`}
        >
          {type}
        </span>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'buyDate',
    header: 'Buy Date',
    cell: ({ getValue }) => formatDate(getValue()),
    enableSorting: true,
  },
  {
    accessorKey: 'sellDate',
    header: 'Sell Date',
    cell: ({ getValue }) => formatDate(getValue()),
    enableSorting: true,
  },
  {
    accessorKey: 'quantity',
    header: 'Qty / Units',
    cell: ({ row }) => {
      const isMF = row.original.assetType === 'MUTUAL_FUND';
      return (
        <span>
          {row.original.quantity}
          {isMF && <span className="text-xs text-muted ml-1">units</span>}
        </span>
      );
    },
    meta: { className: 'text-right' },
    enableSorting: true,
  },
  {
    accessorKey: 'buyPrice',
    header: 'Buy Price',
    cell: ({ getValue }) => formatCurrency(getValue()),
    meta: { className: 'text-right' },
    enableSorting: true,
  },
  {
    accessorKey: 'sellPrice',
    header: 'Sell Price',
    cell: ({ getValue }) => formatCurrency(getValue()),
    meta: { className: 'text-right' },
    enableSorting: true,
  },
  {
    accessorKey: 'gain',
    header: 'Gain/Loss',
    cell: ({ getValue }) => {
      const gain = getValue();
      return (
        <span className={gain >= 0 ? 'text-success font-semibold' : 'text-danger font-semibold'}>
          {formatCurrency(gain)}
        </span>
      );
    },
    meta: { className: 'text-right' },
    enableSorting: true,
  },
  {
    accessorKey: 'holdingDays',
    header: 'Holding Period',
    cell: ({ getValue }) => `${getValue()} days`,
    meta: { className: 'text-right' },
    enableSorting: true,
  },
];

export const GainsTable = ({ gains = [], assetType = 'ALL', gainType = 'ALL' }) => {
  const filteredGains = useMemo(() => {
    return gains.filter((g) => {
      if (assetType !== 'ALL' && g.assetType !== assetType) return false;
      if (gainType !== 'ALL' && g.gainType !== gainType) return false;
      return true;
    });
  }, [gains, assetType, gainType]);

  return (
    <DataTable
      columns={columns}
      data={filteredGains}
      searchPlaceholder="Search gains…"
      searchKey="ticker"
      pageSize={10}
    />
  );
};

export default GainsTable;
