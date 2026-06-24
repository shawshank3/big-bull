// Tier 2 — Prop-Based Component (verified)
import { useState, useCallback, useEffect } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
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
import { useDebounce } from '@/shared/hooks/useDebounce';

/**
 * ServerDataTable
 *
 * A data table with server-side pagination, search, and sorting.
 * Unlike the client-side DataTable, this component does NOT fetch all rows upfront —
 * it calls the parent-provided callbacks on page/search/sort changes so the parent
 * can trigger an API request with the appropriate payload.
 *
 * @param {Object} props
 * @param {import('@tanstack/react-table').ColumnDef[]} props.columns - Column definitions
 * @param {Array} props.data - Current page of data rows
 * @param {object} props.pagination - { page, limit, total, totalPages, hasNextPage, hasPrevPage }
 * @param {Function} props.onPaginationChange - ({ page, limit }) => void
 * @param {Function} [props.onSearchChange] - (searchTerm) => void
 * @param {Function} [props.onSortChange] - ({ field, order }) => void
 * @param {string} [props.searchPlaceholder] - Placeholder for the search input
 * @param {boolean} [props.showSearch=true] - Whether to show the search input
 * @param {boolean} [props.showPagination=true] - Whether to show pagination
 * @param {boolean} [props.isLoading=false] - Whether data is loading
 * @param {Function} [props.onRowClick] - Callback when a row is clicked
 * @param {React.ReactNode} [props.toolbar] - Extra toolbar content beside search
 */
export function ServerDataTable({
  columns,
  data,
  pagination,
  onPaginationChange,
  onSearchChange,
  onSortChange,
  searchPlaceholder = 'Search…',
  showSearch = true,
  showPagination = true,
  isLoading = false,
  onRowClick,
  toolbar,
}) {
  const [searchInput, setSearchInput] = useState('');
  const [sorting, setSorting] = useState([]);
  const debouncedSearch = useDebounce(searchInput, 400);

  // Notify parent when debounced search value changes
  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: pagination?.totalPages ?? 1,
    state: {
      sorting,
      pagination: {
        pageIndex: (pagination?.page ?? 1) - 1,
        pageSize: pagination?.limit ?? 5,
      },
    },
    onSortingChange: setSorting,
  });

  const handleSearchChange = (value) => {
    setSearchInput(value);
    // Reset to page 1 on search
    if (onPaginationChange && pagination) {
      onPaginationChange({ page: 1, limit: pagination.limit });
    }
  };

  const handleSortClick = useCallback(
    (column) => {
      if (!column.getCanSort() || !onSortChange) return;
      const currentSort = column.getIsSorted();
      if (!currentSort) {
        setSorting([{ id: column.id, desc: false }]);
        onSortChange({ field: column.id, order: 'asc' });
      } else if (currentSort === 'asc') {
        setSorting([{ id: column.id, desc: true }]);
        onSortChange({ field: column.id, order: 'desc' });
      } else {
        setSorting([]);
        onSortChange(undefined); // clear sort
      }
    },
    [onSortChange]
  );

  return (
    <div className="space-y-0">
      {/* Toolbar / Search */}
      {(showSearch || toolbar) && (
        <div className="flex items-center gap-3 px-4 py-3">
          {showSearch && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <Input
                placeholder={searchPlaceholder}
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-9"
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
                    header.column.getCanSort() && onSortChange && 'cursor-pointer select-none',
                    header.column.columnDef.meta?.className
                  )}
                  onClick={() => handleSortClick(header.column)}
                >
                  <div className="flex items-center gap-1">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && onSortChange && (
                      <ArrowUpDown className="h-3 w-3 text-muted" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted">
                Loading…
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(onRowClick && 'cursor-pointer')}
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
      {showPagination && pagination && (
        <Pagination pagination={pagination} onPaginationChange={onPaginationChange} />
      )}
    </div>
  );
}

export default ServerDataTable;
