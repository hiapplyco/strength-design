
import { useState } from "react";
import { X, Dumbbell } from "lucide-react";
import { ExerciseSearch } from "../ExerciseSearch";
import type { Exercise } from "../exercise-search/types";
import { ExpandableSectionContainer } from "./ExpandableSectionContainer";

interface ExerciseSectionProps {
  selectedExercises: Exercise[];
  onExerciseSelect: (exercise: Exercise, action?: 'add' | 'remove') => void;
  renderTooltip: () => React.ReactNode;
}

export function ExerciseSection({ selectedExercises, onExerciseSelect, renderTooltip }: ExerciseSectionProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Combined content for displaying selected exercises - show all selected exercises
  const selectedExercisesContent = selectedExercises.length > 0 
    ? selectedExercises.map(ex => ex.name).join(", ")
    : "";

  // No-op function since we don't upload files for exercises
  const handleFileSelect = async () => {
    return;
  };

  // Handle exercise selection from the search - always add
  const handleExerciseSelect = (exercise: Exercise) => {
    console.log('ExerciseSection: Adding exercise from search:', exercise.name);
    onExerciseSelect(exercise, 'add');
  };

  // NEW: Handle bulk exercise selection from the search
  const handleExercisesSelect = (exercises: Exercise[]) => {
    console.log('ExerciseSection: Bulk adding exercises:', exercises.length, 'exercises');
    exercises.forEach(exercise => {
      console.log('ExerciseSection: Adding exercise:', exercise.name);
      onExerciseSelect(exercise, 'add');
    });
  };

  // Handle exercise removal from the selected list
  const handleExerciseRemove = (exercise: Exercise) => {
    console.log('ExerciseSection: Removing exercise:', exercise.name);
    onExerciseSelect(exercise, 'remove');
  };

  // Custom content renderer for the exercise section
  const renderCustomContent = () => (
    <>
      <ExerciseSearch 
        onExerciseSelect={handleExerciseSelect}
        onExercisesSelect={handleExercisesSelect}
        selectedExercises={selectedExercises}
      />

      {selectedExercises.length > 0 && (
        <div className="bg-primary/10 rounded-[20px] p-4 text-sm animate-fade-in mt-4">
          <p className="font-semibold text-primary mb-2">Selected Exercises and Equipment:</p>
          <div className="flex flex-wrap gap-2">
            {selectedExercises.map((exercise) => (
              <span 
                key={`${exercise.id}-${exercise.name}`}
                className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-primary text-sm group"
              >
                {exercise.name}
                <button
                  onClick={() => handleExerciseRemove(exercise)}
                  className="ml-2 p-0.5 rounded-full hover:bg-red-500 hover:text-white transition-colors duration-200"
                  aria-label={`Remove ${exercise.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 text-xs text-primary/70">
            {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''} selected
          </div>
        </div>
      )}
    </>
  );

  return (
    <ExpandableSectionContainer
      icon={<Dumbbell className="h-5 w-5 text-primary" />}
      title="Search exercises & equipment"
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
