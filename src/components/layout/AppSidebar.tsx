import { Link, useNavigate } from "react-router-dom";
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
  SidebarMenuButton,
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

  const handleAuthCheck = (requiresAuth: boolean) => {
    if (requiresAuth && !session) {
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
          <Link to="/" className="text-2xl font-collegiate text-accent tracking-wider">
            STRENGTH.DESIGN
          </Link>
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
                  <Link 
                    to={item.path}
                    onClick={(e) => {
                      if (!handleAuthCheck(item.requiresAuth)) {
                        e.preventDefault();
                      }
                    }}
                    className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent"
                  >
                    {item.icon}
                    <span>{item.text}</span>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}