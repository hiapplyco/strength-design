
import { ClickableExercise } from "@/components/workout/ClickableExercise";
import { extractExerciseNames } from "@/utils/exercise-formatting";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Image, Flame, Dumbbell, Target, ClipboardList, Zap } from "lucide-react";
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
    <div className="space-y-6">
      <SectionWithTitle 
        title="Description" 
        content={workout.description}
        onExerciseSelect={onExerciseSelect}
        icon={Target}
        variant="primary"
      />
      
      <SectionWithTitle 
        title="Warm-up" 
        content={workout.warmup}
        onExerciseSelect={onExerciseSelect}
        icon={Flame}
        variant="warmup"
      />
      
      <SectionWithTitle 
        title="Workout" 
        content={workout.workout}
        onExerciseSelect={onExerciseSelect}
        icon={Dumbbell}
        variant="workout"
      />
      
      <SectionWithTitle 
        title="Strength Focus" 
        content={workout.strength}
        onExerciseSelect={onExerciseSelect}
        icon={Zap}
        variant="strength"
      />
      
      {workout.notes && (
        <SectionWithTitle 
          title="Coaching Notes" 
          content={workout.notes}
          onExerciseSelect={onExerciseSelect}
          icon={ClipboardList}
          variant="notes"
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
    </div>
  );
};

interface SectionWithTitleProps {
  title: string;
  content?: string;
  onExerciseSelect: (exerciseName: string) => void;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'warmup' | 'workout' | 'strength' | 'notes';
}

const SectionWithTitle = ({ title, content, onExerciseSelect, icon: Icon, variant }: SectionWithTitleProps) => {
  if (!content) return null;

  const variantStyles = {
    primary: {
      header: "bg-primary/5 border-l-4 border-primary/60",
      icon: "text-primary",
      title: "text-primary"
    },
    warmup: {
      header: "bg-orange-500/5 border-l-4 border-orange-500/60",
      icon: "text-orange-500",
      title: "text-orange-600"
    },
    workout: {
      header: "bg-blue-500/5 border-l-4 border-blue-500/60",
      icon: "text-blue-500",
      title: "text-blue-600"
    },
    strength: {
      header: "bg-purple-500/5 border-l-4 border-purple-500/60",
      icon: "text-purple-500",
      title: "text-purple-600"
    },
    notes: {
      header: "bg-green-500/5 border-l-4 border-green-500/60",
      icon: "text-green-500",
      title: "text-green-600"
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className="space-y-3">
      {/* Clean Header */}
      <div className={`${styles.header} rounded-lg p-4`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-background/80">
            <Icon className={`h-5 w-5 ${styles.icon}`} />
          </div>
          <h3 className={`text-xl font-bold ${styles.title} tracking-tight`}>
            {title}
          </h3>
        </div>
      </div>

      {/* Clean Content */}
      <div className="bg-card/50 rounded-lg p-6 border border-border/10">
        {renderTextWithClickableExercises(content, onExerciseSelect)}
      </div>
    </div>
  );
};

interface ExerciseListSectionProps {
  exercises: Array<{ name: string; sets?: string; reps?: string }>;
  onExerciseSelect: (exerciseName: string) => void;
}

const ExerciseListSection = ({ exercises, onExerciseSelect }: ExerciseListSectionProps) => {
  return (
    <div className="space-y-3">
      {/* Clean Header */}
      <div className="bg-indigo-500/5 border-l-4 border-indigo-500/60 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-background/80">
            <Dumbbell className="h-5 w-5 text-indigo-500" />
          </div>
          <h3 className="text-xl font-bold text-indigo-600 tracking-tight">
            Exercise List
          </h3>
        </div>
      </div>

      {/* Clean Exercise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {exercises.map((exercise, i) => (
          <div
            key={i}
            className="group bg-card border border-border/20 rounded-lg p-4 hover:border-primary/40 transition-all duration-200 cursor-pointer"
            onClick={() => onExerciseSelect(exercise.name)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-foreground text-base mb-1 group-hover:text-primary transition-colors">
                  {exercise.name}
                </h4>
                {exercise.sets && exercise.reps && (
                  <div className="inline-flex items-center gap-2 bg-muted/40 rounded-full px-3 py-1">
                    <span className="text-sm font-medium text-muted-foreground">
                      {exercise.sets} × {exercise.reps}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Dumbbell className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
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
    <div className="space-y-3">
      {/* Clean Header */}
      <div className="bg-pink-500/5 border-l-4 border-pink-500/60 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-background/80">
            <Image className="h-5 w-5 text-pink-500" />
          </div>
          <h3 className="text-xl font-bold text-pink-600 tracking-tight">
            Exercise Images
          </h3>
        </div>
      </div>

      {/* Clean Image Grid */}
      <div className="bg-card/50 rounded-lg border border-border/10 p-4">
        <ScrollArea className="h-[350px] rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((image, i) => (
              <div key={i} className="relative group">
                <AspectRatio ratio={1}>
                  {image ? (
                    <img
                      src={image}
                      alt={`Exercise ${i + 1}`}
                      className="rounded-lg object-cover w-full h-full border border-border/20 group-hover:border-primary/40 transition-all duration-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-muted/30 rounded-lg border border-border/20 group-hover:border-primary/40 transition-colors">
                      <Image className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  )}
                </AspectRatio>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

// Enhanced helper function to render text with clickable exercises
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
    <div className="prose prose-slate max-w-none">
      <p className="text-foreground/90 text-base leading-relaxed whitespace-pre-line font-medium">
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
    </div>
  );
};
