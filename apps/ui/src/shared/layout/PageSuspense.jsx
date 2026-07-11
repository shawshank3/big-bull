import { Suspense } from 'react';
import { Spinner } from '@/shared/ui/spinner';

/**
 * PageSuspense — Suspense boundary for heavy intra-page components loaded via
 * React.lazy() on user interaction (e.g. modals, AI panels, rich text editors).
 *
 * Do NOT use this for route-level code splitting — React Router's route.lazy()
 * handles that natively without a manual Suspense boundary.
 */
const PageFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <Spinner label="Loading…" />
  </div>
);

export const PageSuspense = ({ children }) => (
  <Suspense fallback={<PageFallback />}>{children}</Suspense>
);

export default PageSuspense;
