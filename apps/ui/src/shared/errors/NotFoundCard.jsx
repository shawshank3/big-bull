import { Link as RouterLink } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { ROUTES } from '@/shared/constants/routes';

export const NotFoundCard = () => (
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
);

export default NotFoundCard;
