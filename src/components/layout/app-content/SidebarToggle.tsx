
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

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
      className={`fixed top-4 left-4 z-50 text-[#C4A052] hover:text-[#E5C88E] transition-all duration-200 ${
        open ? 'opacity-0' : 'opacity-100'
      }`}
      aria-label={open ? "Close sidebar" : "Open sidebar"}
    >
      <Menu className="h-6 w-6" />
    </Button>
  );
};
