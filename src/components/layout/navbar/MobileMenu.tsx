import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "./Navigation";

export const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 w-48 py-2 mt-2 bg-black/95 backdrop-blur-sm border border-primary/20 rounded-lg shadow-lg z-40">
          <Navigation isMobile onMobileMenuClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
};