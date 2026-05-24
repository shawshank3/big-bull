import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { ROUTES } from '../../constants/routes';
import { useThemeMode } from '../../hooks/useThemeMode';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const navItems = [
  { label: 'Dashboard', to: ROUTES.DASHBOARD },
  { label: 'Holdings', to: ROUTES.HOLDINGS },
];

export const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { themeMode, toggleThemeMode } = useThemeMode();

  const userInitial = useMemo(() => user?.name?.[0]?.toUpperCase() || 'U', [user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Button variant="ghost" className="h-auto gap-2 px-2 py-1.5" asChild>
          <Link to={ROUTES.ROOT}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
              BB
            </span>
            <span className="text-lg font-bold text-foreground">BigBull</span>
          </Link>
        </Button>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Button key={item.to} variant="ghost" size="sm" asChild>
              <Link to={item.to}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={toggleThemeMode}
            aria-label="Toggle theme"
          >
            {themeMode === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-auto gap-2 px-2 py-1.5">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-semibold sm:inline">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs font-medium text-muted">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
