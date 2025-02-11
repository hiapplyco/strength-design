
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
        "absolute z-[60] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "text-[#C4A052] hover:bg-[#C4A052]/10 focus-visible:ring-2 focus-visible:ring-[#C4A052]/50",
        "backdrop-blur-sm border border-[#C4A052]/30 rounded-lg",
        "size-11 hover:scale-105 active:scale-95",
        isMobile ? "top-6" : "top-8",
        isOpen ? "left-[16.5rem]" : "left-8"
      )}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      aria-expanded={isOpen}
    >
      <Menu className="size-5" />
    </Button>
  );
};
