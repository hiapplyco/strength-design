
import { WorkoutDay } from "@/types/fitness";
import { safelyGetWorkoutProperty } from "@/utils/workout-helpers";

interface WorkoutPreviewProps {
  day: string;
  workout: WorkoutDay;
}

interface SectionPreviewProps {
  title: string;
  content: string | null | undefined;
}

const SectionPreview = ({ title, content }: SectionPreviewProps) => {
  if (!content) return null;
  
  const truncatedContent = content.length > 80 ? content.substring(0, 80) + '...' : content;
  
  return (
    <div className="mt-2">
      <h4 className="text-white/90 text-xs font-semibold">{title}</h4>
      <p className="text-white/70 text-xs pl-2 whitespace-pre-line font-light">
        {truncatedContent}
      </p>
    </div>
  )
};

export const WorkoutPreview = ({ day, workout }: WorkoutPreviewProps) => {
  const description = safelyGetWorkoutProperty(workout, 'description');
  const warmup = safelyGetWorkoutProperty(workout, 'warmup');
  const strength = safelyGetWorkoutProperty(workout, 'strength');
  const workoutContent = safelyGetWorkoutProperty(workout, 'workout');

  return (
    <div>
      <h3 className="text-sm font-semibold text-primary mb-1">
        {day} Preview
      </h3>
      {description && (
        <p className="text-white/80 text-xs italic mb-2">
          {description.substring(0, 120)}
          {description.length > 120 ? '...' : ''}
        </p>
      )}
      <SectionPreview title="Warmup" content={warmup} />
      <SectionPreview title="Strength" content={strength} />
      <SectionPreview title="Workout" content={workoutContent} />
    </div>
  );
};
