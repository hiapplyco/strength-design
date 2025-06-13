
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface SidebarToggleProps {
  isVisible: boolean;
}

export const SidebarToggle = ({ isVisible }: SidebarToggleProps) => {
  const { toggleSidebar, open, openMobile } = useSidebar();
  const isMobile = useIsMobile();
  
  const shouldShow = true;
  
  if (!shouldShow) return null;

  const isOpen = isMobile ? openMobile : open;

  return (
    <Button
      onClick={toggleSidebar}
      variant="ghost"
      size="icon"
      className={cn(
        "fixed z-[60] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/50",
        "backdrop-blur-sm border border-primary/30 rounded-lg",
        "size-11 hover:scale-105 active:scale-95",
        // Adjusted positioning to avoid title overlap
        isMobile ? "top-4" : "top-4",
        // Move further left when sidebar is closed to avoid title overlap
        isMobile 
          ? (isOpen ? "left-[15rem]" : "left-2")
          : (isOpen ? "left-[17rem]" : "left-2")
      )}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      aria-expanded={isOpen}
    >
      <Menu className="size-5" />
    </Button>
  );
};
