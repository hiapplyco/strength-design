
import { Button } from "@/components/ui/button";
import { WorkoutDisplayHeader } from "./workout-display/WorkoutDisplayHeader";
import { WorkoutDayCard } from "./workout-display/WorkoutDayCard";
import { ArrowLeft } from "lucide-react";
import type { WeeklyWorkouts } from "@/types/fitness";
import { formatWorkoutToMarkdown, formatAllWorkouts } from "@/utils/workout-formatting";
import { useState } from "react";

interface WorkoutDisplayProps {
  workouts: WeeklyWorkouts;
  resetWorkouts: () => void;
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
}

export function WorkoutDisplay({ 
  workouts: initialWorkouts, 
  resetWorkouts,
  isExporting,
  setIsExporting 
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

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8 transition-all duration-300 ease-in-out">
        <div className="space-y-8">
          <Button
            onClick={resetWorkouts}
            variant="outline"
            className="text-white hover:text-primary flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="bg-background p-6">
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
