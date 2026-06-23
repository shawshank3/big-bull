import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '@/shared/constants/routes';
import { selectIsAuthenticated } from '@/features/auth/store/authSelectors';
import { useGetProfileQuery } from '@/features/user/api/userApi';
import { useGetWalletQuery } from '@/features/wallet/api/walletApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserAvatar } from '@/features/user/components/UserAvatar';
import { formatCurrency } from '@/shared/utils/format';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/dropdown-menu';

export const UserMenu = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { logout } = useAuth();
  const { data: profile } = useGetProfileQuery(undefined, { skip: !isAuthenticated });
  const { data: wallet } = useGetWalletQuery(undefined, { skip: !isAuthenticated });

  if (!isAuthenticated || !profile) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="md"
          className="max-w-[10.5rem] shrink-0 gap-2 overflow-hidden px-2 sm:max-w-[12rem] sm:px-2.5"
          title={profile.name}
        >
          <UserAvatar name={profile.name} avatar={profile.avatar} className="h-8 w-8 shrink-0" />
          <span className="hidden min-w-0 truncate font-semibold text-sm lg:inline">
            {profile.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-52">
        <DropdownMenuLabel className="font-normal">
          <p className="text-base font-semibold text-foreground">{profile.name}</p>
          <p className="text-sm font-medium text-muted">{profile.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={ROUTES.WALLET}>Wallet: {wallet ? formatCurrency(wallet.balance) : '—'}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={ROUTES.PROFILE}>Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={logout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
