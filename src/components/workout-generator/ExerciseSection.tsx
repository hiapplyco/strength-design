import { useState } from "react";
import { X } from "lucide-react";
import { ExerciseSearch } from "../ExerciseSearch";
import type { Exercise } from "../exercise-search/types";

interface ExerciseSectionProps {
  selectedExercises: Exercise[];
  onExerciseSelect: (exercise: Exercise) => void;
  renderTooltip: () => React.ReactNode;
}

export function ExerciseSection({ selectedExercises, onExerciseSelect, renderTooltip }: ExerciseSectionProps) {
  const [showSearch, setShowSearch] = useState(false);

  const handleRemoveExercise = (exerciseToRemove: Exercise) => {
    onExerciseSelect(exerciseToRemove);
  };

  return (
    <div className="space-y-4">      
      <ExerciseSearch 
        onExerciseSelect={onExerciseSelect} 
        selectedExercises={selectedExercises}
      />

      {selectedExercises.length > 0 && (
        <div className="bg-primary/10 rounded-lg p-4 text-sm animate-fade-in">
          <p className="font-semibold text-primary mb-2">Selected Exercises and Equipment:</p>
          <div className="flex flex-wrap gap-2">
            {selectedExercises.map((exercise, index) => (
              <span 
                key={index} 
                className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-primary text-sm group"
              >
                {exercise.name}
                <button
                  onClick={() => handleRemoveExercise(exercise)}
                  className="ml-2 p-0.5 rounded-full hover:bg-red-500 hover:text-white transition-colors duration-200"
                  aria-label={`Remove ${exercise.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}