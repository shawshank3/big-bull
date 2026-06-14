import { getFromLocalStorage, saveToLocalStorage } from '@/shared/utils';
import { THEME_MODES, THEME_STORAGE_KEY } from '../constants';

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
