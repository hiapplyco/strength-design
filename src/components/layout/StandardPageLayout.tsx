
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { animations, spacing, typography } from "@/lib/design-tokens";

/**
 * Provides a standardized, responsive, sidebar-aware layout for all major pages.
 * Includes optional header with title, description, back button, and actions.
 */
interface StandardPageLayoutProps {
  // Page metadata
  title?: string;
  description?: string;
  
  // Navigation
  showBack?: boolean;
  backUrl?: string;
  onBack?: () => void;
  
  // Actions
  rightAction?: React.ReactNode;
  
  // Legacy props (for backward compatibility)
  header?: React.ReactNode;
  footer?: React.ReactNode;
  
  // Content
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  
  // Layout options
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
  noPadding?: boolean;
}

export function StandardPageLayout({ 
  title,
  description,
  showBack,
  backUrl,
  onBack,
  rightAction,
  header,
  footer,
  children,
  className,
  contentClassName,
  maxWidth = "7xl",
  noPadding = false
}: StandardPageLayoutProps) {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };
  
  // Build header content
  const headerContent = header || (title || showBack || rightAction) ? (
    <div className={cn(
      "border-b bg-background",
      noPadding ? "" : spacing.section.default
    )}>
      <div className={cn(
        "mx-auto w-full",
        maxWidth !== "full" && `max-w-${maxWidth}`
      )}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {showBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            {(title || description) && (
              <div className="min-w-0 flex-1">
                {title && (
                  <h1 className={cn(typography.display.h4, "truncate")}>
                    {title}
                  </h1>
                )}
                {description && (
                  <p className={cn(typography.body.small, "text-muted-foreground mt-1")}>
                    {description}
                  </p>
                )}
              </div>
            )}
          </div>
          
          {rightAction && (
            <div className="shrink-0">
              {rightAction}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <motion.div
      {...animations.pageIn}
      className={cn(
        "flex flex-col min-h-screen w-full bg-background min-w-0 overflow-hidden",
        "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        className
      )}
    >
      {headerContent && (
        <header className="flex-shrink-0">
          {headerContent}
        </header>
      )}
      
      <main className={cn(
        "flex-1 w-full overflow-auto min-w-0",
        maxWidth !== "full" && !noPadding && `max-w-${maxWidth} mx-auto`,
        !noPadding && spacing.section.default,
        contentClassName
      )}>
        {children}
      </main>
      
      {footer && (
        <footer className="flex-shrink-0 bg-background">
          {footer}
        </footer>
      )}
    </motion.div>
  );
}
