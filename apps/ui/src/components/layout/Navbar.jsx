import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Menu } from 'lucide-react';
import { NavbarSearch } from '../market';
import { NavbarBrand } from './NavbarBrand';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { Button } from '../ui/button';
import { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetBody } from '../ui/sheet';
import { ROUTES } from '../../constants/routes';
import { useGetProfileQuery } from '../../api/authApi';
import { useAuth } from '../../hooks/useAuth';
import { UserAvatar } from '../profile/UserAvatar';
import { GrowingMarketIcon } from '../common';

// ─── Nav link definitions (shared between desktop + mobile) ──────────────────
const NAV_LINKS = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard' },
  { to: ROUTES.MARKET, label: 'Market' },
  { to: ROUTES.HOLDINGS, label: 'Portfolio' },
];

// ─── Compound sections ────────────────────────────────────────────────────────
const Start = ({ children }) => (
  <div className="flex min-w-0 items-center justify-start">{children}</div>
);

const Center = ({ children }) => (
  <div className="hidden min-w-0 flex-1 basis-0 items-center justify-center px-1 sm:flex sm:px-3">
    <div className="w-full max-w-3xl">{children}</div>
  </div>
);

const End = ({ children }) => (
  <div className="hidden min-w-0 items-center justify-end gap-2 sm:flex sm:gap-2.5">{children}</div>
);

// ─── Auth-aware wrappers ──────────────────────────────────────────────────────
const Authenticated = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? children : null;
};

const Guest = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return !isAuthenticated ? children : null;
};

// ─── Desktop nav links (hidden on mobile) ────────────────────────────────────
const NavLinks = () => (
  <nav className="hidden items-center gap-1 sm:flex">
    {NAV_LINKS.map(({ to, label }) => (
      <Link
        key={to}
        to={to}
        className="rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
      >
        {label}
      </Link>
    ))}
  </nav>
);

// ─── Mobile sheet drawer ──────────────────────────────────────────────────────
const MobileDrawer = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const { logout } = useAuth();
  const {
    data: profile,
    isLoading,
    isFetching,
    isError,
  } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  // isLoading / isFetching: query in-flight — profile is undefined, don't access fields.
  // isError: query failed — profile is undefined, don't access fields.
  // Otherwise: DTO guarantees profile has all fields as correct types, no guards needed.
  const isPending = isLoading || isFetching;
  const profileReady = !isPending && !isError && Boolean(profile);

  return (
    <Sheet>
      {/* Trigger — visible on mobile only */}
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="md"
          className="shrink-0 px-2.5 sm:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      {/* Left-side sliding panel */}
      <SheetContent>
        <SheetHeader>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center text-primary sm:h-10 sm:w-10">
            <GrowingMarketIcon size={36} />
          </span>

          {/* Profile header — only when query has resolved successfully */}
          {profileReady && (
            <div className="flex items-center gap-3 py-2">
              <UserAvatar
                name={profile.name}
                avatar={profile.avatar}
                className="h-8 w-8 shrink-0"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{profile.name}</p>
                <p className="truncate text-xs text-muted">{profile.email}</p>
              </div>
            </div>
          )}

          <SheetClose asChild>
            <Button variant="ghost" size="md" className="px-2" aria-label="Close menu">
              ✕
            </Button>
          </SheetClose>
        </SheetHeader>

        <SheetBody className="space-y-1">
          {isAuthenticated ? (
            <nav className="space-y-0.5">
              {NAV_LINKS.map(({ to, label }) => (
                <SheetClose key={to} asChild>
                  <Link
                    to={to}
                    className="block rounded-md py-2.5 text-sm font-medium text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
                  >
                    {label}
                  </Link>
                </SheetClose>
              ))}

              {/* Authenticated actions — only when profile is ready */}
              {profileReady ? (
                <>
                  <SheetClose asChild>
                    <Link
                      to={ROUTES.PROFILE}
                      className="block rounded-md py-2.5 text-sm font-medium text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
                    >
                      Profile
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <button
                      onClick={logout}
                      className="block w-full rounded-md py-2.5 text-left text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                    >
                      Logout
                    </button>
                  </SheetClose>
                  <div className="flex items-center justify-between rounded-md">
                    <span className="text-sm font-medium text-muted">Theme</span>
                    <ThemeToggle />
                  </div>
                </>
              ) : (
                /* Profile query still in-flight */
                <div className="flex items-center justify-between rounded-md">
                  <span className="text-sm font-medium text-muted">Theme</span>
                  <ThemeToggle />
                </div>
              )}
            </nav>
          ) : (
            /* Guest — not logged in */
            <div className="space-y-2 pt-1">
              <SheetClose asChild>
                <Button asChild size="md" className="w-full">
                  <Link to={ROUTES.LOGIN}>Log in</Link>
                </Button>
              </SheetClose>
              <div className="flex items-center justify-between rounded-md px-0.5">
                <span className="text-sm font-medium text-muted">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
};

// ─── Main Navbar ──────────────────────────────────────────────────────────────
export const Navbar = ({ children }) => (
  <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
      {children}
      <Navbar.MobileDrawer />
    </div>
  </header>
);

// ─── Attach compound components ───────────────────────────────────────────────
Navbar.Start = Start;
Navbar.Center = Center;
Navbar.End = End;
Navbar.Authenticated = Authenticated;
Navbar.Guest = Guest;
Navbar.NavLinks = NavLinks;
Navbar.MobileDrawer = MobileDrawer;

// ─── Ready-to-use leaf components ────────────────────────────────────────────
Navbar.Brand = NavbarBrand;
Navbar.Search = NavbarSearch;
Navbar.ThemeToggle = ThemeToggle;
Navbar.UserMenu = UserMenu;
Navbar.LoginButton = () => (
  <Button asChild size="md" className="shrink-0">
    <Link to={ROUTES.LOGIN}>Log in</Link>
  </Button>
);

export default Navbar;
