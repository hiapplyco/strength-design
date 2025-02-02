import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

interface SidebarToggleProps {
  isVisible: boolean;
}

export const SidebarToggle = ({ isVisible }: SidebarToggleProps) => {
  const { toggleSidebar } = useSidebar();

  if (!isVisible) return null;

  return (
    <Button
      onClick={toggleSidebar}
      variant="ghost"
      size="icon"
      className="fixed top-4 left-[16.5rem] z-50 text-muted-foreground hover:text-accent md:left-[15.5rem]"
    >
      <Menu className="h-6 w-6" />
    </Button>
  );
};