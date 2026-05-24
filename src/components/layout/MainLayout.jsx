import { Navbar } from './Navbar';

export const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-bg text-foreground">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
};

export default MainLayout;
