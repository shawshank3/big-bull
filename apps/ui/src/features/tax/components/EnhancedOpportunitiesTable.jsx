import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { formatCurrency, formatPercentage, humanize } from '@/shared/utils/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/components/select';
import { Button } from '@/shared/ui/button';
import { MutedText } from '@/shared/ui/typography';
import { DataTable } from '@/shared/ui/data-table';
import { buildStockDetailPath, buildMutualDetailPath } from '@/features/market';
import { computeLossPercent } from '../utils/taxCalculations';

/**
 * Builds tanstack column definitions for the harvesting opportunities table.
 * The select column and expand column use controlled state from parent.
 */
const buildColumns = ({
  selectedIds,
  onToggleSelection,
  onSelectAll,
  expandedRows,
  onToggleExpand,
  onNavigate,
}) => [
  {
    id: 'select',
    header: ({ table }) => {
      const rows = table.getFilteredRowModel().rows;
      const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.original.assetId));
      const someSelected = rows.some((r) => selectedIds.has(r.original.assetId));
      return (
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected && !allSelected;
          }}
          onChange={() => {
            if (allSelected) {
              onSelectAll([]);
            } else {
              onSelectAll(rows.map((r) => r.original.assetId));
            }
          }}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          aria-label="Select all opportunities"
        />
      );
    },
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={selectedIds.has(row.original.assetId)}
        onChange={(e) => {
          e.stopPropagation();
          onToggleSelection(row.original.assetId);
        }}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        aria-label={`Select ${row.original.ticker}`}
      />
    ),
    enableSorting: false,
    meta: { className: 'w-10' },
  },
  {
    accessorKey: 'ticker',
    header: 'Asset',
    cell: ({ row }) => {
      const opp = row.original;
      return (
        <div
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(opp);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.stopPropagation();
              onNavigate(opp);
            }
          }}
          role="link"
          tabIndex={0}
        >
          <p className="font-semibold">{opp.ticker}</p>
          <MutedText className="text-xs truncate max-w-[140px]">{opp.name}</MutedText>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: 'sector',
    header: 'Sector',
    cell: ({ getValue }) => <span className="text-muted-foreground">{humanize(getValue())}</span>,
    enableSorting: true,
  },
  {
    accessorKey: 'assetType',
    header: 'Type',
    cell: ({ getValue }) => (
      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold border border-primary/30">
        {getValue() === 'MUTUAL_FUND' ? 'MF' : 'Stock'}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'unrealizedLoss',
    header: 'Unrealized Loss',
    cell: ({ getValue }) => (
      <span className="text-danger font-medium tabular-nums">{formatCurrency(getValue())}</span>
    ),
    meta: { className: 'text-right' },
    enableSorting: true,
  },
  {
    id: 'lossPercent',
    header: 'Loss %',
    accessorFn: (row) => computeLossPercent(row),
    cell: ({ getValue }) => (
      <span className="text-danger tabular-nums">{formatPercentage(getValue())}</span>
    ),
    meta: { className: 'text-right' },
    enableSorting: true,
  },
  {
    accessorKey: 'lossType',
    header: 'Loss Type',
    cell: ({ getValue }) => {
      const type = getValue();
      const cls =
        type === 'STCG'
          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cls}`}>{type}</span>;
    },
    enableSorting: true,
  },
  {
    accessorKey: 'holdingDays',
    header: 'Holding',
    cell: ({ getValue }) => (
      <span className="tabular-nums text-muted-foreground">{getValue()}d</span>
    ),
    meta: { className: 'text-right' },
    enableSorting: true,
  },
  {
    accessorKey: 'estimatedSaving',
    header: 'Est. Saving',
    cell: ({ getValue }) => (
      <span className="text-success font-medium tabular-nums">{formatCurrency(getValue())}</span>
    ),
    meta: { className: 'text-right' },
    enableSorting: true,
  },
  {
    accessorKey: 'offsetsGainType',
    header: 'Offsets',
    cell: ({ getValue }) => {
      const type = getValue();
      const cls =
        type === 'STCG'
          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      return <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cls}`}>{type}</span>;
    },
    enableSorting: true,
  },
  {
    id: 'expand',
    header: () => <span className="sr-only">Expand</span>,
    cell: ({ row }) => {
      const isExpanded = expandedRows.has(row.original.assetId);
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(row.original.assetId);
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      );
    },
    enableSorting: false,
    meta: { className: 'w-8' },
  },
];

/**
 * EnhancedOpportunitiesTable — Uses DataTable with controlled selection,
 * expandable rows, and custom filter toolbar for the What-If simulator.
 */
