import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'tax_minLoss_threshold';

/**
 * Reads and validates the persisted threshold from localStorage.
 * Returns 0 when nothing is stored or the value is invalid.
 */
function readStoredThreshold() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored == null) return 0;
    const parsed = Number(stored);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

/**
 * Module-level external store for the minLoss threshold.
 *
 * Why an external store: `useState` inside a hook creates a separate state
 * instance per component. Multiple consumers (e.g. ThresholdConfig and
 * TaxHarvesting) would each hold an isolated copy and never see each other's
 * updates, so RTK Query would not re-key its cache when the threshold
 * changes. A single module-scoped value with a subscriber set ensures every
 * `useThreshold()` consumer re-renders when the value changes.
 */
let currentThreshold = readStoredThreshold();
const subscribers = new Set();

function emit() {
  for (const subscriber of subscribers) subscriber();
}

function subscribe(listener) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

function getSnapshot() {
  return currentThreshold;
}

/**
 * Updates the threshold, persists it to localStorage, and notifies all
 * subscribed components.
 */
export function setThreshold(value) {
  const numValue = Number(value);
  const safeValue = Number.isFinite(numValue) && numValue >= 0 ? numValue : 0;
  if (safeValue === currentThreshold) return;
  currentThreshold = safeValue;
  try {
    localStorage.setItem(STORAGE_KEY, String(safeValue));
  } catch {
    // localStorage may be unavailable — fail silently
  }
  emit();
}

// Keep the in-memory value in sync across tabs/windows.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    const next = readStoredThreshold();
    if (next === currentThreshold) return;
    currentThreshold = next;
    emit();
  });
}

/**
 * Custom hook for reading/updating the minLoss threshold.
 * All consumers share a single source of truth backed by localStorage.
 *
 * @returns {{ threshold: number, setThreshold: (value: number) => void }}
 */
export function useThreshold() {
  const threshold = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { threshold, setThreshold };
}
