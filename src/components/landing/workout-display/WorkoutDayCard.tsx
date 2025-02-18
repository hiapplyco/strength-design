
import { WorkoutHeader } from "@/components/workout/WorkoutHeader";
import { useToast } from "@/hooks/use-toast";
import { exportToCalendar } from "@/utils/calendar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Image } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClickableExercise } from "@/components/workout/ClickableExercise";
import { extractExerciseNames } from "@/utils/exercise-formatting";
import type { WorkoutDay } from "@/types/fitness";
import { useRef } from "react";

interface WorkoutDayCardProps {
  day: string;
  index: number;
  workout: WorkoutDay;
  isExporting: boolean;
  setIsExporting: (value: boolean) => void;
  allWorkouts: Record<string, WorkoutDay>;
  onUpdate: (day: string, updates: Partial<WorkoutDay>) => void;
}

export const WorkoutDayCard = ({
  day,
  index,
  workout,
  isExporting,
  setIsExporting,
  allWorkouts,
  onUpdate
}: WorkoutDayCardProps) => {
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleExerciseSelect = (exerciseName: string) => {
    if (searchInputRef.current) {
      searchInputRef.current.value = exerciseName;
      // Trigger a search event
      const event = new Event('input', { bubbles: true });
      searchInputRef.current.dispatchEvent(event);
    }
  };

  const renderTextWithClickableExercises = (text: string) => {
    if (!text) return null;

    const exercises = extractExerciseNames(text);
    let result = text;

    exercises.forEach(exercise => {
      const regex = new RegExp(`\\b${exercise}\\b`, 'g');
      result = result.replace(
        regex,
        `<span class="exercise-placeholder">${exercise}</span>`
      );
    });

    const parts = result.split(/<span class="exercise-placeholder">|<\/span>/);
    
    return (
      <p className="text-muted-foreground text-sm sm:text-base whitespace-pre-line">
        {parts.map((part, i) => {
          if (exercises.includes(part)) {
            return (
              <ClickableExercise
                key={i}
                name={part}
                onSelect={handleExerciseSelect}
              />
            );
          }
          return part;
        })}
      </p>
    );
  };

  return (
    <div className="w-full bg-card rounded-xl border-[6px] border-black shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] hover:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),4px_4px_0px_0px_rgba(255,0,0,1),8px_8px_0px_0px_#C4A052] transition-all duration-200 mx-auto max-w-[95%] sm:max-w-full">
      <WorkoutHeader
        title={`Day ${index + 1}`}
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
            }], toast);
          } finally {
            setIsExporting(false);
          }
        }}
        warmup={workout.warmup}
        workout={workout.workout}
        notes={workout.notes}
        strength={workout.strength}
        allWorkouts={allWorkouts}
        onUpdate={(updates) => onUpdate(day, updates)}
        searchInputRef={searchInputRef}
      />
      
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-destructive mb-2">Description</h3>
          {renderTextWithClickableExercises(workout.description)}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-destructive mb-2">Warm-up</h3>
          {renderTextWithClickableExercises(workout.warmup)}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-destructive mb-2">Workout</h3>
          {renderTextWithClickableExercises(workout.workout)}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-destructive mb-2">Strength Focus</h3>
          {renderTextWithClickableExercises(workout.strength)}
        </div>
        
        {workout.notes && (
          <div>
            <h3 className="text-lg font-semibold text-destructive mb-2">Coaching Notes</h3>
            {renderTextWithClickableExercises(workout.notes)}
          </div>
        )}

        {workout.images && workout.images.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-destructive mb-2">Exercise Images</h3>
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {workout.images.map((image, i) => (
                  <div key={i} className="relative">
                    <AspectRatio ratio={1}>
                      {image ? (
                        <img
                          src={image}
                          alt={`Exercise ${i + 1}`}
                          className="rounded-md object-cover w-full h-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-muted rounded-md">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </AspectRatio>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
};
