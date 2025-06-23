import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { animations, typography } from "@/lib/design-tokens";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  variant?: "spinner" | "skeleton" | "progress" | "dots";
  message?: string;
  progress?: number; // For progress variant (0-1)
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({
  variant = "spinner",
  message,
  progress = 0,
  className,
  size = "md",
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const containerSizes = {
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4",
  };

  const renderLoader = () => {
    switch (variant) {
      case "spinner":
        return (
          <motion.div
            {...animations.spin}
            className={cn(sizeClasses[size])}
          >
            <Loader2 className="h-full w-full" />
          </motion.div>
        );

      case "skeleton":
        return (
          <div className="w-full space-y-3">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="h-4 bg-muted rounded w-3/4"
            />
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
              className="h-4 bg-muted rounded w-full"
            />
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
              className="h-4 bg-muted rounded w-5/6"
            />
          </div>
        );

      case "progress":
        return (
          <div className="w-full max-w-xs">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            {progress > 0 && (
              <p className={cn(typography.caption, "text-center mt-2")}>
                {Math.round(progress * 100)}%
              </p>
            )}
          </div>
        );

      case "dots":
        return (
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={cn(
                  "rounded-full bg-primary",
                  size === "sm" ? "h-2 w-2" : size === "md" ? "h-3 w-3" : "h-4 w-4"
                )}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      {...animations.fadeIn}
      className={cn(
        "flex flex-col items-center justify-center",
        containerSizes[size],
        className
      )}
    >
      {renderLoader()}
      {message && (
        <p className={cn(
          typography.body.default,
          "text-muted-foreground text-center",
          size === "sm" && "text-xs"
        )}>
          {message}
        </p>
      )}
    </motion.div>
  );
}