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

const menuItems = [
  { path: '/', icon: <Home className="h-5 w-5" />, text: 'Home' },
  { path: '/document-editor', icon: <FileText className="h-5 w-5" />, text: 'Documents' },
  { path: '/workout-generator', icon: <Dumbbell className="h-5 w-5" />, text: 'Generate Workout' },
  { path: '/generated-workouts', icon: <Database className="h-5 w-5" />, text: 'My Workouts' },
  { path: '/video-analysis', icon: <Video className="h-5 w-5" />, text: 'Videos' },
  { path: '/pricing', icon: <DollarSign className="h-5 w-5" />, text: 'Pricing' },
];

export function AppSidebar() {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
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
                  <SidebarMenuButton 
                    onClick={() => handleNavigation(item.path)}
                    className="flex items-center gap-2 w-full"
                  >
                    {item.icon}
                    <span>{item.text}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}