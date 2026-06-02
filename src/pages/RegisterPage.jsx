import { AuthCard, AuthFooterLink, RegisterForm } from '../components/auth';
import { AuthLayout } from '../components/layout';
import { ROUTES } from '../constants/routes';

export const RegisterPage = () => {
  return (
    <AuthLayout>
      <AuthCard description="Create your account">
        <RegisterForm />
        <AuthFooterLink
          prompt="Already have an account?"
          linkText="Login here"
          to={ROUTES.LOGIN}
        />
      </AuthCard>
    </AuthLayout>
  );
};

export default RegisterPage;
