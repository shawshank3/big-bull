import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { Button } from '@/shared/ui/button';
import { growingMarketIcon } from '@/assets';

export const NavbarBrand = () => (
  <Button
    variant="ghost"
    className="h-10 max-w-[9.5rem] gap-2 overflow-hidden px-1.5 sm:max-w-none sm:gap-2.5 sm:px-2"
    asChild
  >
    <Link to={ROUTES.ROOT}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center sm:h-10 sm:w-10">
        <img
          src={growingMarketIcon}
          alt="BigBull logo"
          className="h-9 w-9 rounded-lg object-cover sm:h-10 sm:w-10"
        />
      </span>
      <span className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
        BigBull
      </span>
    </Link>
  </Button>
);

export default NavbarBrand;
