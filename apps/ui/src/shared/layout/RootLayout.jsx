import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useMarketStream } from '@/features/market';
import { useLogoutMutation } from '@/features/auth';
import { GlobalLoader } from './GlobalLoader';

export const RootLayout = () => {
  useMarketStream();

  const [, { isLoading: isLoggingOut }] = useLogoutMutation({
    fixedCacheKey: 'global-logout',
  });

  return (
    <div className="min-h-screen bg-bg text-foreground">
      <GlobalLoader show={isLoggingOut} label="Logging out..." />
      <Navbar>
        <Navbar.Start>
          <Navbar.Brand />
          <Navbar.NavLinks />
        </Navbar.Start>
        <Navbar.Center>
          <Navbar.Search />
        </Navbar.Center>
        <Navbar.End>
          <Navbar.ThemeToggle />
          <Navbar.Authenticated>
            <Navbar.UserMenu />
          </Navbar.Authenticated>
          <Navbar.Guest>
            <Navbar.LoginButton />
          </Navbar.Guest>
        </Navbar.End>
      </Navbar>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;
