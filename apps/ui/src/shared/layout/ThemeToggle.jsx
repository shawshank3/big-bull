import { useThemeMode } from '@/shared/hooks/useThemeMode';
import { Button } from '@/shared/ui/button';

export const ThemeToggle = () => {
  const { themeMode, toggleThemeMode } = useThemeMode();
  return (
    <Button
      type="button"
      variant="outline"
      size="md"
      className="shrink-0 px-2.5 sm:px-3 sm:text-base"
      onClick={toggleThemeMode}
      aria-label="Toggle theme"
    >
      <span aria-hidden>{themeMode === 'dark' ? '☀️' : '🌙'}</span>
      <span className="hidden xl:inline">{themeMode === 'dark' ? ' Light' : ' Dark'}</span>
    </Button>
  );
};

export default ThemeToggle;
