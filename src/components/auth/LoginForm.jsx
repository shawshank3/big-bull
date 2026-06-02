import { useState } from 'react';
import { Alert, Button, Input } from '../common';
import { useAuth } from '../../hooks/useAuth';
import { validateLoginForm } from '../../utils/validation';

export const LoginForm = () => {
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
    <>
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
    </>
  );
};

export default LoginForm;
