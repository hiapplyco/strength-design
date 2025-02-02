import { NavLink } from "react-router-dom";

export const SidebarLogo = () => {
  return (
    <div className="flex items-center justify-between">
      <NavLink
        to="/workout-generator"
        className="text-2xl font-collegiate text-accent tracking-wider hover:text-accent/80 transition-colors"
      >
        STRENGTH.DESIGN
      </NavLink>
    </div>
  );
};