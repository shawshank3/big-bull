/**
 * useMarketStream
 *
 * Connects to the SSE endpoint at /api/v1/market/stream and patches the RTK
 * Query cache in-place whenever a `price_update` event arrives.
 *
 * Patched caches:
 *   - getStockQuote / getMutualQuote  → StockDetailContent / MutualDetailContent
 *   - getTickerQuotes                 → TickerStrip
 *   - getAssets                       → MarketContent (asset list with live prices)
 *   - getPortfolioHoldings            → HoldingsContent (currentPrice, P&L, value)
 *   - getPortfolioSummary             → Dashboard stat cards (currentValue, totalPnL, %)
 *
 * Mounted once at RootLayout level. Cleans up on unmount.
 */
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiSlice } from '@/shared/api/apiSlice';
import { API_URLS } from '@/shared/constants/apiUrls';

export const useMarketStream = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const esRef = useRef(null);

  useEffect(() => {
    // Only open the stream when the user is logged in
    if (!isAuthenticated) return;

    // Avoid duplicate connections (React StrictMode double-invocation)
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

      // ── Patch getStockQuote / getMutualQuote cache ─────────────────────────
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

      // ── Patch getTickerQuotes cache ────────────────────────────────────────
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

      // ── Patch getAssets cache (market page asset list) ─────────────────────
      // getAssets can be called with or without a type filter — patch all variants.
      for (const queryArg of [undefined, { type: 'STOCK' }, { type: 'MUTUAL_FUND' }]) {
        dispatch(
          apiSlice.util.updateQueryData('getAssets', queryArg, (draft) => {
            const asset = draft.find((a) => a.ticker === ticker);
            if (asset) {
              asset.currentPrice = price;
            }
          })
        );
      }

      // ── Patch getPortfolioHoldings + getPortfolioSummary ──────────────────
      // Step 1: patch per-holding fields in getPortfolioHoldings.
      // Step 2: read the now-updated holdings from the store via a thunk and
      //         recompute the summary totals — same formulas as portfolio.service.js.
      dispatch(
        apiSlice.util.updateQueryData('getPortfolioHoldings', undefined, (draft) => {
          // First pass: update the holding that matches this ticker
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

          // Second pass: recalculate portfolioWeight across all holdings
          const totalPortfolioValue = draft.reduce((sum, h) => sum + (h.currentValue ?? 0), 0);
          for (const holding of draft) {
            holding.portfolioWeight =
              totalPortfolioValue > 0 ? (holding.currentValue / totalPortfolioValue) * 100 : 0;
          }
        })
      );

      // Step 2: recompute summary from the freshly patched holdings via a thunk.
      // Using a thunk gives us getState so we can read the updated holdings cache.
      dispatch((_dispatch, getState) => {
        const state = getState();
        const holdingsResult = apiSlice.endpoints.getPortfolioHoldings.select(undefined)(state);
        const holdings = holdingsResult?.data;
        if (!holdings?.length) return;

        const totalInvested = holdings.reduce((sum, h) => sum + (h.totalInvested ?? 0), 0);
        const currentValue = holdings.reduce((sum, h) => sum + (h.currentValue ?? 0), 0);
        const totalPnL = currentValue - totalInvested;
        const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

        _dispatch(
          apiSlice.util.updateQueryData('getPortfolioSummary', undefined, (draft) => {
            draft.currentValue = currentValue;
            draft.totalPnL = totalPnL;
            draft.totalPnLPercent = totalPnLPercent;
          })
        );
      });
    });

    es.onerror = (err) => {
      console.warn('[MSE] SSE stream error — will reconnect automatically', err);
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [isAuthenticated, dispatch]);
};

export default useMarketStream;
