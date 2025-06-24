
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
        "h-screen bg-background border-r border-border flex flex-col flex-shrink-0",
        "transition-all duration-300 ease-in-out",
        // On mobile: overlay with fixed positioning and transform
        isMobile ? [
          "fixed top-0 left-0 z-50 shadow-lg",
          "w-64",
          isVisible ? "translate-x-0" : "-translate-x-full"
        ] : [
          // On desktop: proper flex layout that pushes content
          "relative z-10",
          isVisible ? "w-64" : "w-0",
          isVisible ? "border-r" : "border-r-0"
        ]
      )}
    >
      {/* Only render content when sidebar should be visible */}
      {(isMobile ? isVisible : true) && (
        <>
          {/* Header Section */}
          <div className={cn(
            "p-4 bg-background border-b border-border flex-shrink-0",
            !isVisible && !isMobile && "hidden"
          )}>
            <SidebarLogo />
            <div className="mt-4">
              <EmailSignup />
            </div>
          </div>
          
          {/* Scrollable Content Section */}
          <div className={cn(
            "flex-1 overflow-y-auto bg-background",
            !isVisible && !isMobile && "hidden"
          )}>
            <SidebarNavigation />
          </div>
          
          {/* Footer Section */}
          <div className={cn(
            "p-4 border-t border-border flex justify-between items-center bg-background flex-shrink-0",
            !isVisible && !isMobile && "hidden"
          )}>
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </>
      )}
    </aside>
  );
}
