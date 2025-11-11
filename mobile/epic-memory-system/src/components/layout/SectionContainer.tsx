import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { animations, spacing, typography, variants } from "@/lib/design-tokens";

interface SectionContainerProps {
  // Content
  title?: string;
  description?: string;
  children: React.ReactNode;
  
  // Styling
  variant?: "default" | "ghost" | "bordered" | "elevated";
  spacing?: keyof typeof spacing.component;
  className?: string;
  
  // Actions
  rightAction?: React.ReactNode;
  
  // Options
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function SectionContainer({
  title,
  description,
  children,
  variant = "default",
  spacing: spacingSize = "md",
  className,
  rightAction,
  collapsible = false,
  defaultCollapsed = false,
}: SectionContainerProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  
  const sectionVariants = {
    default: "",
    ghost: "bg-muted/30",
    bordered: "border rounded-lg",
    elevated: variants.card.elevated,
  };
  
  const contentVisible = !collapsible || !isCollapsed;
  
  return (
    <motion.section
      {...animations.fadeIn}
      className={cn(
        "w-full",
        sectionVariants[variant],
        variant === "bordered" || variant === "elevated" ? spacing.component[spacingSize] : "",
        className
      )}
    >
      {(title || description || rightAction) && (
        <div className={cn(
          "flex items-start justify-between gap-4",
          variant !== "bordered" && variant !== "elevated" && "mb-4"
        )}>
          <div className="flex-1 min-w-0">
            {title && (
              <h2 
                className={cn(
                  typography.display.h5,
                  collapsible && "cursor-pointer select-none"
                )}
                onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
              >
                {collapsible && (
                  <span className={cn(
                    "inline-block mr-2 transition-transform",
                    isCollapsed ? "" : "rotate-90"
                  )}>
                    ▶
                  </span>
                )}
                {title}
              </h2>
            )}
            {description && contentVisible && (
              <p className={cn(
                typography.body.small,
                "text-muted-foreground mt-1"
              )}>
                {description}
              </p>
            )}
          </div>
          
          {rightAction && contentVisible && (
            <div className="shrink-0">
              {rightAction}
            </div>
          )}
        </div>
      )}
      
      {contentVisible && (
        <motion.div
          initial={collapsible ? { height: 0, opacity: 0 } : false}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            variant === "bordered" || variant === "elevated" ? "" : "mt-2"
          )}
        >
          {children}
        </motion.div>
      )}
    </motion.section>
  );
}