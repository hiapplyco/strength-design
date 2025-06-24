
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export const SidebarOverlay = () => {
  const { openMobile, setOpenMobile, setOpen } = useSidebar();
  const isMobile = useIsMobile();

  if (!openMobile || !isMobile) return null;

  const handleClose = () => {
    setOpenMobile(false);
    setOpen(false);
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden"
    />
  );
};
