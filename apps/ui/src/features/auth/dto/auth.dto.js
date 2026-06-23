import { str } from '@/shared/dto/helpers';

function toUserDTO(raw) {
  return {
    id: str(raw?.id),
    name: str(raw?.name),
    email: str(raw?.email),
    role: str(raw?.role),
  };
}

export function authResponseToUser(res) {
  const user = res?.data?.user;
  return user ? toUserDTO(user) : null;
}
