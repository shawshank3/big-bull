import { MutedText } from '../ui/typography';
import { ProfileField } from './ProfileField';

export const ProfileDetails = ({ profile }) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ProfileField label="Full name" value={profile.name} />
      <ProfileField label="Email" value={profile.email} />
      <ProfileField label="Phone" value={profile.phone} />
      <div className="space-y-1 sm:col-span-2">
        <MutedText>Bio</MutedText>
        <p className="font-medium text-foreground">{profile.bio || '—'}</p>
      </div>
    </div>
  );
};

export default ProfileDetails;
