import { AuthCard, AuthFooterLink, LoginForm } from '../components';
import { AuthLayout } from '../layout/AuthLayout';
import { PageMeta } from '@/shared/components/PageMeta';
import { ROUTES } from '@/shared/constants/routes';

export const Login = () => (
  <>
    <PageMeta
      title="Log In"
      description="Log in to Big Bull and access your virtual trading dashboard. Track your simulated portfolio, view holdings, and continue practicing."
      path="/login"
      noIndex
    />
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
  </>
);

export default Login;
