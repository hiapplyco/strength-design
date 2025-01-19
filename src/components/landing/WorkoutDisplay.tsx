import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { WorkoutHeader } from "@/components/workout/WorkoutHeader";
import { exportToCalendar } from "@/utils/calendar";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface WorkoutDay {
  description: string;
  warmup: string;
  wod: string;
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
  handleSpeakWorkout: (day: string, workouts: WeeklyWorkouts, warmup: string, wod: string, notes: string) => void;
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

  const handleUpdate = (day: string, updates: { warmup: string; wod: string; notes: string; strength: string; description?: string; }) => {
    setLocalWorkouts(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        ...updates,
        description: updates.description || prev[day].description
      }
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <Button 
        variant="ghost" 
        className="mb-8 flex items-center gap-2"
        onClick={resetWorkouts}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Button>
      
      <h1 className="text-4xl font-oswald text-primary mb-8 italic">Your Weekly Workout Plan</h1>
      
      <div className="grid gap-8">
        {Object.entries(localWorkouts).map(([day, workout]) => (
          <div key={day} className="bg-card rounded-xl">
            <WorkoutHeader
              title={day}
              isSpeaking={isSpeaking}
              isExporting={isExporting}
              onSpeak={() => handleSpeakWorkout(day, workouts, workout.warmup, workout.wod, workout.notes || '')}
              onExport={async () => {
                try {
                  setIsExporting(true);
                  await exportToCalendar(day, workout.warmup, workout.wod, workout.notes || '', toast);
                } finally {
                  setIsExporting(false);
                }
              }}
              warmup={workout.warmup}
              wod={workout.wod}
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
                <h3 className="text-lg font-semibold text-destructive mb-2">Workout of the Day</h3>
                <p className="text-white whitespace-pre-line">{workout.wod}</p>
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