
import { Button } from "@/components/ui/button";
import { WorkoutDisplayHeader } from "./workout-display/WorkoutDisplayHeader";
import { WorkoutDayCard } from "./workout-display/WorkoutDayCard";
import { WorkoutDaySkeleton } from "./workout-display/WorkoutDaySkeleton";
import { ArrowLeft } from "lucide-react";
import type { WeeklyWorkouts } from "@/types/fitness";
import { formatWorkoutToMarkdown, formatAllWorkouts } from "@/utils/workout-formatting";
import { useState } from "react";

interface WorkoutDisplayProps {
  workouts: WeeklyWorkouts;
  resetWorkouts: () => void;
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
  isGenerating?: boolean;
}

export function WorkoutDisplay({ 
  workouts: initialWorkouts, 
  resetWorkouts,
  isExporting,
  setIsExporting,
  isGenerating = false
}: WorkoutDisplayProps) {
  const [workouts, setWorkouts] = useState(initialWorkouts);
  const formattedWorkouts = formatAllWorkouts(workouts);
  const workoutText = formatWorkoutToMarkdown(formattedWorkouts);

  const handleUpdate = (day: string, updates: any) => {
    setWorkouts(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        ...updates
      }
    }));
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-black w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {Array.from({ length: Object.keys(initialWorkouts).length }).map((_, index) => (
              <WorkoutDaySkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300 ease-in-out">
        <div className="space-y-8">
          <Button
            onClick={resetWorkouts}
            className="w-auto text-lg font-oswald font-bold text-black dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[3px] border-black rounded-lg px-4 py-2 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),4px_4px_0px_0px_#C4A052,8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),2px_2px_0px_0px_#C4A052,4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 bg-gradient-to-r from-[#C4A052] to-[#E5C88E] flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="bg-background p-4 sm:p-6 rounded-lg overflow-hidden">
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
                  onUpdate={handleUpdate}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
