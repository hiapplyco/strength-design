
import { Skeleton } from "@/components/ui/skeleton";

export const WorkoutDaySkeleton = () => {
  return (
    <div className="w-full bg-card rounded-xl border-[6px] border-black shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] mx-auto max-w-[95%] sm:max-w-full">
      <div className="p-6 border-b flex justify-between items-center">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-40" />
      </div>
      
      <div className="p-4 sm:p-6 space-y-6">
        {["Description", "Warm-up", "Workout", "Strength Focus", "Coaching Notes"].map((section) => (
          <div key={section}>
            <Skeleton className="h-6 w-32 mb-2" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
          </div>
        ))}
        
        <div>
          <Skeleton className="h-6 w-32 mb-2" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
