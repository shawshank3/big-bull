import { str } from '@/shared/dto/helpers';

// ---------------------------------------------------------------------------
// AuthUser
// Consumed by: getMe, login, register
// Raw source: auth.controller.js → formatUser → { id, name, email, role }
// ---------------------------------------------------------------------------

export function toAuthUserDTO(raw) {
  return {
    id: str(raw?.id),
    name: str(raw?.name),
    email: str(raw?.email),
    role: str(raw?.role),
  };
}
