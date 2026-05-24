import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';
import { validateLoginForm } from '../utils/validation';

export const LoginPage = () => {
  const { login, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setValidationErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateLoginForm(formData);

    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      return;
    }

    await login(formData.email, formData.password);
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-primary">BigBull</CardTitle>
            <CardDescription>Your trading dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? <Alert variant="danger">{error}</Alert> : null}
            {validationErrors.general ? <Alert variant="warning">{validationErrors.general}</Alert> : null}

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <Input
                name="email"
                type="email"
                label="Email"
                value={formData.email}
                onChange={handleChange}
                error={validationErrors.email}
                required
              />
              <Input
                name="password"
                type="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                error={validationErrors.password}
                required
              />
              <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full">
                {isLoading ? 'Signing in' : 'Login'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted">
              Don’t have an account?{' '}
              <RouterLink to={ROUTES.REGISTER} className="font-bold text-primary hover:underline">
                Register here
              </RouterLink>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
