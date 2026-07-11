import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useMarketStream } from '@/features/market';
import { useLogoutMutation } from '@/features/auth';
import { GlobalLoader } from './GlobalLoader';

/**
 * Measures the footer's rendered height and publishes it as --footer-height
 * on the document root. Any fixed-positioned bottom panel (e.g. WhatIfPanel)
 * can use `bottom: var(--footer-height)` to sit flush above the footer without
 * hard-coding a pixel value.
 */
function useFooterHeight(footerRef) {
  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    const update = () => {
      document.documentElement.style.setProperty('--footer-height', `${el.offsetHeight}px`);
    };

    update();

    // Re-measure on resize (e.g. font-size change, viewport width change)
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [footerRef]);
}

export const RootLayout = () => {
  useMarketStream();

  const footerRef = useRef(null);
  useFooterHeight(footerRef);

  const [, { isLoading: isLoggingOut }] = useLogoutMutation({
    fixedCacheKey: 'global-logout',
  });

  return (
    <div className="flex min-h-screen flex-col bg-bg text-foreground">
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
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <footer ref={footerRef}>
        <Footer />
      </footer>
    </div>
  );
};

export default RootLayout;
