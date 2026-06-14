import { AuthCard, AuthFooterLink, LoginForm } from '../components';
import { AuthLayout } from '../layout/AuthLayout';
import { ROUTES } from '@/shared/constants/routes';

export const Login = () => (
  <AuthLayout>
    <AuthCard description="Your trading dashboard">
      <LoginForm />
      <AuthFooterLink
        prompt="Don't have an account?"
        linkText="Register here"
        to={ROUTES.REGISTER}
      />
    </AuthCard>
  </AuthLayout>
);

export default Login;
