import { useThemeMode } from '../../hooks/useThemeMode';
import { Button } from '../ui/button';

export const ThemeToggle = () => {
  const { themeMode, toggleThemeMode } = useThemeMode();

  return (
    <Button
      type="button"
      variant="outline"
      className="text-base"
      onClick={toggleThemeMode}
      aria-label="Toggle theme"
    >
      {themeMode === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </Button>
  );
};

export default ThemeToggle;
