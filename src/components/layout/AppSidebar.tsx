
import { useRef } from "react";
import { SidebarLogo } from "./sidebar/SidebarLogo";
import { SidebarNavigation } from "./sidebar/SidebarNavigation";
import { EmailSignup } from "./navbar/EmailSignup";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { zIndex } from "@/lib/design-tokens";

export function AppSidebar() {
  const { open, openMobile } = useSidebar();
  const isMobile = useIsMobile();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const isVisible = isMobile ? openMobile : open;

  return (
    <aside 
      ref={sidebarRef}
      className={cn(
        `h-screen w-64 bg-background border-r border-border flex flex-col fixed top-0 left-0 ${zIndex.sidebar}`,
        "transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "shadow-lg",
        !isVisible && "-translate-x-full"
      )}
      style={{
        backgroundColor: 'hsl(var(--background))',
        borderColor: 'hsl(var(--border))'
      }}
    >
      {/* Header Section */}
      <div className="p-4 bg-background border-b border-border flex-shrink-0">
        <SidebarLogo />
        <div className="mt-4">
          <EmailSignup />
        </div>
      </div>
      
      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="px-4 py-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">Navigation</div>
          <SidebarNavigation />
        </div>
      </div>
      
      {/* Footer Section */}
      <div className="p-4 border-t border-border flex justify-between items-center bg-background flex-shrink-0">
        <span className="text-sm text-muted-foreground">Theme</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
