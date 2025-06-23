import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { animations, typography, spacing, colors } from "@/lib/design-tokens";
import { Card } from "./card";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DataCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  changeType?: "increase" | "decrease" | "neutral";
  icon?: LucideIcon;
  variant?: "default" | "success" | "warning" | "danger";
  description?: string;
  className?: string;
  onClick?: () => void;
}

export function DataCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  variant = "default",
  description,
  className,
  onClick,
}: DataCardProps) {
  // Auto-detect change type if not provided
  const detectedChangeType = changeType || (
    change 
      ? (typeof change === 'string' && change.startsWith('-')) || (typeof change === 'number' && change < 0)
        ? 'decrease' 
        : change === '0' || change === 0 
          ? 'neutral' 
          : 'increase'
      : 'neutral'
  );

  const variantStyles = {
    default: "",
    success: "border-green-500/20 bg-green-500/5",
    warning: "border-amber-500/20 bg-amber-500/5", 
    danger: "border-red-500/20 bg-red-500/5",
  };

  const changeIcons = {
    increase: TrendingUp,
    decrease: TrendingDown,
    neutral: Minus,
  };

  const changeColors = {
    increase: "text-green-600 dark:text-green-400",
    decrease: "text-red-600 dark:text-red-400",
    neutral: "text-muted-foreground",
  };

  const ChangeIcon = changeIcons[detectedChangeType];

  return (
    <motion.div {...animations.fadeIn}>
      <Card
        variant={onClick ? "interactive" : "flat"}
        className={cn(
          spacing.component.md,
          variantStyles[variant],
          onClick && "cursor-pointer",
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {Icon && (
                <Icon className={cn(
                  "h-4 w-4 text-muted-foreground",
                  variant === "success" && "text-green-600 dark:text-green-400",
                  variant === "warning" && "text-amber-600 dark:text-amber-400",
                  variant === "danger" && "text-red-600 dark:text-red-400"
                )} />
              )}
              <p className={cn(typography.label, "text-muted-foreground")}>
                {title}
              </p>
            </div>
            
            <div className="flex items-baseline gap-2">
              <p className={cn(
                typography.display.h4,
                "text-foreground"
              )}>
                {value}
              </p>
              
              {change && (
                <div className={cn(
                  "flex items-center gap-1",
                  changeColors[detectedChangeType]
                )}>
                  <ChangeIcon className="h-3 w-3" />
                  <span className={typography.body.small}>
                    {change}
                  </span>
                </div>
              )}
            </div>
            
            {description && (
              <p className={cn(
                typography.caption,
                "text-muted-foreground mt-1"
              )}>
                {description}
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}