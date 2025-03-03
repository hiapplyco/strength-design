
import { ClickableExercise } from "@/components/workout/ClickableExercise";
import { extractExerciseNames } from "@/utils/exercise-formatting";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Image } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { WorkoutDay } from "@/types/fitness";

interface WorkoutContentSectionProps {
  workout: WorkoutDay;
  onExerciseSelect: (exerciseName: string) => void;
}

export const WorkoutContentSection = ({ 
  workout, 
  onExerciseSelect 
}: WorkoutContentSectionProps) => {
  return (
    <>
      <SectionWithTitle 
        title="Description" 
        content={workout.description}
        onExerciseSelect={onExerciseSelect}
      />
      
      <SectionWithTitle 
        title="Warm-up" 
        content={workout.warmup}
        onExerciseSelect={onExerciseSelect}
      />
      
      <SectionWithTitle 
        title="Workout" 
        content={workout.workout}
        onExerciseSelect={onExerciseSelect}
      />
      
      <SectionWithTitle 
        title="Strength Focus" 
        content={workout.strength}
        onExerciseSelect={onExerciseSelect}
      />
      
      {workout.notes && (
        <SectionWithTitle 
          title="Coaching Notes" 
          content={workout.notes}
          onExerciseSelect={onExerciseSelect}
        />
      )}

      {workout.exercises && workout.exercises.length > 0 && (
        <ExerciseListSection 
          exercises={workout.exercises} 
          onExerciseSelect={onExerciseSelect} 
        />
      )}

      {workout.images && workout.images.length > 0 && (
        <ExerciseImagesSection images={workout.images} />
      )}
    </>
  );
};

interface SectionWithTitleProps {
  title: string;
  content?: string; // Make content optional to handle undefined values
  onExerciseSelect: (exerciseName: string) => void;
}

const SectionWithTitle = ({ title, content, onExerciseSelect }: SectionWithTitleProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-destructive mb-2">{title}</h3>
      {renderTextWithClickableExercises(content, onExerciseSelect)}
    </div>
  );
};

interface ExerciseListSectionProps {
  exercises: Array<{ name: string; sets?: string; reps?: string }>;
  onExerciseSelect: (exerciseName: string) => void;
}

const ExerciseListSection = ({ exercises, onExerciseSelect }: ExerciseListSectionProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-destructive mb-2">Exercise List</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {exercises.map((exercise, i) => (
          <Button
            key={i}
            variant="outline"
            onClick={() => onExerciseSelect(exercise.name)}
            className="text-left flex justify-between items-center p-4"
          >
            <span className="font-medium">{exercise.name}</span>
            {exercise.sets && exercise.reps && (
              <span className="text-sm text-muted-foreground">
                {exercise.sets}x{exercise.reps}
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};

interface ExerciseImagesSectionProps {
  images: string[];
}

const ExerciseImagesSection = ({ images }: ExerciseImagesSectionProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-destructive mb-2">Exercise Images</h3>
      <ScrollArea className="h-[300px] rounded-md border p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((image, i) => (
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
  );
};

// Helper function to render text with clickable exercises
export const renderTextWithClickableExercises = (text: string | undefined, onExerciseSelect: (name: string) => void) => {
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
              onSelect={onExerciseSelect}
            />
          );
        }
        return part;
      })}
    </p>
  );
};
