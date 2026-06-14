import { MutedText } from '@/shared/ui/typography';

export const ProfileField = ({ label, value }) => (
  <div className="space-y-1">
    <MutedText>{label}</MutedText>
    <p className="font-medium text-foreground">{value || '—'}</p>
  </div>
);

export default ProfileField;
