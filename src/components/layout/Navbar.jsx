import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { ROUTES } from '../../constants/routes';
import { useThemeMode } from '../../hooks/useThemeMode';

const navItems = [
  { label: 'Dashboard', to: ROUTES.DASHBOARD },
  { label: 'Holdings', to: ROUTES.HOLDINGS },
  { label: 'Portfolio', to: ROUTES.PORTFOLIO },
];

export const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { themeMode, toggleThemeMode } = useThemeMode();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const userInitial = useMemo(() => user?.name?.[0]?.toUpperCase() || 'U', [user]);

  const handleLogout = () => {
    setIsMenuOpen(false);
    dispatch(logout());
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to={ROUTES.ROOT} className="flex items-center gap-2 rounded-xl px-2 py-1.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
            BB
          </span>
          <span className="text-lg font-bold text-foreground">BigBull</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-muted transition hover:bg-surface hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleThemeMode}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground"
            aria-label="Toggle theme"
          >
            {themeMode === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen((current) => !current)}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2 py-1.5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-slate-950">
                  {userInitial}
                </span>
                <span className="hidden text-sm font-semibold text-foreground sm:inline">{user.name}</span>
              </button>

              {isMenuOpen ? (
                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-border bg-surface p-2 shadow-soft">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-foreground hover:bg-bg"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
