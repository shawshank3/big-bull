import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

/**
 * ServerDataTablePagination
 *
 * A pagination bar for server-side paginated tables.
 * Renders page info, page-size selector, and navigation buttons.
 *
 * @param {object} props
 * @param {object} props.pagination - { page, limit, total, totalPages, hasNextPage, hasPrevPage }
 * @param {Function} props.onPaginationChange - ({ page, limit }) => void
 */
export function ServerDataTablePagination({ pagination, onPaginationChange }) {
  const { page, limit, totalPages, hasNextPage, hasPrevPage } = pagination;

  const handlePageSizeChange = (newSize) => {
    onPaginationChange({ page: 1, limit: Number(newSize) });
  };

  return (
    <div className="flex items-center justify-between gap-7 sm:gap-2 border-t border-border px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span>Rows per page</span>
        <Select value={`${limit}`} onValueChange={handlePageSizeChange}>
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue placeholder={limit} />
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
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPaginationChange({ page: 1, limit })}
            disabled={!hasPrevPage}
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPaginationChange({ page: page - 1, limit })}
            disabled={!hasPrevPage}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPaginationChange({ page: page + 1, limit })}
            disabled={!hasNextPage}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPaginationChange({ page: totalPages, limit })}
            disabled={!hasNextPage}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
