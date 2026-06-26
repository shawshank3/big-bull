import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Menu, Search } from 'lucide-react';
import { selectIsAuthenticated, useAuth } from '@/features/auth';
import { NavbarSearch } from '@/features/market';
import { NavbarBrand } from './NavbarBrand';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { Button } from '@/shared/ui/button';
import {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
} from '@/shared/components/sheet';
import { ROUTES } from '@/shared/constants/routes';
import { useGetProfileQuery, UserAvatar } from '@/features/user';
import { useGetWalletQuery } from '@/features/wallet';
import { formatCurrency } from '@/shared/utils/format';

const NAV_LINKS = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', authOnly: true },
  { to: ROUTES.MARKET, label: 'Market', authOnly: false },
  { to: ROUTES.HOLDINGS, label: 'Portfolio', authOnly: true },
];

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

const Authenticated = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return isAuthenticated ? children : null;
};

const Guest = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return !isAuthenticated ? children : null;
};

const NavLinks = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const visibleLinks = NAV_LINKS.filter((link) => !link.authOnly || isAuthenticated);

  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {visibleLinks.map(({ to, label }) => (
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
};

const MobileDrawer = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { logout } = useAuth();
  const {
    data: profile,
    isLoading,
    isFetching,
    isError,
  } = useGetProfileQuery(undefined, { skip: !isAuthenticated });
  const { data: wallet } = useGetWalletQuery(undefined, { skip: !isAuthenticated });
  const isPending = isLoading || isFetching;
  const profileReady = !isPending && !isError && Boolean(profile);

  const visibleLinks = NAV_LINKS.filter((link) => !link.authOnly || isAuthenticated);

  return (
    <Sheet>
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
      <SheetContent>
        <SheetHeader>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center sm:h-10 sm:w-10">
            <img
              src="/growing-market-icon.png"
              alt="BigBull logo"
              className="h-9 w-9 rounded-lg object-cover sm:h-10 sm:w-10"
            />
          </span>
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
              {visibleLinks.map(({ to, label }) => (
                <SheetClose key={to} asChild>
                  <Link
                    to={to}
                    className="block rounded-md py-2.5 text-sm font-medium text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
                  >
                    {label}
                  </Link>
                </SheetClose>
              ))}
              {profileReady ? (
                <>
                  <SheetClose asChild>
                    <Link
                      to={ROUTES.WALLET}
                      className="block rounded-md py-2.5 text-sm font-medium text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
                    >
                      Wallet: {wallet ? formatCurrency(wallet.balance) : '—'}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to={ROUTES.TAX}
                      className="block rounded-md py-2.5 text-sm font-medium text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
                    >
                      Tax Center
                    </Link>
                  </SheetClose>
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
                <div className="flex items-center justify-between rounded-md">
                  <span className="text-sm font-medium text-muted">Theme</span>
                  <ThemeToggle />
                </div>
              )}
            </nav>
          ) : (
            <div className="space-y-2 pt-1">
              <nav className="space-y-0.5">
                {visibleLinks.map(({ to, label }) => (
                  <SheetClose key={to} asChild>
                    <Link
                      to={to}
                      className="block rounded-md py-2.5 text-sm font-medium text-muted transition-colors hover:bg-muted/10 hover:text-foreground"
                    >
                      {label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
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

export const Navbar = ({ children }) => (
  <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
      {children}
      <div className="flex items-center gap-2 sm:hidden">
        <Navbar.MobileSearch />
        <Navbar.MobileDrawer />
      </div>
    </div>
  </header>
);

Navbar.Start = Start;
Navbar.Center = Center;
Navbar.End = End;
Navbar.Authenticated = Authenticated;
Navbar.Guest = Guest;
Navbar.NavLinks = NavLinks;
Navbar.MobileDrawer = MobileDrawer;
Navbar.Brand = NavbarBrand;
Navbar.Search = NavbarSearch;
Navbar.ThemeToggle = ThemeToggle;
Navbar.UserMenu = UserMenu;
Navbar.MobileSearch = () => (
  <Link
    to={ROUTES.SEARCH}
    className="shrink-0 p-2 text-muted transition-colors hover:text-foreground sm:hidden"
    aria-label="Search"
  >
    <Search className="h-5 w-5" />
  </Link>
);
Navbar.LoginButton = () => (
  <Button asChild size="md" className="shrink-0">
    <Link to={ROUTES.LOGIN}>Log in</Link>
  </Button>
);

export default Navbar;
