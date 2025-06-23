import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { animations, typography, spacing } from "@/lib/design-tokens";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      icon: "h-12 w-12",
      title: typography.display.h6,
      spacing: spacing.gap.sm,
      padding: spacing.component.md,
    },
    md: {
      icon: "h-16 w-16",
      title: typography.display.h5,
      spacing: spacing.gap.md,
      padding: spacing.component.lg,
    },
    lg: {
      icon: "h-20 w-20",
      title: typography.display.h4,
      spacing: spacing.gap.lg,
      padding: spacing.component.xl,
    },
  };

  const config = sizeClasses[size];

  return (
    <motion.div
      {...animations.fadeIn}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        config.padding,
        config.spacing,
        "min-h-[200px]",
        className
      )}
    >
      {Icon && (
        <motion.div
          {...animations.slideUp}
          transition={{ delay: 0.1 }}
          className={cn(
            config.icon,
            "text-muted-foreground/50 mb-2"
          )}
        >
          <Icon className="h-full w-full" />
        </motion.div>
      )}
      
      <motion.div
        {...animations.slideUp}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        <h3 className={cn(config.title, "text-foreground")}>
          {title}
        </h3>
        
        {description && (
          <p className={cn(
            typography.body.default,
            "text-muted-foreground max-w-sm mx-auto"
          )}>
            {description}
          </p>
        )}
      </motion.div>
      
      {action && (
        <motion.div
          {...animations.slideUp}
          transition={{ delay: 0.3 }}
          className="mt-2"
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}