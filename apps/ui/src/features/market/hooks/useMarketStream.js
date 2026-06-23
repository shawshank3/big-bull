/**
 * useMarketStream
 *
 * Opens a single SSE connection to /api/v1/market/stream (public endpoint)
 * and patches RTK Query caches on every price_update event.
 *
 * Public patches (always run):
 *   - getStockQuote / getMutualQuote  → StockDetailContent / MutualDetailContent
 *   - getTickerQuotes                 → TickerStrip
 *   - getAssets                       → MarketContent
 *
 * Authenticated-only patches (skipped when logged out):
 *   - getPortfolioHoldings            → HoldingsContent
 *   - getPortfolioSummary             → Dashboard stat cards
 *
 * Mounted once at RootLayout level. Cleans up on unmount.
 */
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiSlice } from '@/shared/api/apiSlice';
import { API_URLS } from '@/shared/constants/apiUrls';
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors';

export const useMarketStream = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAuthenticatedRef = useRef(isAuthenticated);

  // Keep the ref in sync so the event handler always reads the current value
  // without needing to re-create the EventSource on auth state changes.
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const esRef = useRef(null);

  useEffect(() => {
    if (esRef.current) return;

    const es = new EventSource(API_URLS.MARKET.STREAM, { withCredentials: true });
    esRef.current = es;

    es.addEventListener('connected', () => {
      console.log('[MSE] SSE stream connected');
    });

    es.addEventListener('price_update', (e) => {
      let payload;
      try {
        payload = JSON.parse(e.data);
      } catch (_) {
        return;
      }

      const { ticker, price, change, changePercent, up } = payload;
      if (!ticker || price == null) return;

      // ── Public cache patches ───────────────────────────────────────────────

      dispatch(
        apiSlice.util.updateQueryData('getStockQuote', ticker, (draft) => {
          draft.price = price;
          draft.change = change ?? 0;
          draft.changePercent = changePercent ?? '0.00%';
        })
      );
      dispatch(
        apiSlice.util.updateQueryData('getMutualQuote', ticker, (draft) => {
          draft.price = price;
          draft.change = change ?? 0;
          draft.changePercent = changePercent ?? '0.00%';
        })
      );

      dispatch(
        apiSlice.util.updateQueryData('getTickerQuotes', undefined, (draft) => {
          const item = draft.find((q) => q.symbol === ticker);
          if (item) {
            item.price = price;
            item.change = change ?? 0;
            item.changePercent = changePercent ?? '0.00%';
            item.up = up ?? change >= 0;
          }
        })
      );

      for (const queryArg of [undefined, { type: 'STOCK' }, { type: 'MUTUAL_FUND' }]) {
        dispatch(
          apiSlice.util.updateQueryData('getAssets', queryArg, (draft) => {
            const asset = draft.find((a) => a.ticker === ticker);
            if (asset) asset.currentPrice = price;
          })
        );
      }

      // Patch ALL existing listAssets cache entries (new server-paginated endpoint)
      dispatch((dispatch2, getState) => {
        const state = getState();
        const queries = state?.api?.queries;
        if (!queries) return;
        const argsToUpdate = [];
        for (const key of Object.keys(queries)) {
          if (!key.startsWith('listAssets(')) continue;
          const entry = queries[key];
          if (!entry?.data?.items || entry.status !== 'fulfilled') continue;
          argsToUpdate.push(entry.originalArgs);
        }
        for (const args of argsToUpdate) {
          dispatch2(
            apiSlice.util.updateQueryData('listAssets', args, (draft) => {
              const asset = draft.items?.find((a) => a.ticker === ticker);
              if (asset) asset.currentPrice = price;
            })
          );
        }
      });

      // ── Authenticated-only cache patches ──────────────────────────────────
      if (!isAuthenticatedRef.current) return;

      let summaryTotals = null;

      dispatch(
        apiSlice.util.updateQueryData('getPortfolioHoldings', undefined, (draft) => {
          for (const holding of draft) {
            if (holding.ticker !== ticker) continue;

            const qty = holding.netQuantity ?? holding.qty ?? 0;
            const totalInvested = holding.totalInvested ?? qty * (holding.avgCostBasis ?? 0);
            const currentValue = qty * price;
            const unrealisedPnL = currentValue - totalInvested;
            const unrealisedPnLPercent =
              totalInvested > 0 ? (unrealisedPnL / totalInvested) * 100 : 0;

            holding.currentPrice = price;
            holding.currentValue = currentValue;
            holding.unrealisedPnL = unrealisedPnL;
            holding.unrealisedPnLPercent = unrealisedPnLPercent;
          }

          const totalPortfolioValue = draft.reduce((sum, h) => sum + (h.currentValue ?? 0), 0);
          for (const holding of draft) {
            holding.portfolioWeight =
              totalPortfolioValue > 0 ? (holding.currentValue / totalPortfolioValue) * 100 : 0;
          }

          const totalInvested = draft.reduce((sum, h) => sum + (h.totalInvested ?? 0), 0);
          const currentValue = draft.reduce((sum, h) => sum + (h.currentValue ?? 0), 0);
          const totalPnL = currentValue - totalInvested;
          const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
          summaryTotals = { currentValue, totalPnL, totalPnLPercent };
        })
      );

      if (summaryTotals) {
        dispatch(
          apiSlice.util.updateQueryData('getPortfolioSummary', undefined, (draft) => {
            draft.currentValue = summaryTotals.currentValue;
            draft.totalPnL = summaryTotals.totalPnL;
            draft.totalPnLPercent = summaryTotals.totalPnLPercent;
          })
        );
      }
    });

    es.onerror = () => {
      console.warn('[MSE] SSE stream error — will reconnect automatically');
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [dispatch]);
};

export default useMarketStream;
