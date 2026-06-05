import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { validateLoginForm } from './utils';
import { AuthForm } from './AuthForm';

export const LoginForm = () => {
  const { login, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (name, value) => {
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
    <AuthForm
      formData={formData}
      validationErrors={validationErrors}
      error={error}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      onChange={handleChange}
    >
      <AuthForm.ErrorAlert />
      <AuthForm.ValidationAlert />
      <AuthForm.Fields>
        <AuthForm.Field name="email" type="email" label="Email" required />
        <AuthForm.Field name="password" type="password" label="Password" required />
      </AuthForm.Fields>
      <AuthForm.Submit loadingText="Signing in">Login</AuthForm.Submit>
    </AuthForm>
  );
};

export default LoginForm;
