import { useState, useEffect } from "react";
import { Logo } from "./navbar/Logo";
import { Navigation } from "./navbar/Navigation";
import { MobileMenu } from "./navbar/MobileMenu";

export const Navbar = () => {
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10);
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-[60] bg-black/80 backdrop-blur-sm border-b border-border shadow-sm transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
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