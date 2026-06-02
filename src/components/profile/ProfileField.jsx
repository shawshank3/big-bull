import { MutedText } from '../ui/typography';

export const ProfileField = ({ label, value }) => {
  return (
    <div className="space-y-1">
      <MutedText>{label}</MutedText>
      <p className="font-medium text-foreground">{value || '—'}</p>
    </div>
  );
};

export default ProfileField;
