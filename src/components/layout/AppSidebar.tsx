import { SidebarLogo } from "./sidebar/SidebarLogo";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { EmailSignup } from "./navbar/EmailSignup";
import { Sidebar, SidebarContent, SidebarTrigger } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarTrigger className="fixed top-4 left-4 z-50">
        <Menu className="h-6 w-6" />
      </SidebarTrigger>
      <SidebarContent>
        <div className="p-4">
          <SidebarLogo />
          <div className="mt-4">
            <EmailSignup />
          </div>
        </div>
        <div className="flex-1 px-4">
          <div className="text-sm font-medium text-muted-foreground">Navigation</div>
          <div className="mt-2">
            <SidebarNavigation />
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}