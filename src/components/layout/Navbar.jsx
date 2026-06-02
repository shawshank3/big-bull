import { NavbarSearch } from '../market';
import { NavbarBrand } from './NavbarBrand';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 basis-0 items-center justify-start">
          <NavbarBrand />
        </div>

        <div className="flex min-w-0 flex-1 basis-0 items-center justify-center px-1 sm:px-3">
          <div className="w-full max-w-2xl">
            <NavbarSearch />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 basis-0 items-center justify-end gap-2 sm:gap-2.5">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
