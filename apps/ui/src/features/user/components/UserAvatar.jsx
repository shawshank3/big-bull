import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { getAvatarUrl } from '../utils/avatar';

export const UserAvatar = ({ name, avatar, className = 'h-9 w-9', fallbackClassName }) => {
  const initial = name?.[0]?.toUpperCase() || 'U';
  const avatarUrl = getAvatarUrl(avatar);
  return (
    <Avatar className={className}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={name ? `${name}'s avatar` : 'User avatar'} />
      ) : null}
      <AvatarFallback className={fallbackClassName}>{initial}</AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
