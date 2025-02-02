import { Menu, X } from "lucide-react";
import { SidebarLogo } from "./sidebar/SidebarLogo";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { EmailSignup } from "./navbar/EmailSignup";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function AppSidebar() {
  const { open, toggleSidebar } = useSidebar();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 text-accent hover:text-accent/80"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      <div className={`fixed top-0 left-0 h-screen w-64 bg-background border-r transform transition-transform duration-300 ease-in-out ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}>
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
      </div>
    </>
  );
}