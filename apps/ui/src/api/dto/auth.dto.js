import { str } from './helpers';

// ---------------------------------------------------------------------------
// toUserDTO
// Consumed by: getMe, login, register
// Raw source: auth.controller.js → formatUser → { id, name, email, role }
// ---------------------------------------------------------------------------

export function toUserDTO(raw) {
  return {
    id: str(raw?.id),
    name: str(raw?.name),
    email: str(raw?.email),
    role: str(raw?.role),
  };
}

// ---------------------------------------------------------------------------
// toProfileDTO
// Consumed by: getProfile, updateProfile, uploadAvatar, removeAvatar
// Raw source: auth.controller.js → formatProfile → { id, name, email, phone, bio, avatar }
// ---------------------------------------------------------------------------

export function toProfileDTO(raw) {
  return {
    id: str(raw?.id),
    name: str(raw?.name),
    email: str(raw?.email),
    phone: str(raw?.phone),
    bio: str(raw?.bio),
    avatar: raw?.avatar == null ? null : str(raw.avatar),
  };
}
