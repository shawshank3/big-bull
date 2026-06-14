import { NotFoundCard } from '@/shared/errors/NotFoundCard';
import { AuthLayout } from '@/features/auth/layout/AuthLayout';

export const NotFound = () => (
  <AuthLayout>
    <NotFoundCard />
  </AuthLayout>
);

export default NotFound;
