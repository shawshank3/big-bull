import { NotFoundCard } from '../components/errors';
import { AuthLayout } from '../components/layout';

export const NotFoundPage = () => {
  return (
    <AuthLayout>
      <NotFoundCard />
    </AuthLayout>
  );
};

export default NotFoundPage;
