import { AuthCard, AuthFooterLink, LoginForm } from '../../components/auth';
import { AuthLayout } from '../../components/layout';
import { ROUTES } from '../../constants/routes';

export const Login = () => {
  return (
    <AuthLayout>
      <AuthCard description="Your trading dashboard">
        <LoginForm />
        <AuthFooterLink
          prompt="Don’t have an account?"
          linkText="Register here"
          to={ROUTES.REGISTER}
        />
      </AuthCard>
    </AuthLayout>
  );
};

export default Login;
