import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingIndicatorProps {
  className?: string;
  children?: React.ReactNode;
}

export function LoadingIndicator({ className, children }: LoadingIndicatorProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-center space-x-2">
        <div className="h-4 w-4 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
        <div className="h-4 w-4 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
        <div className="h-4 w-4 animate-bounce rounded-full bg-primary" />
      </div>
      {children && (
        <div className="text-center text-sm text-muted-foreground">
          {children}
        </div>
      )}
    </div>
  );
}