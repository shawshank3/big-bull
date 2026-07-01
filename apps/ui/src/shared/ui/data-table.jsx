// Tier 2 — Prop-Based Component (verified)
import { useState, useMemo, Fragment } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/table';
import { Input } from '@/shared/ui/input';
import { Pagination } from '@/shared/ui/pagination';
import { cn } from '@/lib/utils';

/**
 * DataTable
 *
 * A fully-featured data table built on @tanstack/react-table + shadcn primitives.
 * Supports client-side pagination, global search filtering, column sorting,
 * optional custom row click handlers, controlled row selection, and expandable rows.
 *
 * @param {Object} props
 * @param {import('@tanstack/react-table').ColumnDef[]} props.columns - Column definitions
 * @param {Array} props.data - Data rows
 * @param {string} [props.searchPlaceholder] - Placeholder for the search input
 * @param {string} [props.searchKey] - Column ID to filter on (global filter if omitted)
 * @param {boolean} [props.showPagination=true] - Whether to show pagination
 * @param {boolean} [props.showSearch=true] - Whether to show the search filter
 * @param {number} [props.pageSize=10] - Default page size
 * @param {Function} [props.onRowClick] - Callback when a row is clicked, receives the row data
 * @param {React.ReactNode} [props.toolbar] - Extra toolbar content rendered beside the search
 * @param {Object} [props.rowSelection] - Controlled row selection state { [rowId]: boolean }
 * @param {Function} [props.onRowSelectionChange] - Callback when row selection changes
 * @param {Function} [props.getRowId] - Function to derive a stable row ID from data
 * @param {Function} [props.renderExpandedRow] - Render function for expanded row content (row) => ReactNode
 * @param {Object} [props.expanded] - Controlled expanded state { [rowId]: boolean }
 * @param {Function} [props.onExpandedChange] - Callback when expanded state changes
 */
export function DataTable({
  columns,
  data,
  searchPlaceholder = 'Search…',
  searchKey,
  showPagination = true,
  showSearch = true,
  pageSize = 10,
  onRowClick,
  toolbar,
  rowSelection,
  onRowSelectionChange,
  getRowId,
  renderExpandedRow,
  expanded,
  onExpandedChange,
}) {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [internalExpanded, setInternalExpanded] = useState({});

  const isControlledSelection = rowSelection !== undefined && onRowSelectionChange !== undefined;
  const isControlledExpanded = expanded !== undefined && onExpandedChange !== undefined;

  const tableOptions = useMemo(() => {
    const opts = {
      data,
      columns,
      state: {
        sorting,
        columnFilters,
        globalFilter,
        ...(isControlledSelection && { rowSelection }),
        expanded: isControlledExpanded ? expanded : internalExpanded,
      },
      onSortingChange: setSorting,
      onColumnFiltersChange: setColumnFilters,
      onGlobalFilterChange: setGlobalFilter,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      autoResetPageIndex: false,
      initialState: {
        pagination: { pageSize },
      },
      ...(isControlledSelection && {
        onRowSelectionChange,
        enableRowSelection: true,
      }),
      ...(getRowId && { getRowId }),
      ...(renderExpandedRow && {
        getExpandedRowModel: getExpandedRowModel(),
        onExpandedChange: isControlledExpanded ? onExpandedChange : setInternalExpanded,
      }),
    };
    return opts;
  }, [
    data,
    columns,
    sorting,
    columnFilters,
    globalFilter,
    rowSelection,
    expanded,
    internalExpanded,
    isControlledSelection,
    isControlledExpanded,
    getRowId,
    renderExpandedRow,
    pageSize,
  ]);

  const table = useReactTable(tableOptions);

  const handleFilterChange = (value) => {
    if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(value);
    } else {
      setGlobalFilter(value);
    }
  };

  const filterValue = searchKey
    ? (table.getColumn(searchKey)?.getFilterValue() ?? '')
    : globalFilter;

  return (
    <div className="space-y-0">
      {/* Toolbar / Search */}
      {(showSearch || toolbar) && (
        <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          {showSearch && (
            <div className="relative w-full sm:w-auto sm:flex-none sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                placeholder={searchPlaceholder}
                value={filterValue}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="pl-9 h-9 w-full sm:w-64"
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      {/* Table */}
      <Table wrapperClassName="rounded-none border-0 bg-transparent">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    header.column.getCanSort() && 'cursor-pointer select-none',
                    header.column.columnDef.meta?.className
                  )}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && <ArrowUpDown className="h-3 w-3 text-muted" />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <TableRow
                  className={cn(
                    onRowClick && 'cursor-pointer',
                    isControlledSelection && row.getIsSelected() && 'bg-primary/5'
                  )}
                  onClick={() => onRowClick?.(row.original)}
                  role={onRowClick ? 'button' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={(e) => e.key === 'Enter' && onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
                {renderExpandedRow && row.getIsExpanded() && (
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableCell colSpan={row.getVisibleCells().length} className="px-6 py-3">
                      {renderExpandedRow(row)}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted">
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {showPagination && table.getPageCount() > 1 && <Pagination table={table} />}
    </div>
  );
}

export { DataTable as default };
