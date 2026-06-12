import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Loader2 } from 'lucide-react';
import { useMarketSearch } from '../../hooks/useMarketSearch';
import {
  MARKET_ASSET_BADGE_LABELS,
  MARKET_ASSET_TYPES,
  MARKET_SEARCH,
  buildMutualDetailPath,
  buildStockDetailPath,
} from '../../constants/market';
import { cn } from '@/lib/utils';

export const NavbarSearch = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const {
    query,
    setQuery,
    stocks,
    mutuals,
    isFetching,
    isEmpty,
    isError,
    hasMinLength,
  } = useMarketSearch();

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const showDropdown = isOpen && query.trim().length > 0;

  const handleSelect = (item) => {
    setIsOpen(false);
    setQuery('');

    if (item.type === MARKET_ASSET_TYPES.STOCK) {
      navigate(buildStockDetailPath(item.symbol), {
        state: { name: item.name, region: item.region },
      });
      return;
    }

    navigate(buildMutualDetailPath(item.schemeCode), {
      state: { name: item.name },
    });
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={MARKET_SEARCH.PLACEHOLDER}
        aria-label="Search stocks and mutual funds"
        aria-expanded={showDropdown}
        aria-controls="navbar-market-search-results"
        className="h-10 w-full"
        autoComplete="off"
      />

      {showDropdown ? (
        <div
          id="navbar-market-search-results"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-[min(24rem,70vh)] overflow-y-auto rounded-2xl border border-border bg-surface shadow-soft"
        >
          {!hasMinLength ? (
            <p className="px-4 py-3 text-sm text-muted">
              Type at least {MARKET_SEARCH.MIN_LENGTH} characters to search.
            </p>
          ) : null}

          {hasMinLength && isFetching ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
              Searching…
            </div>
          ) : null}

          {hasMinLength && isError ? (
            <p className="px-4 py-3 text-sm text-danger">
              Search unavailable. Try again in a moment.
            </p>
          ) : null}

          {hasMinLength && isEmpty ? (
            <p className="px-4 py-3 text-sm text-muted">No stocks or mutual funds found.</p>
          ) : null}

          {hasMinLength && stocks.length > 0 ? (
            <SearchResultSection title="Stocks" items={stocks} onSelect={handleSelect} />
          ) : null}

          {hasMinLength && mutuals.length > 0 ? (
            <SearchResultSection title="Mutual funds" items={mutuals} onSelect={handleSelect} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const SearchResultSection = ({ title, items, onSelect }) => (
  <section className="border-t border-border first:border-t-0">
    <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
    <ul>
      {items.map((item) => (
        <li key={`${item.type}-${item.id}`}>
          <button
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
              'hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none'
            )}
          >
            <Badge variant={item.type === MARKET_ASSET_TYPES.MUTUAL ? 'info' : 'warning'}>
              {MARKET_ASSET_BADGE_LABELS[item.type]}
            </Badge>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {item.name}
              </span>
              <span className="block truncate text-xs text-muted">
                {item.type === MARKET_ASSET_TYPES.STOCK
                  ? item.symbol
                  : `Scheme ${item.schemeCode}`}
                {item.region ? ` · ${item.region}` : ''}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  </section>
);

export default NavbarSearch;
