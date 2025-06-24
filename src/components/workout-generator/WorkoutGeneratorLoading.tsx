
import { WorkoutGenerating } from "@/components/ui/loading-states";
import { cn } from "@/lib/utils";

interface WorkoutGeneratorLoadingProps {
  className?: string;
  fullScreen?: boolean;
}

export function WorkoutGeneratorLoading({ 
  className,
  fullScreen = true 
}: WorkoutGeneratorLoadingProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-center",
        fullScreen && "min-h-screen bg-background",
        className
      )}
    >
      <WorkoutGenerating />
    </div>
  );
}
