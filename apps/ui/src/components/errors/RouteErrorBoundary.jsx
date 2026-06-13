import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
} from '../common';
import { ROUTES } from '../../constants/routes';

/**
 * RouteErrorBoundary
 *
 * Assigned to `errorElement` on the top-level route groups (RootLayout and
 * GuestRoute). React Router renders this automatically when any child route
 * component, loader, or action throws an unhandled error.
 *
 * - Shows HTTP status text for ErrorResponse errors (4xx / 5xx from loaders).
 * - Shows a generic "Something went wrong" for unexpected JS errors.
 * - Logs the full error to the console for developer diagnostics.
 * - Provides two recovery actions: Go Back and Go to Home.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  const isRouterError = isRouteErrorResponse(error);

  const heading = isRouterError ? `${error.status} — ${error.statusText}` : 'Something went wrong';

  const description = isRouterError
    ? 'The page you were looking for could not be found or you do not have permission to view it.'
    : 'An unexpected error occurred. Please try again or return to the home page.';

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">{heading}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent />
        <CardFooter className="justify-center gap-3">
          <Button variant="outline" size="md" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(ROUTES.ROOT, { replace: true })}
          >
            Go to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default RouteErrorBoundary;
