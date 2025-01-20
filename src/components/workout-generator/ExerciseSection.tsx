import { Dumbbell } from "lucide-react";
import { ExerciseSearch } from "../ExerciseSearch";
import type { Exercise } from "../exercise-search/types";

interface ExerciseSectionProps {
  selectedExercises: Exercise[];
  onExerciseSelect: (exercise: Exercise) => void;
  renderTooltip: () => React.ReactNode;
}

export function ExerciseSection({ selectedExercises, onExerciseSelect, renderTooltip }: ExerciseSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Dumbbell className="h-5 w-5" />
        <h3 className="font-oswald text-lg uppercase">Equipment Selection</h3>
        {renderTooltip()}
      </div>
      <ExerciseSearch onExerciseSelect={onExerciseSelect} />

      {selectedExercises.length > 0 && (
        <div className="bg-primary/10 rounded-lg p-4 text-sm animate-fade-in">
          <p className="font-semibold text-primary mb-2">Selected Equipment:</p>
          <div className="flex flex-wrap gap-2">
            {selectedExercises.map((exercise, index) => (
              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-primary text-sm">
                {exercise.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}