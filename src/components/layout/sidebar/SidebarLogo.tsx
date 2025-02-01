import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export const SidebarLogo = () => {
  return (
    <div className="flex items-center justify-between">
      <NavLink
        to="/workout-generator"
        className="text-2xl font-collegiate text-accent tracking-wider hover:text-accent/80 transition-colors"
      >
        STRENGTH.DESIGN
      </NavLink>
      <SidebarTrigger>
        <Menu className="h-6 w-6" />
      </SidebarTrigger>
    </div>
  );
};