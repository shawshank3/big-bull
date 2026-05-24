import { getFromLocalStorage, saveToLocalStorage } from '../utils/localStorage';

export const THEME_MODES = Object.freeze({
  LIGHT: 'light',
  DARK: 'dark',
});

export const THEME_STORAGE_KEY = 'bigbull-theme-mode';

export const THEME_TOKENS = Object.freeze({
  light: {
    bg: '#f8fafc',
    surface: '#ffffff',
    foreground: '#0f172a',
    muted: '#475569',
    border: '#cbd5e1',
    primary: '#2563eb',
    secondary: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    info: '#2563eb',
  },
  dark: {
    bg: '#020617',
    surface: '#111827',
    foreground: '#f8fafc',
    muted: '#cbd5e1',
    border: '#334155',
    primary: '#60a5fa',
    secondary: '#34d399',
    danger: '#f87171',
    warning: '#fbbf24',
    success: '#34d399',
    info: '#60a5fa',
  },
});

export const getInitialThemeMode = () => {
  const storedTheme = getFromLocalStorage(THEME_STORAGE_KEY);

  if (storedTheme === THEME_MODES.LIGHT || storedTheme === THEME_MODES.DARK) {
    return storedTheme;
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? THEME_MODES.DARK
      : THEME_MODES.LIGHT;
  }

  return THEME_MODES.LIGHT;
};

export const applyThemeMode = (themeMode) => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle('dark', themeMode === THEME_MODES.DARK);
  root.setAttribute('data-theme', themeMode);
  root.style.colorScheme = themeMode;
  saveToLocalStorage(THEME_STORAGE_KEY, themeMode);
};

export default THEME_TOKENS;
