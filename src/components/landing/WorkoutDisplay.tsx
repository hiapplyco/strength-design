import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { WorkoutHeader } from "@/components/workout/WorkoutHeader";
import { exportToCalendar } from "@/utils/calendar";
import { useState, useEffect, useRef } from "react";

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

      await exportToCalendar(events);
    } catch (error) {
      console.error('Error exporting workouts:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in" ref={containerRef}>
      <div className="fixed top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2"
            onClick={resetWorkouts}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Button>
          
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExportAllWorkouts}
            disabled={isExporting}
          >
            <CalendarDays className="w-4 h-4" />
            Export All to Calendar
          </Button>
        </div>
      </div>
      
      <div className="pt-32">
        <h1 className="text-4xl font-oswald text-primary mb-8 italic">Your Weekly Workout Plan</h1>
        
        <div className="grid gap-8">
          {Object.entries(localWorkouts).map(([day, workout], index) => (
            <div 
              key={day} 
              className="bg-card rounded-xl border-[6px] border-black shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] hover:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),4px_4px_0px_0px_rgba(255,0,0,1),8px_8px_0px_0px_#C4A052] transition-all duration-200"
            >
              <WorkoutHeader
                title={`Day${index + 1}`}
                isExporting={isExporting}
                onExport={async () => {
                  try {
                    setIsExporting(true);
                    await exportToCalendar([{
                      title: `Day ${index + 1}`,
                      warmup: workout.warmup,
                      workout: workout.workout,
                      notes: workout.notes || '',
                      dayOffset: 0
                    }]);
                  } finally {
                    setIsExporting(false);
                  }
                }}
                warmup={workout.warmup}
                workout={workout.workout}
                notes={workout.notes}
                strength={workout.strength}
                allWorkouts={localWorkouts}
                onUpdate={(updates) => handleUpdate(day, updates)}
              />
              
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-destructive mb-2">Description</h3>
                  <p className="text-muted-foreground">{workout.description}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-destructive mb-2">Warm-up</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{workout.warmup}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-destructive mb-2">Workout</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{workout.workout}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-destructive mb-2">Strength Focus</h3>
                  <p className="text-muted-foreground">{workout.strength}</p>
                </div>
                
                {workout.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-destructive mb-2">Coaching Notes</h3>
                    <p className="text-muted-foreground">{workout.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};