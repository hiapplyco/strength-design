
import { WorkoutDisplayButtons } from "./workout-display/WorkoutDisplayButtons";
import { WorkoutContent } from "./workout-display/WorkoutContent";
import { WorkoutLoadingState } from "./workout-display/WorkoutLoadingState";
import type { WeeklyWorkouts } from "@/types/fitness";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

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
  const { session } = useAuth();

  useEffect(() => {
    setWorkouts(initialWorkouts);
  }, [initialWorkouts]);

  const handleUpdate = (day: string, updates: any) => {
    // Don't update special fields like _meta
    if (day === '_meta') return;
    
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

  return (
    <div className="min-h-screen bg-black/90 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-all duration-300 ease-in-out">
        <div className="space-y-6">
          {isGenerating ? (
            <WorkoutLoadingState count={Object.keys(initialWorkouts).filter(key => key !== '_meta').length} />
          ) : (
            <WorkoutContent
              workouts={workouts}
              resetWorkouts={resetWorkouts}
              isExporting={isExporting}
              setIsExporting={setIsExporting}
              onUpdate={handleUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
};
