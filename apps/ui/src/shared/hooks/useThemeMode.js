import { useEffect, useState } from 'react';
import { applyThemeMode, getInitialThemeMode, THEME_MODES } from '@/theme';

export const useThemeMode = () => {
  const [themeMode, setThemeMode] = useState(getInitialThemeMode);

  useEffect(() => {
    applyThemeMode(themeMode);
  }, [themeMode]);

  const toggleThemeMode = () => {
    setThemeMode((currentMode) =>
      currentMode === THEME_MODES.DARK ? THEME_MODES.LIGHT : THEME_MODES.DARK
    );
  };

  return { themeMode, toggleThemeMode };
};

export default useThemeMode;
