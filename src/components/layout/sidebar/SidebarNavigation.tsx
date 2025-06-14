
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Sparkles,
  History,
  Book,
  BarChart3,
  MessageSquare,
  FileText,
  Video,
  Search,
  CreditCard,
} from "lucide-react";

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
      <NavItem to="/" icon={<Home className="h-5 w-5" />} label="Home" />
      <NavItem
        to="/workout-generator"
        icon={<Sparkles className="h-5 w-5" />}
        label="Workout Generator"
      />
      <NavItem
        to="/generated-workouts"
        icon={<History className="h-5 w-5" />}
        label="Previous Programs"
      />
      <NavItem
        to="/journal"
        icon={<Book className="h-5 w-5" />}
        label="Journal"
      />
      <NavItem
        to="/dashboard"
        icon={<BarChart3 className="h-5 w-5" />}
        label="Dashboard"
      />
      <NavItem
        to="/program-chat"
        icon={<MessageSquare className="h-5 w-5" />}
        label="Program Chat"
      />
      <NavItem
        to="/document-editor"
        icon={<FileText className="h-5 w-5" />}
        label="Document Editor"
      />
      <NavItem
        to="/video-analysis"
        icon={<Video className="h-5 w-5" />}
        label="Publish Program"
      />
      <NavItem
        to="/technique-analysis"
        icon={<Search className="h-5 w-5" />}
        label="Technique Analysis"
      />
      <NavItem
        to="/pricing"
        icon={<CreditCard className="h-5 w-5" />}
        label="Pricing"
      />
    </nav>
  );
};
