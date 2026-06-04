import { createContext, useContext } from 'react';
import { Alert, Button, Input } from '../common';

// Create context for form state
const AuthFormContext = createContext(null);

const useAuthForm = () => {
  const context = useContext(AuthFormContext);
  if (!context) {
    throw new Error('AuthForm compound components must be used within AuthForm');
  }
  return context;
};

// Compound components
const ErrorAlert = () => {
  const { error } = useAuthForm();
  if (!error) return null;
  return <Alert variant="danger">{error}</Alert>;
};

const ValidationAlert = () => {
  const { validationErrors } = useAuthForm();
  if (!validationErrors?.general) return null;
  return <Alert variant="warning">{validationErrors.general}</Alert>;
};

const Fields = ({ children }) => (
  <div className="space-y-4">{children}</div>
);

const Field = ({ name, type = 'text', label, required = false }) => {
  const { formData, validationErrors, handleChange } = useAuthForm();
  
  return (
    <Input
      name={name}
      type={type}
      label={label}
      value={formData[name] || ''}
      onChange={handleChange}
      error={validationErrors[name]}
      required={required}
    />
  );
};

const Submit = ({ children, loadingText }) => {
  const { isLoading } = useAuthForm();
  
  return (
    <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full">
      {isLoading ? loadingText : children}
    </Button>
  );
};

// Main component
export const AuthForm = ({ 
  formData, 
  validationErrors, 
  error, 
  isLoading, 
  onSubmit, 
  onChange,
  children 
}) => {
  const handleChange = (event) => {
    const { name, value } = event.target;
    onChange(name, value);
  };

  return (
    <AuthFormContext.Provider 
      value={{ 
        formData, 
        validationErrors, 
        error, 
        isLoading, 
        handleChange 
      }}
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        {children}
      </form>
    </AuthFormContext.Provider>
  );
};

// Attach compound components
AuthForm.ErrorAlert = ErrorAlert;
AuthForm.ValidationAlert = ValidationAlert;
AuthForm.Fields = Fields;
AuthForm.Field = Field;
AuthForm.Submit = Submit;

export default AuthForm;
