import { str } from '@/shared/dto/helpers';

// ---------------------------------------------------------------------------
// UserProfile
// Consumed by: getProfile, updateProfile, uploadAvatar, removeAvatar
// ---------------------------------------------------------------------------

export function toUserProfileDTO(raw) {
  return {
    id: str(raw?.id),
    name: str(raw?.name),
    email: str(raw?.email),
    phone: str(raw?.phone),
    bio: str(raw?.bio),
    avatar: raw?.avatar == null ? null : str(raw.avatar),
  };
}
