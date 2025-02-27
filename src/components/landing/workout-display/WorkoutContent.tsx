
import { WorkoutDayCard } from "./WorkoutDayCard";
import { WorkoutDisplayHeader } from "./WorkoutDisplayHeader";
import type { WeeklyWorkouts } from "@/types/fitness";
import { formatAllWorkouts, formatWorkoutToMarkdown } from "@/utils/workout-formatting";

interface WorkoutContentProps {
  workouts: WeeklyWorkouts;
  resetWorkouts: () => void;
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
  onUpdate: (day: string, updates: any) => void;
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

  return (
    <div className="bg-background p-3 sm:p-4 md:p-6 rounded-lg overflow-hidden">
      <WorkoutDisplayHeader
        resetWorkouts={resetWorkouts}
        isExporting={isExporting}
        workoutText={workoutText}
        allWorkouts={workouts}
      />

      <div className="grid gap-4 sm:gap-6 md:gap-8 mt-4 sm:mt-6 md:mt-8">
        {Object.entries(workouts).map(([day, workout], index) => (
          <WorkoutDayCard 
            key={day} 
            day={day} 
            workout={workout}
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
