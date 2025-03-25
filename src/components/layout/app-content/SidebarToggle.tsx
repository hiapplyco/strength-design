
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
  
  // Changed this condition to make the toggle visible on mobile regardless of session
  const shouldShow = isVisible || isMobile;
  
  if (!shouldShow) return null;

  const isOpen = isMobile ? openMobile : open;

  return (
    <Button
      onClick={toggleSidebar}
      variant="ghost"
      size="icon"
      className={cn(
        "absolute z-[60] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/50",
        "backdrop-blur-sm border border-primary/30 rounded-lg",
        "size-11 hover:scale-105 active:scale-95",
        isMobile ? "top-6" : "top-8",
        isOpen ? "left-[15rem]" : "left-8"
      )}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      aria-expanded={isOpen}
    >
      <Menu className="size-5" />
    </Button>
  );
};
