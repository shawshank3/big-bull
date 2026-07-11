import { AuthCard, AuthFooterLink, RegisterForm } from '../components';
import { AuthLayout } from '../layout/AuthLayout';
import { PageMeta } from '@/shared/components/PageMeta';
import { ROUTES } from '@/shared/constants/routes';

export const Register = () => (
  <>
    <PageMeta
      title="Create Free Account"
      description="Sign up for Big Bull and start paper trading stocks risk-free. Track your simulated portfolio, test strategies, and learn to trade without real money."
      path="/register"
      noIndex
    />
    <AuthLayout>
      <AuthCard description="Create your account">
        <RegisterForm />
        <AuthFooterLink prompt="Already have an account?" linkText="Login here" to={ROUTES.LOGIN} />
      </AuthCard>
    </AuthLayout>
  </>
);

export default Register;
