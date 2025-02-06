import { useState } from "react";
import { X, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import { ExerciseSearch } from "../ExerciseSearch";
import type { Exercise } from "../exercise-search/types";
import { TooltipWrapper } from "./TooltipWrapper";
import { Button } from "../ui/button";

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
      <div className="flex items-center gap-2">
        <Dumbbell className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Search Exercises & Equipment</h3>
        {renderTooltip()}
      </div>

      <Button
        variant="outline"
        className="w-full flex items-center justify-between"
        onClick={() => setShowSearch(!showSearch)}
      >
        <span>Would you like to add specific exercises or equipment?</span>
        {showSearch ? (
          <ChevronUp className="h-4 w-4 ml-2" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-2" />
        )}
      </Button>

      {showSearch && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <ExerciseSearch 
            onExerciseSelect={onExerciseSelect} 
            selectedExercises={selectedExercises}
          />

          {selectedExercises.length > 0 && (
            <div className="bg-primary/10 rounded-lg p-4 text-sm animate-fade-in mt-4">
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
      )}
    </div>
  );
}