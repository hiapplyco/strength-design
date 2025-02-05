import { NavLink } from "react-router-dom";
import { FileText, Dumbbell, Video, DollarSign, MessageSquare } from "lucide-react";
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
      to: "/workout-generator",
      icon: <Dumbbell className="h-5 w-5" />,
      text: "Generate Program",
      requiresAuth: true,
    },
    {
      to: "/generated-workouts",
      icon: <FileText className="h-5 w-5" />,
      text: "Previous Programs",
      requiresAuth: true,
    },
    {
      to: "/video-analysis",
      icon: <Video className="h-5 w-5" />,
      text: "Publish Program",
      requiresAuth: true,
    },
    {
      to: "/program-chat",
      icon: <MessageSquare className="h-5 w-5" />,
      text: "Program Chat",
      requiresAuth: true,
    },
    {
      to: "/pricing",
      icon: <DollarSign className="h-5 w-5" />,
      text: "Upgrade to Pro",
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