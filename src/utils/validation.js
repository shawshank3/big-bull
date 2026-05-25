export const validateLoginForm = ({ email, password }) => {
  const errors = {};

  if (!email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  }

  return errors;
};

export const validateRegisterForm = ({ name, email, password, confirmPassword }) => {
  const errors = {};

  if (!name?.trim()) {
    errors.name = 'Full name is required';
  }

  if (!email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

export const validateProfileForm = ({ name, bio }) => {
  const errors = {};

  if (!name?.trim()) {
    errors.name = 'Full name is required';
  } else if (name.trim().length > 50) {
    errors.name = 'Name cannot exceed 50 characters';
  }

  if (bio && bio.length > 500) {
    errors.bio = 'Bio cannot exceed 500 characters';
  }

  return errors;
};

export default {
  validateLoginForm,
  validateRegisterForm,
  validateProfileForm,
};
