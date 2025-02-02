import { NavLink } from "react-router-dom";
import { FileText, Dumbbell, Video, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function SidebarNavigation() {
  const { session } = useAuth();
  const { toast } = useToast();

  const handleAuthRequired = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault();
      toast({
        title: "Authentication required",
        description: "Please sign in to access this feature",
      });
    }
  };

  const navItems = [
    {
      to: "/document-editor",
      icon: <FileText className="h-5 w-5" />,
      text: "Documents",
      requiresAuth: true,
    },
    {
      to: "/workout-generator",
      icon: <Dumbbell className="h-5 w-5" />,
      text: "Workouts",
      requiresAuth: true,
    },
    {
      to: "/video-analysis",
      icon: <Video className="h-5 w-5" />,
      text: "Videos",
      requiresAuth: true,
    },
    {
      to: "/pricing",
      icon: <DollarSign className="h-5 w-5" />,
      text: "Pricing",
      requiresAuth: false,
    },
  ];

  return (
    <nav className="space-y-2">
      {navItems.map((item) => (
        <Button
          key={item.to}
          variant="ghost"
          className="w-full justify-start"
          asChild
        >
          <NavLink
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 ${isActive ? "text-accent" : "text-muted-foreground hover:text-accent"}`
            }
            onClick={(e) => item.requiresAuth && handleAuthRequired(e)}
          >
            {item.icon}
            <span>{item.text}</span>
          </NavLink>
        </Button>
      ))}
    </nav>
  );
}