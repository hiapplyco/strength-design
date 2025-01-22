import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { WorkoutHeader } from "@/components/workout/WorkoutHeader";
import { exportToCalendar } from "@/utils/calendar";
import { useToast } from "@/hooks/use-toast";
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
  isSpeaking: boolean;
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
  handleSpeakWorkout: (day: string, workouts: WeeklyWorkouts, warmup: string, workout: string, notes: string) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

export const WorkoutDisplay = ({
  workouts,
  resetWorkouts,
  isSpeaking,
  isExporting,
  setIsExporting,
  handleSpeakWorkout,
  audioRef
}: WorkoutDisplayProps) => {
  const { toast } = useToast();
  const [localWorkouts, setLocalWorkouts] = useState<WeeklyWorkouts>(workouts);
  const [speakingDay, setSpeakingDay] = useState<string | null>(null);
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

  const handleSpeak = (day: string, workout: WorkoutDay) => {
    setSpeakingDay(day);
    handleSpeakWorkout(day, workouts, workout.warmup, workout.workout, workout.notes || '');
  };

  const formatDayTitle = (day: string) => {
    return day
      .split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleExportAllWorkouts = async () => {
    try {
      setIsExporting(true);
      // Combine all workouts into one description
      const combinedDescription = Object.entries(localWorkouts)
        .map(([day, workout]) => {
          return `${formatDayTitle(day)}:\n\nWarmup:\n${workout.warmup}\n\nWorkout:\n${workout.workout}\n\nNotes:\n${workout.notes || ''}\n\n---\n`;
        })
        .join('\n');

      await exportToCalendar(
        'Weekly Workout Plan',
        '', // warmup
        combinedDescription, // all workouts in the description
        '', // notes
        toast,
        0, // no offset needed
        Object.keys(localWorkouts).length // duration in days
      );

      toast({
        title: "Success",
        description: "Workout plan has been exported to your calendar",
      });
    } catch (error) {
      console.error('Error exporting workouts:', error);
      toast({
        title: "Error",
        description: "Failed to export workouts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in" ref={containerRef}>
      <div className="flex justify-between items-center mb-8">
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
      
      <h1 className="text-4xl font-oswald text-primary mb-8 italic">Your Weekly Workout Plan</h1>
      
      <div className="grid gap-8">
        {Object.entries(localWorkouts).map(([day, workout]) => (
          <div 
            key={day} 
            className="bg-card rounded-xl border-[6px] border-black shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] hover:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),4px_4px_0px_0px_rgba(255,0,0,1),8px_8px_0px_0px_#C4A052] transition-all duration-200"
          >
            <WorkoutHeader
              title={formatDayTitle(day)}
              isSpeaking={isSpeaking && speakingDay === day}
              isExporting={isExporting}
              onSpeak={() => handleSpeak(day, workout)}
              onExport={async () => {
                try {
                  setIsExporting(true);
                  await exportToCalendar(day, workout.warmup, workout.workout, workout.notes || '', toast);
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
                <p className="text-white">{workout.description}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-destructive mb-2">Warm-up</h3>
                <p className="text-white whitespace-pre-line">{workout.warmup}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-destructive mb-2">Workout</h3>
                <p className="text-white whitespace-pre-line">{workout.workout}</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-destructive mb-2">Strength Focus</h3>
                <p className="text-white">{workout.strength}</p>
              </div>
              
              {workout.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-destructive mb-2">Coaching Notes</h3>
                  <p className="text-white">{workout.notes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};
