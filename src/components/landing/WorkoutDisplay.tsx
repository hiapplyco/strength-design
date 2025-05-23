
import { WorkoutDisplayButtons } from "./workout-display/WorkoutDisplayButtons";
import { WorkoutContent } from "./workout-display/WorkoutContent";
import { WorkoutLoadingState } from "./workout-display/WorkoutLoadingState";
import type { WeeklyWorkouts, WorkoutDay, WorkoutMeta, WorkoutCycle } from "@/types/fitness";
import { isWorkoutDay, isWorkoutCycle } from "@/types/fitness";
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

  const handleUpdate = (cycleKey: string, day: string, updates: Partial<WorkoutDay | WorkoutMeta>) => {
    const updatedWorkouts = { ...workouts };
    
    if (day === '_meta') {
      // Update meta information
      updatedWorkouts._meta = {
        ...(updatedWorkouts._meta as WorkoutMeta || {}),
        ...updates as Partial<WorkoutMeta>
      };
    } else if (cycleKey === '_meta') {
      // Handle the case when it's a meta update
      updatedWorkouts._meta = {
        ...(updatedWorkouts._meta as WorkoutMeta || {}),
        ...updates as Partial<WorkoutMeta>
      };
    } else if (isWorkoutCycle(workouts[cycleKey])) {
      // Update workout day within a cycle
      const cycle = workouts[cycleKey] as WorkoutCycle;
      updatedWorkouts[cycleKey] = {
        ...cycle,
        [day]: {
          ...(cycle[day] as WorkoutDay),
          ...updates as Partial<WorkoutDay>
        }
      };
    } else if (isWorkoutDay(workouts[day])) {
      // Legacy case: Update workout day directly (no cycle)
      updatedWorkouts[day] = {
        ...(workouts[day] as WorkoutDay),
        ...updates as Partial<WorkoutDay>
      };
    } else {
      // Skip if not a valid day or _meta
      return;
    }
    
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
            <WorkoutLoadingState count={
              Object.entries(initialWorkouts)
                .filter(([key]) => key !== '_meta')
                .reduce((count, [key, value]) => {
                  if (isWorkoutCycle(value)) {
                    return count + Object.keys(value).length;
                  }
                  return count + 1;
                }, 0)
            } />
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
