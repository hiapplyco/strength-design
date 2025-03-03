
import { WorkoutDay } from "@/types/fitness";
import { safelyGetWorkoutProperty } from "@/utils/workout-helpers";

interface WorkoutPreviewProps {
  day: string;
  workout: WorkoutDay;
}

export const WorkoutPreview = ({ day, workout }: WorkoutPreviewProps) => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-primary mb-1">
        {day} Preview
      </h3>
      {safelyGetWorkoutProperty(workout, 'description') && (
        <p className="text-white/80 text-xs italic mb-1">
          {(safelyGetWorkoutProperty(workout, 'description') || '').substring(0, 120)}
          {(safelyGetWorkoutProperty(workout, 'description') || '').length > 120 ? '...' : ''}
        </p>
      )}
      {safelyGetWorkoutProperty(workout, 'strength') && (
        <div className="mt-1">
          <span className="text-white/90 text-xs font-semibold">Strength:</span>
          <p className="text-white/70 text-xs pl-2">
            {(safelyGetWorkoutProperty(workout, 'strength') || '').substring(0, 100)}
            {(safelyGetWorkoutProperty(workout, 'strength') || '').length > 100 ? '...' : ''}
          </p>
        </div>
      )}
    </div>
  );
};
