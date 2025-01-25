import { useState } from "react";
import { Dumbbell, X } from "lucide-react";
import { ExerciseSearch } from "../ExerciseSearch";
import type { Exercise } from "../exercise-search/types";
import { Button } from "../ui/button";

interface ExerciseSectionProps {
  selectedExercises: Exercise[];
  onExerciseSelect: (exercise: Exercise) => void;
  renderTooltip: () => React.ReactNode;
}

export function ExerciseSection({ selectedExercises, onExerciseSelect, renderTooltip }: ExerciseSectionProps) {
  const [showSearch, setShowSearch] = useState(false);

  const handleRemoveExercise = (exerciseToRemove: Exercise) => {
    // We'll update the selected exercises list by filtering out the removed exercise
    const updatedExercises = selectedExercises.filter(
      exercise => exercise.name !== exerciseToRemove.name
    );
    // Call onExerciseSelect with the filtered list
    onExerciseSelect(exerciseToRemove);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Search Exercises & Equipment</h3>
        {renderTooltip()}
      </div>
      
      <ExerciseSearch onExerciseSelect={onExerciseSelect} />

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