import { str, num } from '@/shared/dto/helpers';

export function toWalletDTO(raw) {
  return {
    balance: num(raw?.balance),
    currency: str(raw?.currency, 'INR'),
  };
}
