
import React from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Provides a standardized, responsive, sidebar-aware layout for all major pages.
 * Header, content, and footer slots are optional.
 */
interface StandardPageLayoutProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function StandardPageLayout({ header, children, footer, className }: StandardPageLayoutProps) {
  const { open, openMobile } = useSidebar();
  const isMobile = useIsMobile();
  
  const isVisible = isMobile ? openMobile : open;

  return (
    <div
      className={cn(
        "flex flex-col min-h-screen h-screen w-full bg-background overflow-hidden",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        // Apply margin-left only on desktop when sidebar is open
        !isMobile && isVisible ? "ml-64" : "ml-0",
        className
      )}
    >
      {header && <header className="flex-shrink-0 bg-background">{header}</header>}
      <main className="flex-1 flex-grow min-h-0 overflow-auto bg-background w-full max-w-none">
        <div className="w-full h-full flex flex-col px-2 sm:px-4">
          {children}
        </div>
      </main>
      {footer && <footer className="flex-shrink-0 bg-background">{footer}</footer>}
    </div>
  );
}
