import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { FormInput } from '@/shared/ui/FormInput';
import { FormTextarea } from '@/shared/ui/FormTextarea';

export const ProfileEditForm = ({
  profile,
  register,
  errors,
  isSaving,
  saveError,
  onSubmit,
  onCancel,
}) => (
  <form className="space-y-4" onSubmit={onSubmit} noValidate>
    {saveError ? <Alert variant="danger">{saveError}</Alert> : null}
    <FormInput
      label="Full name"
      error={errors.name?.message}
      required
      {...register('name', {
        required: 'Full name is required',
        maxLength: { value: 50, message: 'Name cannot exceed 50 characters' },
      })}
    />
    <FormInput name="email" label="Email" value={profile.email} disabled />
    <FormInput
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
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
        Cancel
      </Button>
    </div>
  </form>
);

export default ProfileEditForm;
