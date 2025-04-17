
import { NavLink } from "react-router-dom";
import { FileText, Dumbbell, Video, MessageSquare, Home, Activity, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
      to: "/",
      icon: <Home className="h-5 w-5" />,
      text: "Home",
      requiresAuth: false,
    },
    {
      to: "/workout-generator",
      icon: <Sparkles className="h-5 w-5" />,
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
      to: "/technique-analysis",
      icon: <Activity className="h-5 w-5" />,
      text: "Technique Analysis",
      requiresAuth: true,
    },
    {
      to: "/program-chat",
      icon: <MessageSquare className="h-5 w-5" />,
      text: "Program Chat",
      requiresAuth: true,
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
              cn(
                "flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-200",
                isActive ? "text-white" : ""
              )
            }
            onClick={(e) => item.requiresAuth && !session && handleAuthRequired(e)}
            end
          >
            {item.icon}
            <span>{item.text}</span>
          </NavLink>
        </Button>
      ))}
    </nav>
  );
}
