import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { FormInput } from '@/shared/ui/FormInput';

export const LoginForm = () => {
  const { login, isLoading, error } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async ({ email, password }) => {
    try {
      await login(email, password);
    } catch (err) {
      const status = err?.status ?? err?.data?.error?.code;
      if (status === 401) {
        setError('email', { type: 'server' });
        setError('password', { message: 'Invalid email or password', type: 'server' });
      }
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {error && <Alert variant="danger">{error}</Alert>}
      <FormInput
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email', {
          required: 'Email is required',
          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
        })}
      />
      <FormInput
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password', { required: 'Password is required' })}
      >
        <FormInput.PasswordToggle />
      </FormInput>
      <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full">
        {isLoading ? 'Signing in…' : 'Login'}
      </Button>
    </form>
  );
};

export default LoginForm;
