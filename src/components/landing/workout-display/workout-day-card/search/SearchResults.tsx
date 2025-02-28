
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchResultsProps {
  searchResults: any[];
  onExerciseSelect: (exerciseName: string) => void;
}

export const SearchResults = ({ searchResults, onExerciseSelect }: SearchResultsProps) => {
  return (
    <ScrollArea className="h-[400px] w-full rounded-sm border bg-black/5 backdrop-blur-sm p-4">
      <div className="grid grid-cols-1 gap-4">
        {searchResults.map((exercise, i) => (
          <SearchResultCard 
            key={i} 
            exercise={exercise} 
            onSelect={() => onExerciseSelect(exercise.name)}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

interface SearchResultCardProps {
  exercise: any;
  onSelect: () => void;
}

const SearchResultCard = ({ exercise, onSelect }: SearchResultCardProps) => {
  return (
    <div 
      className="group relative overflow-hidden rounded-sm border border-red-500/20 bg-black/40 p-4 transition-all hover:border-red-500/40 hover:bg-black/60"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-4 flex-1">
          <div>
            <h4 className="font-medium text-lg text-white group-hover:text-red-400 transition-colors">
              {exercise.name}
            </h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {exercise.type && (
                <span className="inline-flex items-center rounded-sm bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                  {exercise.type}
                </span>
              )}
              {exercise.muscle && (
                <span className="inline-flex items-center rounded-sm bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                  {exercise.muscle}
                </span>
              )}
              {exercise.difficulty && (
                <span className="inline-flex items-center rounded-sm bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                  {exercise.difficulty}
                </span>
              )}
              {exercise.equipment && (
                <span className="inline-flex items-center rounded-sm bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                  {exercise.equipment}
                </span>
              )}
            </div>
          </div>

          {/* Muscles Section */}
          {(exercise.primaryMuscles?.length > 0 || exercise.secondaryMuscles?.length > 0) && (
            <div className="space-y-2">
              {exercise.primaryMuscles?.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-red-400">Primary Muscles:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {exercise.primaryMuscles.map((muscle: string, idx: number) => (
                      <span key={idx} className="text-xs text-gray-400">
                        {muscle}
                        {idx < exercise.primaryMuscles.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {exercise.secondaryMuscles?.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-red-400">Secondary Muscles:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {exercise.secondaryMuscles.map((muscle: string, idx: number) => (
                      <span key={idx} className="text-xs text-gray-400">
                        {muscle}
                        {idx < exercise.secondaryMuscles.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          {exercise.instructions && (
            <div className="mt-2 space-y-1">
              <span className="text-xs font-medium text-red-400">Instructions:</span>
              {exercise.instructions.map((instruction: string, idx: number) => (
                <p key={idx} className="text-sm text-gray-400">
                  {idx + 1}. {instruction}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Images */}
        {exercise.images && exercise.images.length > 0 && (
          <div className="hidden sm:flex flex-col gap-2">
            {exercise.images.slice(0, 2).map((image: string, idx: number) => (
              <div key={idx} className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-sm border border-red-500/20">
                <img
                  src={image}
                  alt={`${exercise.name} - View ${idx + 1}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'placeholder.svg';
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
