export const getChatErrorMessage = (error) =>
  error?.data?.message || error?.message || 'Something went wrong. Please try again.';
