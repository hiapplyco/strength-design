
import { useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export const SidebarOverlay = () => {
  const { openMobile, setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (openMobile && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [openMobile, isMobile]);

  if (!openMobile || !isMobile) return null;

  return (
    <div
      onClick={() => setOpenMobile(false)}
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
    />
  );
};
