import { useEffect, useState } from 'react';
import { useLazySearchMarketQuery } from '../api/marketApi';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { MARKET_SEARCH } from '../constants/market';

export const useMarketSearch = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, MARKET_SEARCH.DEBOUNCE_MS);
  const [searchMarket, { data, isFetching, isError, error }] = useLazySearchMarketQuery();

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < MARKET_SEARCH.MIN_LENGTH) return;
    searchMarket(trimmed);
  }, [debouncedQuery, searchMarket]);

  const trimmedQuery = query.trim();
  const hasMinLength = trimmedQuery.length >= MARKET_SEARCH.MIN_LENGTH;
  const stocks = hasMinLength ? (data?.stocks ?? []) : [];
  const mutuals = hasMinLength ? (data?.mutuals ?? []) : [];
  const isEmpty = hasMinLength && !isFetching && stocks.length === 0 && mutuals.length === 0;

  return {
    query,
    setQuery,
    stocks,
    mutuals,
    isFetching: hasMinLength && isFetching,
    isEmpty,
    isError: hasMinLength && isError,
    error,
    hasMinLength,
  };
};

export default useMarketSearch;
