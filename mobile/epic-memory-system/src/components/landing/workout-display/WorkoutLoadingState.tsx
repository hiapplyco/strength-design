
import { WorkoutDaySkeleton } from "./WorkoutDaySkeleton";
import { cn } from "@/lib/utils";
import { spacing } from "@/lib/design-tokens";

interface WorkoutLoadingStateProps {
  count: number;
  className?: string;
}

export const WorkoutLoadingState = ({ count, className }: WorkoutLoadingStateProps) => {
  return (
    <div className={cn(spacing.gap.responsive.lg, className)}>
      {Array.from({ length: count }).map((_, index) => (
        <WorkoutDaySkeleton key={index} />
      ))}
    </div>
  );
};
