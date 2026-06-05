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
