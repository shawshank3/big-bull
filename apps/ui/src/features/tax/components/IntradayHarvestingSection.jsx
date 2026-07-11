import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/card';
import { Alert } from '@/shared/ui/alert';
import { MutedText, StatValue } from '@/shared/ui/typography';
import { DataTable } from '@/shared/ui/data-table';
import { formatCurrency, humanize } from '@/shared/utils/format';
import { buildStockDetailPath, buildMutualDetailPath } from '@/features/market';
import { computeIntradayTax } from '../utils/taxCalculations';
import { useSlabRate } from '../hooks/useSlabRate';
import { useIntradaySimulator } from '../hooks/useIntradaySimulator';
import { IntradayWhatIfPanel } from './WhatIfPanel';

const DirectionBadge = ({ direction }) => {
  const isSell = direction === 'SELL_TO_CLOSE';
  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
        isSell
          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      }`}
    >
      {isSell ? 'Sell to close' : 'Buy to close'}
    </span>
  );
};

const buildColumns = ({
  slabRate,
  slabRateLabel,
  selectedIds,
  onToggle,
  onSelectAll,
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
            if (allSelected) onSelectAll([]);
            else onSelectAll(rows.map((r) => r.original.assetId));
          }}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          aria-label="Select all"
        />
      );
    },
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={selectedIds.has(row.original.assetId)}
        onChange={(e) => {
          e.stopPropagation();
          onToggle(row.original.assetId);
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
          onClick={() => onNavigate(opp)}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate(opp)}
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
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{humanize(getValue()) || '—'}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'direction',
    header: 'Action',
    cell: ({ getValue }) => <DirectionBadge direction={getValue()} />,
    enableSorting: false,
  },
  {
    accessorKey: 'currentPrice',
    header: 'Current Price',
    cell: ({ getValue }) => (
      <span className="tabular-nums font-medium">{formatCurrency(getValue())}</span>
    ),
    meta: { className: 'text-right' },
    enableSorting: true,
  },
  {
    accessorKey: 'matchableQty',
    header: 'Qty',
    cell: ({ getValue }) => (
      <span className="tabular-nums">{getValue().toLocaleString('en-IN')}</span>
    ),
    meta: { className: 'text-right' },
    enableSorting: true,
  },
  {
    accessorKey: 'unrealizedIntradayLoss',
    header: 'Intraday Loss',
    cell: ({ getValue }) => (
      <span className="tabular-nums text-danger font-medium">{formatCurrency(getValue())}</span>
    ),
    meta: { className: 'text-right' },
    enableSorting: true,
  },
  {
    id: 'estimatedSaving',
    header: `Est. Saving (${slabRateLabel})`,
    accessorFn: (row) => computeIntradayTax(row.unrealizedIntradayLoss, slabRate),
    cell: ({ getValue }) => (
      <span className="tabular-nums text-success font-medium">{formatCurrency(getValue())}</span>
    ),
    meta: { className: 'text-right' },
    enableSorting: true,
  },
];

/**
 * IntradayHarvestingSection
 *
 * Tab 3 content: intraday harvesting opportunities with checkbox selection
 * and a what-if panel showing intraday tax before/after.
 */
export const IntradayHarvestingSection = ({ intradayOpportunities = [], summary }) => {
  const navigate = useNavigate();
  const { slabRate, slabRateLabel } = useSlabRate();

  const {
    selectedIds,
    toggleSelection,
    selectAll,
    resetSelection,
    hasSelection,
    selectedLossesTotal,
    currentIntradayGain,
    postHarvestIntraday,
    taxBefore,
    taxAfter,
    netSavings,
  } = useIntradaySimulator(summary, intradayOpportunities, slabRate);

  const totalLoss = intradayOpportunities.reduce((s, o) => s + o.unrealizedIntradayLoss, 0);
  // Estimated saving if ALL open positions are closed — apply slab rate to the full closeable loss.
  // Note: this is a "max potential" figure; the simulator's taxBefore/taxAfter reflect actual
  // FY intraday gain and are used in the what-if panel. This top-card metric shows the gross
  // tax exposure tied to the closeable positions regardless of the current FY gain balance.
  const totalSaving = computeIntradayTax(totalLoss, slabRate);

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

  const columns = useMemo(
    () =>
      buildColumns({
        slabRate,
        slabRateLabel,
        selectedIds,
        onToggle: toggleSelection,
        onSelectAll: selectAll,
        onNavigate: handleNavigate,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slabRate, slabRateLabel, selectedIds]
  );

  if (intradayOpportunities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          No intraday harvesting opportunities today. These appear when you have an open intraday
          position where closing it now would realise a speculative loss.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="info">
        <div className="flex flex-col gap-1">
          <span className="font-medium">Intraday Loss Harvesting (Section 43(5))</span>
          <span className="text-sm">
            Based on your transactions today, the positions below can be closed right now to realise
            a speculative (intraday) loss. Intraday losses offset only intraday gains — they cannot
            be set off against STCG or LTCG.
          </span>
        </div>
      </Alert>

      {/* Summary metrics */}
      <div className="stat-grid">
        <Card>
          <CardContent className="space-y-1 pt-6">
            <MutedText>Intraday Gain This FY</MutedText>
            <StatValue
              tone={
                currentIntradayGain > 0 ? 'success' : currentIntradayGain < 0 ? 'danger' : 'default'
              }
            >
              {formatCurrency(currentIntradayGain)}
            </StatValue>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-6">
            <MutedText>Open Positions</MutedText>
            <StatValue>{String(intradayOpportunities.length)}</StatValue>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-6">
            <MutedText>Total Closeable Loss</MutedText>
            <StatValue tone="danger">{formatCurrency(totalLoss)}</StatValue>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 pt-6">
            <MutedText>Est. Tax Saving ({slabRateLabel})</MutedText>
            <StatValue tone="success">{formatCurrency(totalSaving)}</StatValue>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities table with checkboxes */}
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Open Intraday Positions</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <DataTable
            columns={columns}
            data={intradayOpportunities}
            searchPlaceholder="Search assets…"
            searchKey="ticker"
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* What-if panel — appears when rows are selected */}
      {hasSelection && (
        <IntradayWhatIfPanel
          slabRateLabel={slabRateLabel}
          selectedLossesTotal={selectedLossesTotal}
          currentIntradayGain={currentIntradayGain}
          postHarvestIntraday={postHarvestIntraday}
          taxBefore={taxBefore}
          taxAfter={taxAfter}
          netSavings={netSavings}
          onReset={resetSelection}
        />
      )}
    </div>
  );
};

export default IntradayHarvestingSection;
