import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/shared/utils/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/components/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/shared/components/table';
import { Button } from '@/shared/ui/button';
import { MutedText } from '@/shared/ui/typography';
import { computeLossPercent } from '../utils/taxCalculations';

/**
 * EnhancedOpportunitiesTable — Full-featured table with sorting,
 * filtering, expandable rows, and selection checkboxes for What-If simulator.
 */
export const EnhancedOpportunitiesTable = ({ opportunities, selectedIds, onToggleSelection }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'estimatedSaving', direction: 'desc' });
  const [filters, setFilters] = useState({ assetType: '', lossType: '', sector: '' });
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Derive unique filter options from data
  const filterOptions = useMemo(() => {
    const assetTypes = [...new Set(opportunities.map((o) => o.assetType).filter(Boolean))];
    const lossTypes = [...new Set(opportunities.map((o) => o.lossType).filter(Boolean))];
    const sectors = [...new Set(opportunities.map((o) => o.sector).filter(Boolean))];
    return { assetTypes, lossTypes, sectors };
  }, [opportunities]);

  // Apply filters
  const filteredData = useMemo(() => {
    return opportunities.filter((o) => {
      if (filters.assetType && o.assetType !== filters.assetType) return false;
      if (filters.lossType && o.lossType !== filters.lossType) return false;
      if (filters.sector && o.sector !== filters.sector) return false;
      return true;
    });
  }, [opportunities, filters]);

  // Apply sorting
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      aVal = aVal ?? 0;
      bVal = bVal ?? 0;
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [filteredData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const toggleExpand = (assetId) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const columns = [
    { key: 'ticker', label: 'Asset', sortable: true },
    { key: 'sector', label: 'Sector', sortable: true },
    { key: 'assetType', label: 'Type', sortable: true },
    { key: 'unrealizedLoss', label: 'Unrealized Loss', sortable: true },
    { key: 'lossPercent', label: 'Loss %', sortable: false },
    { key: 'lossType', label: 'Loss Type', sortable: true },
    { key: 'holdingDays', label: 'Holding', sortable: true },
    { key: 'estimatedSaving', label: 'Est. Saving', sortable: true },
    { key: 'offsetsGainType', label: 'Offsets', sortable: true },
  ];

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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Harvesting Opportunities</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-4 pb-3 border-b border-border">
          <Select
            value={filters.assetType || '_all'}
            onValueChange={(val) =>
              setFilters((f) => ({ ...f, assetType: val === '_all' ? '' : val }))
            }
          >
            <SelectTrigger className="w-[130px]" aria-label="Filter by asset type">
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
            onValueChange={(val) =>
              setFilters((f) => ({ ...f, lossType: val === '_all' ? '' : val }))
            }
          >
            <SelectTrigger className="w-[140px]" aria-label="Filter by loss type">
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
            onValueChange={(val) =>
              setFilters((f) => ({ ...f, sector: val === '_all' ? '' : val }))
            }
          >
            <SelectTrigger className="w-[140px]" aria-label="Filter by sector">
              <SelectValue placeholder="All Sectors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Sectors</SelectItem>
              {filterOptions.sectors.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(filters.assetType || filters.lossType || filters.sector) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ assetType: '', lossType: '', sector: '' })}
              className="text-xs"
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Table */}
        <Table wrapperClassName="border-0 rounded-none">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <span className="sr-only">Select</span>
              </TableHead>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={col.sortable ? 'cursor-pointer select-none hover:text-foreground' : ''}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="text-xs opacity-60">{getSortIcon(col.key)}</span>
                    )}
                  </span>
                </TableHead>
              ))}
              <TableHead className="w-8">
                <span className="sr-only">Expand</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((opp) => (
              <OpportunityRow
                key={opp.assetId}
                opportunity={opp}
                isSelected={selectedIds.has(opp.assetId)}
                isExpanded={expandedRows.has(opp.assetId)}
                onToggleSelect={() => onToggleSelection(opp.assetId)}
                onToggleExpand={() => toggleExpand(opp.assetId)}
                lossPercent={computeLossPercent(opp)}
              />
            ))}
          </TableBody>
        </Table>

        {sortedData.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No opportunities match the selected filters.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Individual opportunity row with expandable position details.
 */
const OpportunityRow = ({
  opportunity: opp,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  lossPercent,
}) => {
  const badgeClass = (type) =>
    type === 'STCG'
      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';

  return (
    <>
      <TableRow className={isSelected ? 'bg-primary/5' : ''}>
        <TableCell>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            aria-label={`Select ${opp.ticker}`}
          />
        </TableCell>
        <TableCell>
          <div>
            <p className="font-semibold">{opp.ticker}</p>
            <MutedText className="text-xs truncate max-w-[140px]">{opp.name}</MutedText>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground">{opp.sector || '—'}</TableCell>
        <TableCell>
          <span className="text-xs px-1.5 py-0.5 rounded bg-muted font-medium">
            {opp.assetType === 'MUTUAL_FUND' ? 'MF' : 'Stock'}
          </span>
        </TableCell>
        <TableCell className="text-danger font-medium tabular-nums">
          {formatCurrency(opp.unrealizedLoss)}
        </TableCell>
        <TableCell className="text-danger tabular-nums">{formatPercentage(lossPercent)}</TableCell>
        <TableCell>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${badgeClass(opp.lossType)}`}>
            {opp.lossType}
          </span>
        </TableCell>
        <TableCell className="tabular-nums text-muted-foreground">{opp.holdingDays}d</TableCell>
        <TableCell className="text-success font-medium tabular-nums">
          {formatCurrency(opp.estimatedSaving)}
        </TableCell>
        <TableCell>
          <span
            className={`text-xs px-1.5 py-0.5 rounded font-medium ${badgeClass(opp.offsetsGainType)}`}
          >
            {opp.offsetsGainType}
          </span>
        </TableCell>
        <TableCell>
          <button
            onClick={onToggleExpand}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </TableCell>
      </TableRow>

      {/* Expanded row — position details */}
      {isExpanded && (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={11} className="px-6 py-3">
            <div className="text-xs space-y-1">
              <p className="font-medium text-muted-foreground mb-1">Position Details</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-muted-foreground">Avg Cost:</span>{' '}
                  <span className="font-medium">{formatCurrency(opp.avgCostBasis)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Current Price:</span>{' '}
                  <span className="font-medium">{formatCurrency(opp.currentPrice)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Quantity:</span>{' '}
                  <span className="font-medium">{opp.quantity}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Cost:</span>{' '}
                  <span className="font-medium">
                    {formatCurrency(opp.avgCostBasis * opp.quantity)}
                  </span>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export default EnhancedOpportunitiesTable;
