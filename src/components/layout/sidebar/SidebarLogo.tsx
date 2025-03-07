
import { NavLink } from "react-router-dom";
import { StyledLogo } from "@/components/ui/styled-logo";

export const SidebarLogo = () => {
  return (
    <div className="flex items-center justify-between">
      <NavLink
        to="/"
        className="hover:opacity-80 transition-opacity"
      >
        <StyledLogo size="medium" />
      </NavLink>
    </div>
  );
};
