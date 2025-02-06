
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface SidebarToggleProps {
  isVisible: boolean;
}

export const SidebarToggle = ({ isVisible }: SidebarToggleProps) => {
  const { toggleSidebar, open } = useSidebar();
  const isMobile = useIsMobile();

  if (!isVisible) return null;

  return (
    <Button
      onClick={toggleSidebar}
      variant="ghost"
      size="icon"
      className={cn(
        "fixed z-[1000] transition-opacity duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "text-[#C4A052] hover:bg-[#C4A052]/10 focus-visible:ring-2 focus-visible:ring-[#C4A052]/50",
        "backdrop-blur-sm border border-[#C4A052]/30 rounded-lg",
        "size-11 hover:scale-105 active:scale-95",
        open ? "opacity-0 pointer-events-none" : "opacity-100",
        isMobile ? "top-6 left-6" : "top-8 left-8"
      )}
      aria-label={open ? "Close sidebar" : "Open sidebar"}
      aria-expanded={!open}
    >
      <Menu className="size-5" />
    </Button>
  );
};
