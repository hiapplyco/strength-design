import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "./Navigation";

export const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {isOpen && (
        <div className="md:hidden py-4 space-y-2 animate-fade-in">
          <Navigation isMobile onMobileMenuClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
};