import { Exercise } from "./types";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

interface SearchResultsProps {
  isLoading: boolean;
  exercises: Exercise[];
  sanitizeText: (text: string) => string;
  onExerciseSelect?: (exercise: Exercise) => void;
}

export const SearchResults = ({ isLoading, exercises, sanitizeText, onExerciseSelect }: SearchResultsProps) => {
  if (isLoading) {
    return <p className="text-center text-primary-foreground">Loading exercises...</p>;
  }

  if (exercises.length === 0) {
    return <p className="text-center text-destructive font-bold">No exercises found</p>;
  }

  return (
    <div className="space-y-4">
      {exercises.map((exercise, index) => (
        <div key={index} className="bg-white rounded p-4 border border-black">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-black">{sanitizeText(exercise.name)}</h3>
              <p className="text-sm text-gray-600 mb-2">Level: {sanitizeText(exercise.level)}</p>
            </div>
            {onExerciseSelect && (
              <Button
                variant="ghost"
                onClick={() => onExerciseSelect(exercise)}
                className="shrink-0 hover:bg-primary/20 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add to workout
              </Button>
            )}
          </div>
          <div className="text-sm">
            <p className="font-medium mb-1 text-black">Instructions:</p>
            <ul className="list-disc pl-4 space-y-1 text-black">
              {exercise.instructions.map((instruction, idx) => (
                <li key={idx}>{sanitizeText(instruction)}</li>
              ))}
            </ul>
          </div>
          {exercise.images?.[0] && (
            <img
              src={`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${exercise.images[0]}`}
              alt={exercise.name}
              className="mt-2 rounded w-full h-auto"
              loading="lazy"
            />
          )}
        </div>
      ))}
    </div>
  );
};