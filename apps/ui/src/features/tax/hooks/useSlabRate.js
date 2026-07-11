import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'tax_slab_rate';

/**
 * Valid Indian income tax slab rates.
 * Intraday (speculative business income) is taxed at the user's applicable
 * slab rate under Section 43(5). We offer the four standard slabs.
 * Default is 0.30 (30%) — the highest slab, a conservative worst-case estimate.
 */
export const INTRADAY_SLAB_RATES = [
  { value: 0.05, label: '5%' },
  { value: 0.1, label: '10%' },
  { value: 0.2, label: '20%' },
  { value: 0.3, label: '30%' },
];

const VALID_RATES = new Set(INTRADAY_SLAB_RATES.map((r) => r.value));
const DEFAULT_RATE = 0.3;

/**
 * Reads and validates the persisted slab rate from localStorage.
 * Returns DEFAULT_RATE (30%) when nothing is stored or the value is invalid.
 */
function readStoredSlabRate() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored == null) return DEFAULT_RATE;
    const parsed = Number(stored);
    return VALID_RATES.has(parsed) ? parsed : DEFAULT_RATE;
  } catch {
    return DEFAULT_RATE;
  }
}

/**
 * Module-level external store for the intraday tax slab rate.
 *
 * Uses the same useSyncExternalStore pattern as useThreshold so that all
 * consumers (TaxSummaryCard, WhatIfSimulator, SlabRateConfig) share a single
 * source of truth backed by localStorage.
 */
let currentSlabRate = readStoredSlabRate();
const subscribers = new Set();

function emit() {
  for (const subscriber of subscribers) subscriber();
}

function subscribe(listener) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

function getSnapshot() {
  return currentSlabRate;
}

/**
 * Updates the slab rate, persists it to localStorage, and notifies all
 * subscribed components.
 *
 * @param {number} value - Must be one of the values in INTRADAY_SLAB_RATES
 */
export function setSlabRate(value) {
  if (!VALID_RATES.has(value)) return;
  if (value === currentSlabRate) return;
  currentSlabRate = value;
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // localStorage may be unavailable — fail silently
  }
  emit();
}

// Keep the in-memory value in sync across tabs/windows.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    const next = readStoredSlabRate();
    if (next === currentSlabRate) return;
    currentSlabRate = next;
    emit();
  });
}

/**
 * Custom hook for reading/updating the intraday tax slab rate.
 * All consumers share a single source of truth backed by localStorage.
 *
 * @returns {{ slabRate: number, setSlabRate: (value: number) => void, slabRateLabel: string }}
 */
export function useSlabRate() {
  const slabRate = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const slabRateLabel = INTRADAY_SLAB_RATES.find((r) => r.value === slabRate)?.label ?? '30%';
  return { slabRate, setSlabRate, slabRateLabel };
}
