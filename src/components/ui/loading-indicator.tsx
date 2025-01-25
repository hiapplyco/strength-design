import React from "react";

interface LoadingIndicatorProps {
  className?: string;
  children?: React.ReactNode;
}

export function LoadingIndicator({ className, children }: LoadingIndicatorProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}