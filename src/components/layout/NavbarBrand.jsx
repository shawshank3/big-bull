import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { Button } from '../ui/button';

export const NavbarBrand = () => {
  return (
    <Button variant="ghost" className="h-10 max-w-[9.5rem] gap-2 overflow-hidden px-1.5 sm:max-w-none sm:gap-2.5 sm:px-2" asChild>
      <Link to={ROUTES.ROOT}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white sm:h-10 sm:w-10 sm:text-base">
          BB
        </span>
        <span className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
          BigBull
        </span>
      </Link>
    </Button>
  );
};

export default NavbarBrand;
