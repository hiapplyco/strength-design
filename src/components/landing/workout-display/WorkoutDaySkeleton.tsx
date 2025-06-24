
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { spacing, responsive } from "@/lib/design-tokens";

export const WorkoutDaySkeleton = () => {
  return (
    <Card 
      variant="elevated" 
      className="w-full mx-auto max-w-[95%] sm:max-w-full"
    >
      <CardHeader className="flex flex-row justify-between items-center">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-40" />
      </CardHeader>
      
      <CardContent className={cn(spacing.gap.lg)}>
        {["Description", "Warm-up", "Workout", "Strength Focus", "Coaching Notes"].map((section) => (
          <div key={section}>
            <Skeleton className="h-6 w-32 mb-2" />
            <div className={cn(spacing.gap.sm)}>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
          </div>
        ))}
        
        <div>
          <Skeleton className="h-6 w-32 mb-2" />
          <div className={cn(responsive.grid[3], spacing.gap.md)}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
