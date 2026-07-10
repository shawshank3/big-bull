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
 *   - listAssets                      → Paginated market listing
 *
 * Authenticated-only patches (skipped when logged out):
 *   - getPortfolioHoldings            → HoldingsContent
 *   - getPortfolioSummary             → Dashboard stat cards
 *   - getTaxHarvesting                → Tax-loss harvesting opportunities
 *   - getTaxSummary (harvestingCount) → Summary card opportunity count
 *
 * Realised gains (`getTaxGains`) and most `getTaxSummary` fields are deliberately
 * NOT patched because their values are derived from historical SELL transactions
 * and do not move with live market prices. Only `getTaxSummary.harvestingCount`
 * is synced from the live harvesting cache.
 *
 * Mounted once at RootLayout level. Cleans up on unmount.
 */
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiSlice } from '@/shared/api/apiSlice';
import { API_URLS } from '@/shared/constants/apiUrls';
import { selectIsAuthenticated } from '@/features/auth';
import { STCG_RATE, LTCG_RATE } from '@/features/tax';

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

      // Patch ALL existing listAssets infinite-query cache entries.
      // The infinite cache shape is { pages: [{ items, pagination }, ...], pageParams: [...] }.
      // We iterate every page in every cached query arg to find and update the matching ticker.
      dispatch((dispatch2, getState) => {
        const state = getState();
        const queries = state?.api?.queries;
        if (!queries) return;

        for (const key of Object.keys(queries)) {
          if (!key.startsWith('listAssets(')) continue;
          const entry = queries[key];
          if (!entry?.data?.pages || entry.status !== 'fulfilled') continue;

          dispatch2(
            apiSlice.util.updateQueryData('listAssets', entry.originalArgs, (draft) => {
              for (const page of draft.pages) {
                const asset = page.items?.find((a) => a.ticker === ticker);
                if (asset) {
                  asset.currentPrice = price;
                  asset.change = change ?? 0;
                  // changePercent arrives as a string like "+1.23%" — parse to number
                  const raw = changePercent ?? '+0.00%';
                  asset.changePercent = parseFloat(raw) || 0;
                  asset.changePercentStr = raw;
                }
              }
            })
          );
        }
      });

      // Patch ALL existing getMarketMovers cache entries (keyed by { limit }).
      // The movers response shape is { gainers: [...], losers: [...] }.
      // For the matched ticker we update price, change, changePercent, and
      // changePercentStr. The sort order is preserved client-side — the backend
      // re-sorts on the next refetch; SSE keeps values current between fetches.
      dispatch((dispatch2, getState) => {
        const state = getState();
        const queries = state?.api?.queries;
        if (!queries) return;

        const raw = changePercent ?? '+0.00%';
        const changePercentNum = parseFloat(raw) || 0;

        for (const key of Object.keys(queries)) {
          if (!key.startsWith('getMarketMovers(')) continue;
          const entry = queries[key];
          if (!entry?.data || entry.status !== 'fulfilled') continue;

          dispatch2(
            apiSlice.util.updateQueryData('getMarketMovers', entry.originalArgs, (draft) => {
              for (const list of [draft.gainers, draft.losers]) {
                const asset = list?.find((a) => a.ticker === ticker);
                if (asset) {
                  asset.currentPrice = price;
                  asset.change = change ?? 0;
                  asset.changePercent = changePercentNum;
                  asset.changePercentStr = raw;
                }
              }
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

      // Patch ALL existing getTaxHarvesting cache entries (keyed by { taxYear, minLoss }).
      // For each opportunity matching the streamed ticker, recompute price-derived
      // fields (currentPrice, unrealizedLoss, estimatedSaving), drop opportunities
      // whose loss has fallen at or below the threshold, then re-sort by
      // estimatedSaving desc to mirror the backend ordering.
      // After patching, sync the harvestingCount in getTaxSummary with the minLoss=0
      // entry to keep the summary card in sync with the actual opportunities list.
      dispatch((dispatch2, getState) => {
        const state = getState();
        const queries = state?.api?.queries;
        if (!queries) return;
        const argsToUpdate = [];
        for (const key of Object.keys(queries)) {
          if (!key.startsWith('getTaxHarvesting(')) continue;
          const entry = queries[key];
          if (!entry?.data?.opportunities || entry.status !== 'fulfilled') continue;
          argsToUpdate.push(entry.originalArgs);
        }
        for (const args of argsToUpdate) {
          dispatch2(
            apiSlice.util.updateQueryData('getTaxHarvesting', args, (draft) => {
              if (!draft?.opportunities?.length) return;
              const minLoss = draft.meta?.minLoss ?? 0;
              let mutated = false;

              for (const opp of draft.opportunities) {
                if (opp.ticker !== ticker) continue;
                const qty = opp.quantity ?? 0;
                const totalCost = qty * (opp.avgCostBasis ?? 0);
                const currentValue = qty * price;
                const unrealizedLoss = Math.max(0, totalCost - currentValue);
                const rate = opp.lossType === 'STCG' ? STCG_RATE : LTCG_RATE;

                opp.currentPrice = price;
                opp.unrealizedLoss = unrealizedLoss;
                opp.estimatedSaving = unrealizedLoss * rate;
                mutated = true;
              }

              if (!mutated) return;

              // Mirror backend filter: drop opportunities below the active threshold
              // (including positions whose price recovered into a gain).
              draft.opportunities = draft.opportunities.filter((o) => o.unrealizedLoss > minLoss);
              // Mirror backend sort: estimatedSaving desc
              draft.opportunities.sort((a, b) => b.estimatedSaving - a.estimatedSaving);
              if (draft.meta) {
                draft.meta.totalOpportunities = draft.opportunities.length;
              }
            })
          );
        }

        // Sync harvestingCount in getTaxSummary from the base (minLoss=0) harvesting
        // cache so the summary card count stays consistent with the opportunities list.
        const updatedState = getState();
        const updatedQueries = updatedState?.api?.queries;
        if (!updatedQueries) return;

        for (const key of Object.keys(updatedQueries)) {
          if (!key.startsWith('getTaxHarvesting(')) continue;
          const entry = updatedQueries[key];
          if (!entry?.data || entry.status !== 'fulfilled') continue;
          // Only use the minLoss=0 entry (matches the backend's harvestingCount logic)
          if (entry.originalArgs?.minLoss !== 0) continue;

          const newCount = entry.data.opportunities?.length ?? 0;
          const taxYear = entry.originalArgs?.taxYear;

          // Patch all matching getTaxSummary entries for the same taxYear
          for (const sKey of Object.keys(updatedQueries)) {
            if (!sKey.startsWith('getTaxSummary(')) continue;
            const sEntry = updatedQueries[sKey];
            if (!sEntry?.data || sEntry.status !== 'fulfilled') continue;
            if (sEntry.originalArgs?.taxYear !== taxYear) continue;

            dispatch2(
              apiSlice.util.updateQueryData('getTaxSummary', sEntry.originalArgs, (draft) => {
                draft.harvestingCount = newCount;
              })
            );
          }
        }
      });
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
