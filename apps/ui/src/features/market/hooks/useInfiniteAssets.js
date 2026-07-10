import { useState, useCallback, useRef } from 'react';
import { useListAssetsInfiniteQuery } from '../api/marketApi';
import { MARKET_LIST_PAGE_SIZE } from '../constants/market';

/**
 * useInfiniteAssets
 *
 * Drives the infinite-scroll market assets list using RTK Query's native
 * `infiniteQuery` endpoint. RTK owns the pages array and the `fetchNextPage`
 * trigger — no manual accumulation, no page counter, no pendingReset ref.
 *
 * ### IntersectionObserver via ref callback (no useEffect)
 * The `sentinelRef` returned here is a stable `useCallback` ref function.
 * React calls it with the real DOM node when the sentinel mounts, and with
 * `null` on unmount. Inside the callback we create the observer, attach it,
 * and store a disconnect function on the node for teardown — avoiding the
 * async timing bugs and Strict Mode double-instantiation that come with
 * `useEffect` + `useRef`.
 *
 * The observer's callback reads `isFetching` and `hasNextPage` through refs
 * so the IntersectionObserver closure is always current without needing to
 * be re-created on every render.
 *
 * @param {{ pageSize?: number }} [options]
 * @returns {{
 *   allAssets:          Array,
 *   total:              number,
 *   hasNextPage:        boolean,
 *   isLoading:          boolean,
 *   isFetching:         boolean,
 *   isError:            boolean,
 *   activeType:         string,
 *   search:             string,
 *   sentinelRef:        (node: HTMLElement|null) => void,
 *   handleTabChange:    (value: string) => void,
 *   handleSearchChange: (term: string) => void,
 *   handleSortChange:   (sort: object|undefined) => void,
 * }}
 */
export const useInfiniteAssets = ({ pageSize = MARKET_LIST_PAGE_SIZE } = {}) => {
  const [activeType, setActiveType] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState(undefined);

  const { data, isLoading, isFetching, isError, fetchNextPage, hasNextPage } =
    useListAssetsInfiniteQuery({
      filters: activeType ? { assetType: activeType } : {},
      search,
      sort,
      limit: pageSize,
    });

  // Flat list of all accumulated assets across pages.
  // RTK stores each page's response; we flatten here.
  const allAssets = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[data.pages.length - 1]?.pagination?.total ?? 0;

  // Live refs so the IntersectionObserver closure never goes stale.
  const isFetchingRef = useRef(false);
  const hasNextPageRef = useRef(false);
  const fetchNextPageRef = useRef(fetchNextPage);
  isFetchingRef.current = isFetching;
  hasNextPageRef.current = hasNextPage ?? false;
  fetchNextPageRef.current = fetchNextPage;

  /**
   * Ref callback for the sentinel element at the bottom of the list.
   *
   * React invokes this with the DOM node on mount and `null` on unmount.
   * The observer is created once, reads live state via refs, and is
   * disconnected when the sentinel leaves the DOM — no useEffect needed.
   */
  const sentinelRef = useCallback((node) => {
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPageRef.current && !isFetchingRef.current) {
          fetchNextPageRef.current();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    // Store cleanup on the node; React ignores ref-callback return values
    node._ioCleanup = () => observer.disconnect();
  }, []); // stable — all mutable state accessed through refs

  const handleTabChange = useCallback((value) => {
    setActiveType(value);
  }, []);

  const handleSearchChange = useCallback((term) => {
    setSearch(term);
  }, []);

  const handleSortChange = useCallback((newSort) => {
    setSort(newSort);
  }, []);

  return {
    allAssets,
    total,
    hasNextPage: hasNextPage ?? false,
    isLoading,
    isFetching,
    isError,
    activeType,
    search,
    sentinelRef,
    handleTabChange,
    handleSearchChange,
    handleSortChange,
  };
};

export default useInfiniteAssets;
