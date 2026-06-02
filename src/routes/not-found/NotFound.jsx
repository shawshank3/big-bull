import { NotFoundCard } from '../../components/errors';
import { AuthLayout } from '../../components/layout';

export const NotFound = () => {
  return (
    <AuthLayout>
      <NotFoundCard />
    </AuthLayout>
  );
};

export default NotFound;
