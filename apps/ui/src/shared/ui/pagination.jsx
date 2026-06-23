// Tier 2 — Prop-Based Component
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/select';

/**
 * Pagination — Unified pagination bar for data tables.
 *
 * Supports two modes:
 * - Client Mode: pass a @tanstack/react-table `table` instance
 * - Server Mode: pass `pagination` object + `onPaginationChange` callback
 *
 * If both `table` and `pagination` are provided, Client Mode takes priority.
 * If neither sufficient set is provided, renders null.
 *
 * @param {Object} props
 * @param {import('@tanstack/react-table').Table} [props.table] - Table instance (Client Mode)
 * @param {Object} [props.pagination] - Server pagination state
 * @param {number} props.pagination.page - Current page (1-indexed)
 * @param {number} props.pagination.limit - Rows per page
 * @param {number} props.pagination.totalPages - Total number of pages
 * @param {boolean} props.pagination.hasNextPage - Whether next page exists
 * @param {boolean} props.pagination.hasPrevPage - Whether previous page exists
 * @param {Function} [props.onPaginationChange] - ({ page, limit }) => void (Server Mode)
 */
export function Pagination({ table, pagination, onPaginationChange }) {
  // Determine mode
  const isClientMode = Boolean(table);
  const isServerMode = !isClientMode && Boolean(pagination) && Boolean(onPaginationChange);

  // If neither mode is valid, render nothing
  if (!isClientMode && !isServerMode) return null;

  // Derived state abstraction
  const state = isClientMode
    ? {
        currentPage: table.getState().pagination.pageIndex + 1,
        totalPages: table.getPageCount(),
        pageSize: table.getState().pagination.pageSize,
        canPrevious: table.getCanPreviousPage(),
        canNext: table.getCanNextPage(),
      }
    : {
        currentPage: pagination.page,
        totalPages: pagination.totalPages,
        pageSize: pagination.limit,
        canPrevious: pagination.hasPrevPage,
        canNext: pagination.hasNextPage,
      };

  // Navigation actions
  const actions = isClientMode
    ? {
        firstPage: () => table.setPageIndex(0),
        prevPage: () => table.previousPage(),
        nextPage: () => table.nextPage(),
        lastPage: () => table.setPageIndex(table.getPageCount() - 1),
        setPageSize: (size) => table.setPageSize(Number(size)),
      }
    : {
        firstPage: () => onPaginationChange({ page: 1, limit: pagination.limit }),
        prevPage: () => onPaginationChange({ page: pagination.page - 1, limit: pagination.limit }),
        nextPage: () => onPaginationChange({ page: pagination.page + 1, limit: pagination.limit }),
        lastPage: () =>
          onPaginationChange({ page: pagination.totalPages, limit: pagination.limit }),
        setPageSize: (size) => onPaginationChange({ page: 1, limit: Number(size) }),
      };

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span>Rows per page</span>
        <Select value={`${state.pageSize}`} onValueChange={actions.setPageSize}>
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={state.pageSize} />
          </SelectTrigger>
          <SelectContent side="top">
            {[5, 10, 20, 30, 50].map((size) => (
              <SelectItem key={size} value={`${size}`}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">
          Page {state.currentPage} of {state.totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={actions.firstPage}
            disabled={!state.canPrevious}
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={actions.prevPage}
            disabled={!state.canPrevious}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={actions.nextPage}
            disabled={!state.canNext}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={actions.lastPage}
            disabled={!state.canNext}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
