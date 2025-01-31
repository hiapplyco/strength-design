import { Button } from "@/components/ui/button";
import { WorkoutDisplayHeader } from "./workout-display/WorkoutDisplayHeader";
import { WorkoutDayCard } from "./workout-display/WorkoutDayCard";
import { ExportActions } from "./workout-display/ExportActions";
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
  // First format workouts to string, then to markdown
  const formattedWorkouts = formatAllWorkouts(workouts);
  const workoutText = formatWorkoutToMarkdown(formattedWorkouts);

  const handleExportCalendar = async () => {
    // Implement export calendar functionality
  };

  const handleCopy = async () => {
    // Implement copy functionality
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <Button
          onClick={resetWorkouts}
          variant="outline"
          className="mb-8 text-white hover:text-primary flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back to Generator
        </Button>

        <WorkoutDisplayHeader
          resetWorkouts={resetWorkouts}
          onExportCalendar={handleExportCalendar}
          onCopy={handleCopy}
          isExporting={isExporting}
          workoutText={workoutText}
          allWorkouts={workouts}
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-24">
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

        <ExportActions
          onExportCalendar={handleExportCalendar}
          onCopy={handleCopy}
          isExporting={isExporting}
          workoutText={workoutText}
        />
      </div>
    </div>
  );
}