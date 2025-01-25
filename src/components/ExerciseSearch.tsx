import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { SearchDialog } from "./exercise-search/SearchDialog";
import { useExerciseSearch } from "./exercise-search/useExerciseSearch";
import type { Exercise } from "./exercise-search/types";

interface ExerciseSearchProps {
  onExerciseSelect?: (exercise: Exercise) => void;
  className?: string;
  embedded?: boolean;
  selectedExercises?: Exercise[];
}

export const ExerciseSearch = ({ 
  onExerciseSelect, 
  className, 
  embedded = false,
  selectedExercises: externalSelectedExercises = [] 
}: ExerciseSearchProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExerciseNames, setSelectedExerciseNames] = useState<string[]>(
    externalSelectedExercises.map(ex => ex.name)
  );
  
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults
  } = useExerciseSearch();

  // Update internal selection state when external selection changes
  useEffect(() => {
    setSelectedExerciseNames(externalSelectedExercises.map(ex => ex.name));
  }, [externalSelectedExercises]);

  const handleExerciseSelect = (exercise: Exercise) => {
    if (selectedExerciseNames.includes(exercise.name)) {
      setSelectedExerciseNames(prev => prev.filter(name => name !== exercise.name));
    } else {
      setSelectedExerciseNames(prev => [...prev, exercise.name]);
    }
    onExerciseSelect?.(exercise);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    handleClearSearch();
  };

  const sanitizeText = (text: string): string => {
    return text
      .replace(/WOD/g, 'Workout')
      .replace(/[^\w\s.,!?;:()\-–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Input
        onClick={() => setDialogOpen(true)}
        readOnly
        placeholder="Enter exercises or equipment..."
        className="cursor-pointer bg-white text-black rounded-full border-2 border-primary focus-visible:ring-primary"
      />

      <SearchDialog
        isOpen={dialogOpen}
        onClose={handleDialogClose}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={handleClearSearch}
        searchResults={searchResults}
        selectedExercises={selectedExerciseNames}
        onExerciseSelect={handleExerciseSelect}
        sanitizeText={sanitizeText}
      />
    </div>
  );
};