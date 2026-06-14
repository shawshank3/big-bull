// ---------------------------------------------------------------------------
// Internal safe-default helpers
// Exported so each DTO module can import them.
// ---------------------------------------------------------------------------

export const str = (v, d = '') => (typeof v === 'string' ? v : d);
export const num = (v, d = 0) => (typeof v === 'number' && isFinite(v) ? v : d);
export const bool = (v, d = false) => (typeof v === 'boolean' ? v : d);
export const arr = (v) => (Array.isArray(v) ? v : []);
