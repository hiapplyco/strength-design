import { NavLink } from "react-router-dom";
import { FileText, Dumbbell, Video, DollarSign, Database } from "lucide-react";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { path: '/workout-generator', icon: <Dumbbell className="h-5 w-5" />, text: 'Generate Workout', requiresAuth: true },
  { path: '/generated-workouts', icon: <Database className="h-5 w-5" />, text: 'My Workouts', requiresAuth: true },
  { path: '/document-editor', icon: <FileText className="h-5 w-5" />, text: 'Document Workout', requiresAuth: true },
  { path: '/video-analysis', icon: <Video className="h-5 w-5" />, text: 'Videos', requiresAuth: true },
  { path: '/pricing', icon: <DollarSign className="h-5 w-5" />, text: 'Pricing', requiresAuth: false },
];

export const SidebarNavigation = () => {
  const { session } = useAuth();
  const { toast } = useToast();

  const handleAuthCheck = (requiresAuth: boolean, e: React.MouseEvent) => {
    if (requiresAuth && !session) {
      e.preventDefault();
      toast({
        title: "Authentication Required",
        description: "Please sign in to access this feature",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.path}>
          <NavLink 
            to={item.path}
            onClick={(e) => handleAuthCheck(item.requiresAuth, e)}
            className={({ isActive }) =>
              `flex items-center gap-2 w-full p-2 rounded-md transition-colors ${
                isActive
                  ? "bg-[#B08D57] text-white"
                  : "text-white hover:bg-[#B08D57]/80"
              }`
            }
          >
            {item.icon}
            <span>{item.text}</span>
          </NavLink>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
};