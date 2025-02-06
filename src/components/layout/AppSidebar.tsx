
import { useRef } from "react";
import { SidebarLogo } from "./sidebar/SidebarLogo";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { EmailSignup } from "./navbar/EmailSignup";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const { open, openMobile } = useSidebar();
  const isMobile = useIsMobile();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const isVisible = isMobile ? openMobile : open;

  return (
    <aside 
      ref={sidebarRef}
      className={cn(
        "fixed top-0 left-0 h-screen z-50 w-64 bg-background border-r",
        "transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        isMobile ? (
          !isVisible && "-translate-x-full"
        ) : (
          !isVisible ? "-translate-x-full" : "lg:translate-x-0"
        )
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
    </aside>
  );
}
