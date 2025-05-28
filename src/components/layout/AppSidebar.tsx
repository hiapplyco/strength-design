
import { useRef } from "react";
import { SidebarLogo } from "./sidebar/SidebarLogo";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { EmailSignup } from "./navbar/EmailSignup";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AppSidebar() {
  const { open, openMobile } = useSidebar();
  const isMobile = useIsMobile();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const isVisible = isMobile ? openMobile : open;

  return (
    <aside 
      ref={sidebarRef}
      className={cn(
        "h-screen w-64 bg-background border-r border-border flex flex-col",
        "transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        isMobile ? "fixed top-0 left-0 z-50" : "relative",
        !isVisible && (isMobile ? "-translate-x-full" : "w-0 overflow-hidden")
      )}
    >
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
      <div className="p-4 border-t border-border flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Theme</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
