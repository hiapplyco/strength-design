
import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { sizes, typography } from "@/lib/design-tokens";

interface LoadingIndicatorProps {
  className?: string;
  children?: React.ReactNode;
  size?: "small" | "medium" | "large";
  variant?: "default" | "primary" | "muted";
}

export function LoadingIndicator({ 
  className, 
  children, 
  size = "medium",
  variant = "default" 
}: LoadingIndicatorProps) {
  const sizeClasses = {
    small: sizes.icon.sm,
    medium: sizes.icon.md,
    large: sizes.icon.lg
  };

  const variantClasses = {
    default: "text-foreground",
    primary: "text-primary",
    muted: "text-muted-foreground"
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 
        className={cn(
          "animate-spin",
          sizeClasses[size],
          variantClasses[variant]
        )} 
      />
      {children && (
        <div className={cn(
          typography.body.default,
          variant === "muted" ? "text-muted-foreground" : "text-foreground"
        )}>
          {children}
        </div>
      )}
    </div>
  );
}
