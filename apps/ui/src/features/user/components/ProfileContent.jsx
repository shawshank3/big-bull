import { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/features/auth';
import { useForm } from 'react-hook-form';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/components/card';
import { Spinner } from '@/shared/ui/spinner';
import { PageHeader } from '@/shared/layout/PageHeader';
import { useGetProfileQuery, useUpdateProfileMutation } from '../api/userApi';
import { ProfileDetails } from './ProfileDetails';
import { ProfileEditForm } from './ProfileEditForm';
import { ProfilePhotoSection } from './ProfilePhotoSection';
import { profileToFormValues } from '../utils/profileForm';

export const ProfileContent = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const {
    data: profile,
    isLoading,
    error,
  } = useGetProfileQuery(undefined, { skip: !isAuthenticated });
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ values: profileToFormValues(profile) });

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
    <>
      <PageHeader
        title="Profile"
        description="View and manage your account details."
        actions={
          profile && !isEditing ? (
            <Button type="button" variant="outline" onClick={handleStartEdit}>
              Edit profile
            </Button>
          ) : null
        }
      />
      {error ? <Alert variant="danger">Unable to load profile. Please try again.</Alert> : null}
      {isLoading ? (
        <Spinner label="Loading profile…" />
      ) : profile ? (
        <Card>
          <CardContent className="space-y-6 pt-6">
            <ProfilePhotoSection profile={profile} />
            {isEditing ? (
              <ProfileEditForm
                profile={profile}
                register={register}
                errors={errors}
                isSaving={isSaving}
                saveError={saveError}
                onSubmit={handleSubmit(onSubmit)}
                onCancel={handleCancel}
              />
            ) : (
              <ProfileDetails profile={profile} />
            )}
          </CardContent>
        </Card>
      ) : null}
    </>
  );
};

export default ProfileContent;
