import { Logo } from "./navbar/Logo";
import { Navigation } from "./navbar/Navigation";
import { MobileMenu } from "./navbar/MobileMenu";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-black border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo />
          <div className="hidden md:block">
            <Navigation />
          </div>
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
};