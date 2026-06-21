import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useMarketStream } from '@/features/market/hooks/useMarketStream';
import { GlobalLoader } from '@/shared/ui/GlobalLoader';

export const RootLayout = () => {
  useMarketStream();

  return (
    <div className="min-h-screen bg-bg text-foreground">
      <GlobalLoader />
      <Navbar>
        <Navbar.Start>
          <Navbar.Brand />
          <Navbar.Authenticated>
            <Navbar.NavLinks />
          </Navbar.Authenticated>
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
