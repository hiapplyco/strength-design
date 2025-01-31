import { Button } from "@/components/ui/button";
import { WorkoutDisplayHeader } from "./workout-display/WorkoutDisplayHeader";
import { WorkoutDayCard } from "./workout-display/WorkoutDayCard";
import { ExportActions } from "./workout-display/ExportActions";
import { ArrowLeft } from "lucide-react";
import type { WeeklyWorkouts } from "@/types/fitness";

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
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            onClick={resetWorkouts}
            variant="outline"
            className="mb-4 text-white hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back to Generator
          </Button>
          
          <WorkoutDisplayHeader />
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(workouts).map(([day, workout]) => (
            <WorkoutDayCard key={day} day={day} workout={workout} />
          ))}
        </div>

        <ExportActions
          workouts={workouts}
          isExporting={isExporting}
          setIsExporting={setIsExporting}
        />
      </div>
    </div>
  );
}