export const EnhancedOpportunitiesTable = ({
  opportunities,
  selectedIds,
  onToggleSelection,
  onSelectAll,
}) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ assetType: '', lossType: '', sector: '' });
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleExpand = useCallback((assetId) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  }, []);

  const handleNavigate = useCallback(
    (opp) => {
      const path =
        opp.assetType === 'MUTUAL_FUND'
          ? buildMutualDetailPath(opp.ticker)
          : buildStockDetailPath(opp.ticker);
      navigate(path, { state: { name: opp.name } });
    },
    [navigate]
  );

  // Derive unique filter options from data
  const filterOptions = useMemo(() => {
    const assetTypes = [...new Set(opportunities.map((o) => o.assetType).filter(Boolean))];
    const lossTypes = [...new Set(opportunities.map((o) => o.lossType).filter(Boolean))];
    const sectors = [...new Set(opportunities.map((o) => o.sector).filter(Boolean))];
    return { assetTypes, lossTypes, sectors };
  }, [opportunities]);

  // Apply filters before passing to DataTable
  const filteredData = useMemo(() => {
    return opportunities.filter((o) => {
      if (filters.assetType && o.assetType !== filters.assetType) return false;
      if (filters.lossType && o.lossType !== filters.lossType) return false;
      if (filters.sector && o.sector !== filters.sector) return false;
      return true;
    });
  }, [opportunities, filters]);

  // Build columns with current selection/expanded state
  const columns = useMemo(
    () =>
      buildColumns({
        selectedIds,
        onToggleSelection,
        onSelectAll,
        expandedRows,
        onToggleExpand: toggleExpand,
        onNavigate: handleNavigate,
      }),
    [selectedIds, onToggleSelection, onSelectAll, expandedRows, toggleExpand, handleNavigate]
  );

  // Controlled expanded state for DataTable (mapped from Set to object)
  const expandedState = useMemo(() => {
    const state = {};
    expandedRows.forEach((id) => {
      state[id] = true;
    });
    return state;
  }, [expandedRows]);

  const handleExpandedChange = useCallback((updater) => {
    const nextState = typeof updater === 'function' ? updater({}) : updater;
    setExpandedRows(new Set(Object.keys(nextState).filter((k) => nextState[k])));
  }, []);

  const getRowId = useCallback((row) => row.assetId, []);

  const renderExpandedRow = useCallback((row) => {
    const opp = row.original;
    return (
      <div className="text-xs space-y-1">
        <p className="font-medium text-muted-foreground mb-1">Position Details</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-muted-foreground">Avg Cost:</span>{' '}
            <span className="font-medium">{formatCurrency(opp.avgCostBasis)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Sim. Price:</span>{' '}
            <span className="font-medium">{formatCurrency(opp.currentPrice)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">
              {opp.assetType === 'MUTUAL_FUND' ? 'Units:' : 'Quantity:'}
            </span>{' '}
            <span className="font-medium">{opp.quantity}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Cost:</span>{' '}
            <span className="font-medium">{formatCurrency(opp.avgCostBasis * opp.quantity)}</span>
          </div>
        </div>
      </div>
    );
  }, []);

  // Custom filter toolbar
  const filterToolbar = (
    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:contents">
      <Select
        value={filters.assetType || '_all'}
        onValueChange={(val) => setFilters((f) => ({ ...f, assetType: val === '_all' ? '' : val }))}
      >
        <SelectTrigger
          className="flex-1 min-w-[110px] sm:flex-none sm:w-[130px]"
          aria-label="Filter by asset type"
        >
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All Types</SelectItem>
          {filterOptions.assetTypes.map((t) => (
            <SelectItem key={t} value={t}>
              {t === 'MUTUAL_FUND' ? 'Mutual Fund' : 'Stock'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.lossType || '_all'}
        onValueChange={(val) => setFilters((f) => ({ ...f, lossType: val === '_all' ? '' : val }))}
      >
        <SelectTrigger
          className="flex-1 min-w-[110px] sm:flex-none sm:w-[140px]"
          aria-label="Filter by loss type"
        >
          <SelectValue placeholder="All Loss Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All Loss Types</SelectItem>
          {filterOptions.lossTypes.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sector || '_all'}
        onValueChange={(val) => setFilters((f) => ({ ...f, sector: val === '_all' ? '' : val }))}
      >
        <SelectTrigger
          className="flex-1 min-w-[110px] sm:flex-none sm:w-[140px]"
          aria-label="Filter by sector"
        >
          <SelectValue placeholder="All Sectors" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All Sectors</SelectItem>
          {filterOptions.sectors.map((s) => (
            <SelectItem key={s} value={s}>
              {humanize(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(filters.assetType || filters.lossType || filters.sector) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFilters({ assetType: '', lossType: '', sector: '' })}
          className="text-xs shrink-0"
        >
          Clear filters
        </Button>
      )}
    </div>
  );

  if (!opportunities.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No harvesting opportunities found with the current threshold.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Harvesting Opportunities</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <DataTable
          columns={columns}
          data={filteredData}
          searchPlaceholder="Search opportunities…"
          searchKey="ticker"
          pageSize={10}
          toolbar={filterToolbar}
          getRowId={getRowId}
          renderExpandedRow={renderExpandedRow}
          expanded={expandedState}
          onExpandedChange={handleExpandedChange}
        />
      </CardContent>
    </Card>
  );
};

export default EnhancedOpportunitiesTable;
