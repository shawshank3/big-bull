import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../../constants/routes';
import { useGetProfileQuery } from '../../api/apiSlice';
import { useAuth } from '../../hooks/useAuth';
import { UserAvatar } from '../profile/UserAvatar';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export const UserMenu = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { logout } = useAuth();
  const { data: profile } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  if (!isAuthenticated || !profile) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="md"
          className="max-w-[10.5rem] shrink-0 gap-2 overflow-hidden px-2 sm:max-w-[12rem] sm:px-2.5"
          title={profile.name}
        >
          <UserAvatar
            name={profile.name}
            avatar={profile.avatar}
            className="h-8 w-8 shrink-0"
          />
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
          <Link to={ROUTES.PROFILE}>Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={logout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
