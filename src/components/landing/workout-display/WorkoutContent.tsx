
import { WorkoutDayCard } from "./WorkoutDayCard";
import { WorkoutDisplayHeader } from "./WorkoutDisplayHeader";
import type { WeeklyWorkouts, WorkoutDay, WorkoutMeta } from "@/types/fitness";
import { isWorkoutDay } from "@/types/fitness";
import { formatAllWorkouts, formatWorkoutToMarkdown } from "@/utils/workout-formatting";

interface WorkoutContentProps {
  workouts: WeeklyWorkouts;
  resetWorkouts: () => void;
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
  onUpdate: (day: string, updates: Partial<WorkoutDay>) => void;
}

export const WorkoutContent = ({
  workouts,
  resetWorkouts,
  isExporting,
  setIsExporting,
  onUpdate
}: WorkoutContentProps) => {
  const formattedWorkouts = formatAllWorkouts(workouts);
  const workoutText = formatWorkoutToMarkdown(formattedWorkouts);
  
  // Extract title and summary from _meta if available
  const meta = workouts._meta as WorkoutMeta | undefined;
  const workoutTitle = meta?.title || "Custom Workout Program";
  const workoutSummary = meta?.summary || "";

  return (
    <div className="bg-background p-3 sm:p-4 md:p-6 rounded-lg overflow-hidden">
      {/* Title Section */}
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-oswald text-primary tracking-tight">
          {workoutTitle}
        </h1>
        {workoutSummary && (
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto">
            {workoutSummary}
          </p>
        )}
      </div>

      <WorkoutDisplayHeader
        resetWorkouts={resetWorkouts}
        isExporting={isExporting}
        workoutText={workoutText}
        allWorkouts={workouts}
      />

      <div className="grid gap-4 sm:gap-6 md:gap-8 mt-4 sm:mt-6 md:mt-8">
        {Object.entries(workouts)
          .filter(([key, value]) => key !== '_meta' && isWorkoutDay(value)) // Filter out the _meta entry and ensure it's a WorkoutDay
          .map(([day, workout], index) => (
            <WorkoutDayCard 
              key={day} 
              day={day} 
              workout={workout as WorkoutDay}
              index={index}
              isExporting={isExporting}
              setIsExporting={setIsExporting}
              allWorkouts={workouts}
              onUpdate={onUpdate}
            />
          ))}
      </div>
    </div>
  );
};
