import { SidebarLogo } from "./sidebar/SidebarLogo";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { EmailSignup } from "./navbar/EmailSignup";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";

export function AppSidebar() {
  return (
    <Sidebar>
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