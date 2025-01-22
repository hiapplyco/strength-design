import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { ExerciseSearch } from "../ExerciseSearch";
import type { Exercise } from "../exercise-search/types";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface ExerciseSectionProps {
  selectedExercises: Exercise[];
  onExerciseSelect: (exercise: Exercise) => void;
  renderTooltip: () => React.ReactNode;
}

export function ExerciseSection({ selectedExercises, onExerciseSelect, renderTooltip }: ExerciseSectionProps) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Choose Equipment</h3>
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
