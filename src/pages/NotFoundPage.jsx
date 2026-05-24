import { Link as RouterLink } from 'react-router-dom';
import { Button, Card, CardContent } from '../components/common';
import { ROUTES } from '../constants/routes';

export const NotFoundPage = () => {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <p className="text-7xl font-black text-primary">404</p>
            <h1 className="text-2xl font-extrabold text-foreground">Page not found</h1>
            <p className="text-base text-muted">
              The page you are looking for does not exist or may have moved.
            </p>
            <Button asChild variant="primary">
              <RouterLink to={ROUTES.ROOT}>Back home</RouterLink>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFoundPage;
