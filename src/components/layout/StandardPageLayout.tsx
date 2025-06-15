
import React from "react";
import { cn } from "@/lib/utils";

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
  return (
    <div
      className={cn(
        "flex flex-col min-h-screen h-screen w-full bg-background overflow-hidden",
        className
      )}
      // Prevents unintended scrollbars and ensures full fit
    >
      {header && <header className="flex-shrink-0">{header}</header>}
      <main className="flex-1 flex-grow min-h-0 overflow-auto">
        <div className="container mx-auto px-4 h-full flex flex-col justify-center">
          {children}
        </div>
      </main>
      {footer && <footer className="flex-shrink-0">{footer}</footer>}
    </div>
  );
}
