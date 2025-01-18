import { Exercise } from "./types";

interface SearchResultsProps {
  isLoading: boolean;
  exercises: Exercise[];
  sanitizeText: (text: string) => string;
}

export const SearchResults = ({ isLoading, exercises, sanitizeText }: SearchResultsProps) => {
  if (isLoading) {
    return <p className="text-center text-primary-foreground">Loading...</p>;
  }

  if (exercises.length === 0) {
    return <p className="text-center text-destructive font-bold">No exercises found</p>;
  }

  return (
    <div className="space-y-4">
      {exercises.map((exercise, index) => (
        <div key={index} className="bg-white rounded p-4 border border-black">
          <h3 className="font-bold text-lg text-black">{sanitizeText(exercise.name)}</h3>
          <p className="text-sm text-gray-600 mb-2">Level: {sanitizeText(exercise.level)}</p>
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