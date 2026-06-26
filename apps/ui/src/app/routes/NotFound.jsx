import { NotFoundCard } from '@/shared/errors/NotFoundCard';
import { AuthLayout } from '@/features/auth';

export const NotFound = () => (
  <AuthLayout>
    <NotFoundCard />
  </AuthLayout>
);

export default NotFound;
