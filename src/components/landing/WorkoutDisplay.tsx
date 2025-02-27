
import { Button } from "@/components/ui/button";
import { WorkoutDisplayHeader } from "./workout-display/WorkoutDisplayHeader";
import { WorkoutDayCard } from "./workout-display/WorkoutDayCard";
import { WorkoutDaySkeleton } from "./workout-display/WorkoutDaySkeleton";
import { ArrowLeft } from "lucide-react";
import type { WeeklyWorkouts } from "@/types/fitness";
import { formatWorkoutToMarkdown, formatAllWorkouts } from "@/utils/workout-formatting";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface WorkoutDisplayProps {
  workouts: WeeklyWorkouts;
  resetWorkouts: () => void;
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
  isGenerating?: boolean;
}

const WORKOUT_STORAGE_KEY = "strength_design_current_workout";

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
  const { session } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    setWorkouts(initialWorkouts);
  }, [initialWorkouts]);

  const handleUpdate = (day: string, updates: any) => {
    const updatedWorkouts = {
      ...workouts,
      [day]: {
        ...workouts[day],
        ...updates
      }
    };
    
    setWorkouts(updatedWorkouts);
    
    // Save updated workouts to localStorage
    localStorage.setItem(
      session?.user?.id 
        ? `${WORKOUT_STORAGE_KEY}_${session.user.id}` 
        : WORKOUT_STORAGE_KEY,
      JSON.stringify(updatedWorkouts)
    );
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-black w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="space-y-6 sm:space-y-8">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 transition-all duration-300 ease-in-out">
        <div className="space-y-4 sm:space-y-8">
          <Button
            onClick={resetWorkouts}
            className={`w-auto text-base sm:text-lg font-oswald font-bold text-black dark:text-white 
              transform -skew-x-12 uppercase tracking-wider text-center border-[2px] sm:border-[3px] 
              border-black rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 
              shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,1),3px_3px_0px_0px_#C4A052,6px_6px_0px_0px_rgba(0,0,0,1)] 
              hover:shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,1),2px_2px_0px_0px_#C4A052,4px_4px_0px_0px_rgba(0,0,0,1)] 
              transition-all duration-200 bg-gradient-to-r from-[#C4A052] to-[#E5C88E] flex items-center gap-2 mb-2 sm:mb-0`}
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            Back
          </Button>

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
