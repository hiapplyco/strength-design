
import { useState } from "react";
import { X, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import { ExerciseSearch } from "../ExerciseSearch";
import type { Exercise } from "../exercise-search/types";
import { ExpandableSectionContainer } from "./ExpandableSectionContainer";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

interface ExerciseSectionProps {
  selectedExercises: Exercise[];
  onExerciseSelect: (exercise: Exercise) => void;
  renderTooltip: () => React.ReactNode;
}

export function ExerciseSection({ selectedExercises, onExerciseSelect, renderTooltip }: ExerciseSectionProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Combined content for displaying selected exercises
  const selectedExercisesContent = selectedExercises.length > 0 
    ? selectedExercises.map(ex => ex.name).join(", ")
    : "";

  // No-op function since we don't upload files for exercises
  const handleFileSelect = async () => {
    return;
  };

  // Custom content renderer for the exercise section
  const renderCustomContent = () => (
    <>
      <ExerciseSearch 
        onExerciseSelect={onExerciseSelect} 
        selectedExercises={selectedExercises}
      />

      {selectedExercises.length > 0 && (
        <div className="bg-primary/10 rounded-[20px] p-4 text-sm animate-fade-in mt-4">
          <p className="font-semibold text-primary mb-2">Selected Exercises and Equipment:</p>
          <div className="flex flex-wrap gap-2">
            {selectedExercises.map((exercise) => (
              <span 
                key={exercise.id} 
                className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-primary text-sm group"
              >
                {exercise.name}
                <button
                  onClick={() => onExerciseSelect(exercise)}
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
    </>
  );

  return (
    <ExpandableSectionContainer
      icon={<Dumbbell className="h-5 w-5 text-primary" />}
      title="Search Exercises & Equipment"
      tooltipContent="Search and select specific exercises or equipment you want to include in your workout"
      textAreaPlaceholder=""
      fileUploadTitle="Upload Exercise List"
      fileAnalysisSteps={["Analyzing exercises", "Processing data"]}
      content={selectedExercisesContent}
      setContent={() => {}} // No-op since we handle selection differently
      isAnalyzing={isAnalyzing}
      handleFileSelect={handleFileSelect}
      initialExpanded={false}
      renderCustomContent={renderCustomContent}
    />
  );
}
