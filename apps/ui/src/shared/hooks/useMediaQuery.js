import { useSyncExternalStore } from 'react';

/**
 * useMediaQuery
 *
 * Returns `true` while the given media query matches, `false` otherwise.
 * Updates reactively when the viewport changes.
 *
 * @param {string} query - A valid CSS media query string, e.g. '(max-width: 639px)'
 * @returns {boolean}
 */
export function useMediaQuery(query) {
  const subscribe = (callback) => {
    const mql = window.matchMedia(query);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  };

  const getSnapshot = () => window.matchMedia(query).matches;

  // SSR-safe server snapshot (always false — no viewport on the server)
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default useMediaQuery;
