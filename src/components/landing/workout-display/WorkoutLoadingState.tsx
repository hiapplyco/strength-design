
import { WorkoutDaySkeleton } from "./WorkoutDaySkeleton";

interface WorkoutLoadingStateProps {
  count: number;
}

export const WorkoutLoadingState = ({ count }: WorkoutLoadingStateProps) => {
  return (
    <div className="space-y-6 sm:space-y-8">
      {Array.from({ length: count }).map((_, index) => (
        <WorkoutDaySkeleton key={index} />
      ))}
    </div>
  );
};
