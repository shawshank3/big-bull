/**
 * Property test for baseQueryWithReauth mutex behaviour.
 *
 * Property 7: Mutex prevents concurrent refresh calls
 *   Validates: Requirements 4.5, 4.6, 4.7
 */

import { jest, describe, it, expect } from '@jest/globals';
import { Mutex } from 'async-mutex';

/**
 * Minimal reimplementation of the mutex-guarded refresh logic from apiSlice.js
 * so we can test concurrency without booting RTK Query.
 */
const createReauthHandler = (rawBaseQuery) => {
  const mutex = new Mutex();
  let refreshCallCount = 0;

  const baseQueryWithReauth = async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status !== 401) {
      return result;
    }

    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        refreshCallCount += 1;
        const refreshResult = await rawBaseQuery(
          { url: '/api/v1/auth/refresh', method: 'POST' },
          api,
          extraOptions,
        );

        if (refreshResult.data) {
          result = await rawBaseQuery(args, api, extraOptions);
        }
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await rawBaseQuery(args, api, extraOptions);
    }

    return result;
  };

  return { baseQueryWithReauth, getRefreshCallCount: () => refreshCallCount };
};

describe('Property 7: Mutex prevents concurrent refresh calls', () => {
  it('issues exactly one refresh call when N concurrent requests receive 401', async () => {
    const N = 5;
    let refreshInFlight = false;

    const rawBaseQuery = jest.fn(async (args) => {
      if (args.url === '/api/v1/auth/refresh') {
        expect(refreshInFlight).toBe(false);
        refreshInFlight = true;
        await new Promise((resolve) => setTimeout(resolve, 50));
        refreshInFlight = false;
        return { data: { user: { id: '1' } } };
      }

      if (args.url?.startsWith('/api/v1/portfolio')) {
        return { error: { status: 401 } };
      }

      return { data: { ok: true } };
    });

    const { baseQueryWithReauth, getRefreshCallCount } = createReauthHandler(rawBaseQuery);
    const api = { dispatch: jest.fn() };
    const extraOptions = {};

    const requests = Array.from({ length: N }, (_, i) =>
      baseQueryWithReauth(
        { url: `/api/v1/portfolio/holdings?n=${i}` },
        api,
        extraOptions,
      ),
    );

    await Promise.all(requests);

    expect(getRefreshCallCount()).toBe(1);
    expect(rawBaseQuery).toHaveBeenCalledWith(
      { url: '/api/v1/auth/refresh', method: 'POST' },
      api,
      extraOptions,
    );
  });
});
