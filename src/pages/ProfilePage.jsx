import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
  Alert,
  Button,
  Card,
  CardContent,
  FormTextarea,
  Input,
} from '../components/common';
import { ProfilePhotoSection } from '../components/profile';
import { MainLayout } from '../components/layout/MainLayout';
import { Spinner } from '../components/ui/spinner';
import { MutedText, PageDescription, PageTitle } from '../components/ui/typography';
import { useGetProfileQuery, useUpdateProfileMutation } from '../api/apiSlice';

const profileToFormValues = (profile) => ({
  name: profile?.name || '',
  phone: profile?.phone || '',
  bio: profile?.bio || '',
});

const ProfileField = ({ label, value }) => (
  <div className="space-y-1">
    <MutedText>{label}</MutedText>
    <p className="font-medium text-foreground">{value || '—'}</p>
  </div>
);

export const ProfilePage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { data: profile, isLoading, error } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: profileToFormValues(),
  });

  useEffect(() => {
    if (profile && !isEditing) {
      reset(profileToFormValues(profile));
    }
  }, [profile, isEditing, reset]);

  const handleStartEdit = () => {
    reset(profileToFormValues(profile));
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    reset(profileToFormValues(profile));
    setSaveError(null);
    setIsEditing(false);
  };

  const onSubmit = async (formData) => {
    try {
      await updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        bio: formData.bio.trim() || undefined,
      }).unwrap();

      setIsEditing(false);
      setSaveError(null);
    } catch (err) {
      setSaveError(err?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <MainLayout>
      <div className="page-shell">
        <div className="page-header flex flex-wrap items-start justify-between gap-4">
          <div>
            <PageTitle>Profile</PageTitle>
            <PageDescription>View and manage your account details.</PageDescription>
          </div>
          {profile && !isEditing ? (
            <Button type="button" variant="outline" onClick={handleStartEdit}>
              Edit profile
            </Button>
          ) : null}
        </div>

        {error ? <Alert variant="danger">Unable to load profile. Please try again.</Alert> : null}

        {isLoading ? (
          <Spinner label="Loading profile…" />
        ) : profile ? (
          <Card>
            <CardContent className="space-y-6 pt-6">
              <ProfilePhotoSection profile={profile} />

              {saveError ? <Alert variant="danger">{saveError}</Alert> : null}

              {isEditing ? (
                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                  <Input
                    label="Full name"
                    error={errors.name?.message}
                    required
                    {...register('name', {
                      required: 'Full name is required',
                      maxLength: { value: 50, message: 'Name cannot exceed 50 characters' },
                    })}
                  />
                  <Input name="email" label="Email" value={profile.email} disabled />
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="Optional"
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                  <FormTextarea
                    label="Bio"
                    rows={4}
                    placeholder="Tell us a bit about yourself (optional)"
                    error={errors.bio?.message}
                    {...register('bio', {
                      maxLength: { value: 500, message: 'Bio cannot exceed 500 characters' },
                    })}
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" variant="primary" loading={isSaving}>
                      {isSaving ? 'Saving…' : 'Save changes'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileField label="Full name" value={profile.name} />
                  <ProfileField label="Email" value={profile.email} />
                  <ProfileField label="Phone" value={profile.phone} />
                  <div className="space-y-1 sm:col-span-2">
                    <MutedText>Bio</MutedText>
                    <p className="font-medium text-foreground">{profile.bio || '—'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
