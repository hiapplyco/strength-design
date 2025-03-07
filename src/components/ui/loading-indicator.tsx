
import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingIndicatorProps {
  className?: string;
  children?: React.ReactNode;
  size?: "small" | "medium" | "large";
}

export function LoadingIndicator({ className, children, size = "medium" }: LoadingIndicatorProps) {
  const sizeClasses = {
    small: "h-3 w-3",
    medium: "h-4 w-4",
    large: "h-5 w-5"
  };

  return (
    <div className={cn("flex items-center", className)}>
      <Loader2 className={cn("text-primary animate-spin mr-2", sizeClasses[size])} />
      {children && (
        <div className="text-sm text-muted-foreground">
          {children}
        </div>
      )}
    </div>
  );
}
