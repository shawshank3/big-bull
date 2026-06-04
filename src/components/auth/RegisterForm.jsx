import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { validateRegisterForm } from './utils';
import { AuthForm } from './AuthForm';

export const RegisterForm = () => {
  const { register, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (name, value) => {
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
    <AuthForm
      formData={formData}
      validationErrors={validationErrors}
      error={error}
      isLoading={isLoading}
      onSubmit={handleSubmit}
      onChange={handleChange}
    >
      <AuthForm.ErrorAlert />
      <AuthForm.Fields>
        <AuthForm.Field name="name" label="Full name" required />
        <AuthForm.Field name="email" type="email" label="Email" required />
        <AuthForm.Field name="password" type="password" label="Password" required />
        <AuthForm.Field name="confirmPassword" type="password" label="Confirm password" required />
      </AuthForm.Fields>
      <AuthForm.Submit loadingText="Creating account">Register</AuthForm.Submit>
    </AuthForm>
  );
};

export default RegisterForm;
