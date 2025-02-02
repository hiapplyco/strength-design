import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarToggleProps {
  isVisible: boolean;
}

export const SidebarToggle = ({ isVisible }: SidebarToggleProps) => {
  const { toggleSidebar, openMobile } = useSidebar();
  const isMobile = useIsMobile();

  if (!isVisible) return null;

  return (
    <Button
      onClick={toggleSidebar}
      variant="ghost"
      size="icon"
      className="fixed top-4 left-4 z-50 text-muted-foreground hover:text-accent md:hidden"
      aria-label={openMobile ? "Close sidebar" : "Open sidebar"}
    >
      <Menu className="h-6 w-6" />
    </Button>
  );
};