import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { NavbarSearch } from '../market';
import { NavbarBrand } from './NavbarBrand';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { Button } from '../ui/button';
import { ROUTES } from '../../constants/routes';

// Compound component: Navbar with composable sections
const Start = ({ children }) => (
  <div className="flex min-w-0 flex-1 basis-0 items-center justify-start">{children}</div>
);

const Center = ({ children }) => (
  <div className="flex min-w-0 flex-1 basis-0 items-center justify-center px-1 sm:px-3">
    <div className="w-full max-w-2xl">{children}</div>
  </div>
);

const End = ({ children }) => (
  <div className="flex min-w-0 flex-1 basis-0 items-center justify-end gap-2 sm:gap-2.5">
    {children}
  </div>
);

// Auth-aware components
const Authenticated = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? children : null;
};

const Guest = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return !isAuthenticated ? children : null;
};

// Main component
export const Navbar = ({ children }) => {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </header>
  );
};

// Attach compound components
Navbar.Start = Start;
Navbar.Center = Center;
Navbar.End = End;
Navbar.Authenticated = Authenticated;
Navbar.Guest = Guest;

// Export ready-to-use components
Navbar.Brand = NavbarBrand;
Navbar.Search = NavbarSearch;
Navbar.ThemeToggle = ThemeToggle;
Navbar.UserMenu = UserMenu;
Navbar.LoginButton = () => (
  <Button asChild size="md" className="shrink-0">
    <Link to={ROUTES.LOGIN}>Log in</Link>
  </Button>
);

export default Navbar;
