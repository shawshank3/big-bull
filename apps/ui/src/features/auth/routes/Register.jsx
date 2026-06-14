import { AuthCard, AuthFooterLink, RegisterForm } from '../components';
import { AuthLayout } from '../layout/AuthLayout';
import { ROUTES } from '@/shared/constants/routes';

export const Register = () => (
  <AuthLayout>
    <AuthCard description="Create your account">
      <RegisterForm />
      <AuthFooterLink prompt="Already have an account?" linkText="Login here" to={ROUTES.LOGIN} />
    </AuthCard>
  </AuthLayout>
);

export default Register;
