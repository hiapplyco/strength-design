import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export const SidebarLogo = () => {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex items-center justify-between">
      <NavLink
        to="/workout-generator"
        className="text-2xl font-collegiate text-accent tracking-wider hover:text-accent/80 transition-colors"
      >
        STRENGTH.DESIGN
      </NavLink>
      <Button
        onClick={toggleSidebar}
        variant="ghost"
        size="icon"
        title="Toggle Menu"
        className="text-muted-foreground hover:text-accent transition-colors md:hidden"
      >
        <Menu className="h-6 w-6" />
      </Button>
    </div>
  );
};