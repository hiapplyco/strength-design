import { NavLink } from "react-router-dom";
import { 
  Home, 
  FileText, 
  Dumbbell, 
  Video, 
  DollarSign,
  Database,
  Menu
} from "lucide-react";
import { 
  Sidebar, 
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { EmailSignup } from "./navbar/EmailSignup";
import { useAuthStateManager } from "@/hooks/useAuthStateManager";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  { path: '/', icon: <Home className="h-5 w-5" />, text: 'Home', requiresAuth: false },
  { path: '/document-editor', icon: <FileText className="h-5 w-5" />, text: 'Documents', requiresAuth: true },
  { path: '/workout-generator', icon: <Dumbbell className="h-5 w-5" />, text: 'Generate Workout', requiresAuth: true },
  { path: '/generated-workouts', icon: <Database className="h-5 w-5" />, text: 'My Workouts', requiresAuth: true },
  { path: '/video-analysis', icon: <Video className="h-5 w-5" />, text: 'Videos', requiresAuth: true },
  { path: '/pricing', icon: <DollarSign className="h-5 w-5" />, text: 'Pricing', requiresAuth: false },
];

export function AppSidebar() {
  const session = useAuthStateManager();
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
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <NavLink
            to={session ? "/workout-generator" : "/"}
            className="text-2xl font-collegiate text-accent tracking-wider hover:text-accent/80 transition-colors"
          >
            STRENGTH.DESIGN
          </NavLink>
          <SidebarTrigger>
            <Menu className="h-6 w-6" />
          </SidebarTrigger>
        </div>
        <div className="mt-4">
          <EmailSignup />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <NavLink 
                    to={item.path}
                    onClick={(e) => handleAuthCheck(item.requiresAuth, e)}
                    end={true}
                    className={({ isActive }) =>
                      `flex items-center gap-2 w-full p-2 rounded-md transition-colors ${
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-white hover:bg-accent/80 hover:text-accent-foreground"
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.text}</span>
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}