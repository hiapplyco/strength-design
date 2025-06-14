
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Calendar, Settings, Users, Book, Sparkles } from "lucide-react";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "group flex items-center rounded-md border border-transparent px-3 py-2 text-sm font-medium hover:bg-secondary hover:text-secondary-foreground",
        isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
      )}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </Link>
  );
};

export const SidebarNavigation = () => {
  return (
    <nav className="space-y-1 px-2">
      <NavItem
        to="/"
        icon={<Home className="h-5 w-5" />}
        label="Home"
      />
      <NavItem
        to="/workout-generator"
        icon={<Sparkles className="h-5 w-5" />}
        label="Workout Generator"
      />
      <NavItem
        to="/calendar"
        icon={<Calendar className="h-5 w-5" />}
        label="Calendar"
      />
      <NavItem
        to="/settings"
        icon={<Settings className="h-5 w-5" />}
        label="Settings"
      />
      <NavItem
        to="/community"
        icon={<Users className="h-5 w-5" />}
        label="Community"
      />
      <NavItem
        to="/journal"
        icon={<Book className="h-5 w-5" />}
        label="Journal"
      />
    </nav>
  );
};
