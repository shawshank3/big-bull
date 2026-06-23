import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { FormInput } from '@/shared/components/FormInput';

export const RegisterForm = () => {
  const { register: registerUser, isLoading, error } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async ({ name, email, password }) => {
    await registerUser({ name, email, password });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {error && <Alert variant="danger">{error}</Alert>}
      <FormInput
        label="Full name"
        type="text"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name', {
          required: 'Full name is required',
          minLength: { value: 2, message: 'Name must be at least 2 characters' },
          maxLength: { value: 50, message: 'Name cannot exceed 50 characters' },
        })}
      />
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
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password', {
          required: 'Password is required',
          minLength: { value: 8, message: 'Password must be at least 8 characters' },
          pattern: {
            value: /(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~])/,
            message: 'Password must contain a number and a special character',
          },
        })}
      />
      <FormInput
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword', {
          required: 'Please confirm your password',
          validate: (v) => v === watch('password') || 'Passwords do not match',
        })}
      />
      <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full">
        {isLoading ? 'Creating account…' : 'Register'}
      </Button>
    </form>
  );
};

export default RegisterForm;
