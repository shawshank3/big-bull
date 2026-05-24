import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';
import { validateRegisterForm } from '../utils/validation';

export const RegisterPage = () => {
  const { register, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setValidationErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateRegisterForm(formData);

    if (Object.keys(nextErrors).length > 0) {
      setValidationErrors(nextErrors);
      return;
    }

    await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-primary">BigBull</CardTitle>
            <CardDescription>Create your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? <Alert variant="danger">{error}</Alert> : null}

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <Input name="name" label="Full name" value={formData.name} onChange={handleChange} error={validationErrors.name} required />
              <Input name="email" type="email" label="Email" value={formData.email} onChange={handleChange} error={validationErrors.email} required />
              <Input name="password" type="password" label="Password" value={formData.password} onChange={handleChange} error={validationErrors.password} required />
              <Input name="confirmPassword" type="password" label="Confirm password" value={formData.confirmPassword} onChange={handleChange} error={validationErrors.confirmPassword} required />
              <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full">
                {isLoading ? 'Creating account' : 'Register'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted">
              Already have an account?{' '}
              <RouterLink to={ROUTES.LOGIN} className="font-bold text-primary hover:underline">
                Login here
              </RouterLink>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
