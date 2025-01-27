import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { exportToCalendar } from "@/utils/calendar";
import { WorkoutDisplayHeader } from "./workout-display/WorkoutDisplayHeader";
import { WorkoutDayCard } from "./workout-display/WorkoutDayCard";

interface WorkoutDay {
  description: string;
  warmup: string;
  workout: string;
  strength: string;
  notes?: string;
}

type WeeklyWorkouts = Record<string, WorkoutDay>;

interface WorkoutDisplayProps {
  workouts: WeeklyWorkouts;
  resetWorkouts: () => void;
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
}

export const WorkoutDisplay = ({
  workouts,
  resetWorkouts,
  isExporting,
  setIsExporting,
}: WorkoutDisplayProps) => {
  const [localWorkouts, setLocalWorkouts] = useState<WeeklyWorkouts>(workouts);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [workouts]);

  const handleUpdate = (day: string, updates: { warmup: string; workout: string; notes?: string; strength: string; description?: string; }) => {
    setLocalWorkouts(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        ...updates,
        description: updates.description || prev[day].description
      }
    }));
  };

  const formatAllWorkouts = () => {
    return Object.entries(localWorkouts)
      .map(([day, workout]) => {
        const sections = [
          `Day: ${day}`,
          workout.strength && `Strength:\n${workout.strength}`,
          workout.warmup && `Warmup:\n${workout.warmup}`,
          workout.workout && `Workout:\n${workout.workout}`,
          workout.notes && `Notes:\n${workout.notes}`
        ].filter(Boolean);
        return sections.join('\n\n');
      })
      .join('\n\n---\n\n');
  };

  const handleExportAllWorkouts = async () => {
    try {
      setIsExporting(true);
      const events = Object.entries(localWorkouts).map(([day, workout], index) => ({
        title: `Day ${index + 1}`,
        warmup: workout.warmup,
        workout: workout.workout,
        notes: workout.notes || '',
        dayOffset: index
      }));

      await exportToCalendar(events, toast);
    } catch (error) {
      console.error('Error exporting workouts:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatAllWorkouts());
      toast({
        title: "Success",
        description: "Workout copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy workout",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in" ref={containerRef}>
      <WorkoutDisplayHeader
        resetWorkouts={resetWorkouts}
        onExportCalendar={handleExportAllWorkouts}
        onCopy={handleCopy}
        isExporting={isExporting}
        workoutText={formatAllWorkouts()}
      />
      
      <div className="pt-36">
        <h1 className="text-4xl font-oswald text-primary mb-8 italic">Your Weekly Workout Plan</h1>
        
        <div className="grid gap-8">
          {Object.entries(localWorkouts).map(([day, workout], index) => (
            <WorkoutDayCard
              key={day}
              day={day}
              index={index}
              workout={workout}
              isExporting={isExporting}
              setIsExporting={setIsExporting}
              allWorkouts={localWorkouts}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      </div>
    </div>
  );
};