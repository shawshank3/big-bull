import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { SITE_NAME } from '@/shared/constants/seo';

/**
 * Footer — global app footer rendered inside RootLayout.
 *
 * RootLayout wraps this in a <footer ref> and uses a ResizeObserver to publish
 * the rendered height as --footer-height on :root. Fixed bottom panels
 * (e.g. WhatIfPanel) use `bottom: var(--footer-height)` to sit above the footer
 * without hard-coding pixel values.
 */
export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="border-t border-border bg-bg/80">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-5 text-center text-xs text-muted sm:px-6 lg:px-8">
        <p>
          <strong className="font-medium text-foreground/80">{SITE_NAME}</strong> is an educational
          paper-trading simulator. All prices are{' '}
          <strong className="font-medium text-foreground/80">simulated</strong> — not real market
          data.{' '}
          <Link
            to={ROUTES.DISCLAIMER}
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Full disclaimer
          </Link>
        </p>
        <p className="text-muted/70">
          Not affiliated with NSE, BSE, or any listed company. Not investment advice.
        </p>
        <p className="text-muted/60">© {currentYear} Shashank Mishra. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Footer;
