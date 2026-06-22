import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppPageLayout } from '@/shared/layout/AppPageLayout';
import { PageHeader } from '@/shared/layout/PageHeader';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Spinner } from '@/shared/ui/spinner';
import { Search as SearchIcon } from 'lucide-react';
import { useMarketSearch } from '../hooks/useMarketSearch';
import {
  MARKET_ASSET_BADGE_LABELS,
  MARKET_ASSET_TYPES,
  MARKET_SEARCH,
  buildStockDetailPath,
  buildMutualDetailPath,
} from '../constants/market';

const PAGE_SIZE = 10;

export const Search = () => {
  const navigate = useNavigate();
  const { query, setQuery, stocks, mutuals, isFetching, isEmpty, isError, hasMinLength } =
    useMarketSearch();

  const [currentPage, setCurrentPage] = useState(1);

  // Combine stocks and mutuals into a single list for table display
  const allResults = useMemo(() => {
    if (!hasMinLength) return [];
    return [...stocks, ...mutuals];
  }, [stocks, mutuals, hasMinLength]);

  const totalPages = Math.max(1, Math.ceil(allResults.length / PAGE_SIZE));
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return allResults.slice(start, start + PAGE_SIZE);
  }, [allResults, currentPage]);

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleRowClick = (item) => {
    if (item.type === MARKET_ASSET_TYPES.STOCK) {
      navigate(buildStockDetailPath(item.symbol), {
        state: { name: item.name, region: item.region },
      });
      return;
    }
    navigate(buildMutualDetailPath(item.schemeCode), { state: { name: item.name } });
  };

  return (
    <AppPageLayout>
      <AppPageLayout.Content>
        <PageHeader
          title="Search"
          description="Search stocks and mutual funds across the market."
        />

        {/* Search Input */}
        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
          <Input
            type="search"
            value={query}
            onChange={handleSearchChange}
            placeholder={MARKET_SEARCH.PLACEHOLDER}
            aria-label="Search stocks and mutual funds"
            className="h-12 w-full pl-10 text-base"
            autoComplete="off"
            autoFocus
          />
        </div>

        {/* Results */}
        {!hasMinLength && query.trim().length > 0 && (
          <p className="text-sm text-muted">
            Type at least {MARKET_SEARCH.MIN_LENGTH} characters to search.
          </p>
        )}

        {hasMinLength && isFetching && <Spinner label="Searching…" />}

        {hasMinLength && isError && (
          <p className="text-sm text-danger">Search unavailable. Try again in a moment.</p>
        )}

        {hasMinLength && isEmpty && !isFetching && (
          <Card>
            <CardContent className="py-12 text-center text-muted">
              No stocks or mutual funds found for &ldquo;{query.trim()}&rdquo;.
            </CardContent>
          </Card>
        )}

        {hasMinLength && allResults.length > 0 && !isFetching && (
          <Card>
            <CardContent className="p-0">
              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-semibold text-muted">Type</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted">Name</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted">
                        Symbol / Code
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted">Region</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedResults.map((item) => (
                      <tr
                        key={`${item.type}-${item.id}`}
                        onClick={() => handleRowClick(item)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRowClick(item)}
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none"
                      >
                        <td className="px-4 py-3">
                          <Badge
                            variant={item.type === MARKET_ASSET_TYPES.MUTUAL ? 'info' : 'warning'}
                          >
                            {MARKET_ASSET_BADGE_LABELS[item.type]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          <span className="block max-w-[250px] truncate">{item.name}</span>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {item.type === MARKET_ASSET_TYPES.STOCK
                            ? item.symbol
                            : `Scheme ${item.schemeCode}`}
                        </td>
                        <td className="px-4 py-3 text-muted">{item.region ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border px-4 py-3">
                  <p className="text-sm text-muted">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, allResults.length)} of {allResults.length}{' '}
                    results
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-muted">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </AppPageLayout.Content>
    </AppPageLayout>
  );
};

export default Search;
