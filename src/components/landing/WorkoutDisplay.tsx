import { Button } from "@/components/ui/button";
import { WorkoutDisplayHeader } from "./workout-display/WorkoutDisplayHeader";
import { WorkoutDayCard } from "./workout-display/WorkoutDayCard";
import { ArrowLeft } from "lucide-react";
import type { WeeklyWorkouts } from "@/types/fitness";
import { formatWorkoutToMarkdown, formatAllWorkouts } from "@/utils/workout-formatting";

interface WorkoutDisplayProps {
  workouts: WeeklyWorkouts;
  resetWorkouts: () => void;
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
}

export function WorkoutDisplay({ 
  workouts, 
  resetWorkouts,
  isExporting,
  setIsExporting 
}: WorkoutDisplayProps) {
  const formattedWorkouts = formatAllWorkouts(workouts);
  const workoutText = formatWorkoutToMarkdown(formattedWorkouts);

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 pl-4 md:pl-72">
        <div className="space-y-8">
          <Button
            onClick={resetWorkouts}
            variant="outline"
            className="text-white hover:text-primary flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="rounded-xl border-[6px] border-black shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] bg-background p-6">
            <WorkoutDisplayHeader
              resetWorkouts={resetWorkouts}
              isExporting={isExporting}
              workoutText={workoutText}
              allWorkouts={workouts}
            />

            <div className="grid gap-8 mt-8">
              {Object.entries(workouts).map(([day, workout], index) => (
                <WorkoutDayCard 
                  key={day} 
                  day={day} 
                  workout={workout}
                  index={index}
                  isExporting={isExporting}
                  setIsExporting={setIsExporting}
                  allWorkouts={workouts}
                  onUpdate={() => {}}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}