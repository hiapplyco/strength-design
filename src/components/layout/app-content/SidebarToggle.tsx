
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
  
  if (!isVisible) return null;

  const isOpen = isMobile ? openMobile : open;

  return (
    <Button
      onClick={toggleSidebar}
      variant="ghost"
      size="icon"
      className={cn(
        "fixed z-[60] transition-all duration-300 ease-in-out",
        "text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/50",
        "backdrop-blur-sm border border-primary/30 rounded-lg",
        "size-11 hover:scale-105 active:scale-95",
        "top-4",
        isOpen 
          ? (isMobile ? "left-[17rem]" : "left-[17rem]")
          : "left-4"
      )}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      aria-expanded={isOpen}
    >
      <Menu className="size-5" />
    </Button>
  );
};
