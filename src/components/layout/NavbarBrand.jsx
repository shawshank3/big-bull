import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { Button } from '../ui/button';

export const NavbarBrand = () => {
  return (
    <Button variant="ghost" className="h-auto gap-3 px-2 py-2 text-base" asChild>
      <Link to={ROUTES.ROOT}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-base font-bold text-white">
          BB
        </span>
        <span className="text-xl font-bold tracking-tight text-foreground">BigBull</span>
      </Link>
    </Button>
  );
};

export default NavbarBrand;
