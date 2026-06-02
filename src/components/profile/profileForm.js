export const profileToFormValues = (profile) => ({
  name: profile?.name || '',
  phone: profile?.phone || '',
  bio: profile?.bio || '',
});
