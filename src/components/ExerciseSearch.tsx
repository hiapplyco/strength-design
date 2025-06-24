
import React, { useState } from "react";
import { Dumbbell } from "lucide-react";
import type { Exercise } from "./exercise-search/types";
import { EnhancedSearchDialog } from "./exercise-search/EnhancedSearchDialog";
import { Button } from "./ui/button";
import { Search } from "lucide-react";

interface ExerciseSearchProps {
  onExerciseSelect?: (exercise: Exercise) => void;
  selectedExercises?: Exercise[];
}

export function ExerciseSearch({ onExerciseSelect, selectedExercises = [] }: ExerciseSearchProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleExercisesSelect = (exercises: Exercise[]) => {
    console.log('Exercises selected from search:', exercises);
    if (onExerciseSelect) {
      // Add each exercise individually
      exercises.forEach(exercise => {
        console.log('Adding exercise:', exercise.name);
        onExerciseSelect(exercise);
      });
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <Dumbbell className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Exercise Selection</h3>
      </div>
      
      <Button 
        variant="outline" 
        className="w-full flex items-center justify-between h-[48px] bg-background hover:bg-muted text-foreground border-2 border-border hover:border-primary/50 rounded-lg px-4 py-2 transition-all duration-200"
        onClick={() => setIsSearchOpen(true)}
      >
        <span className="text-muted-foreground">Search exercises & equipment...</span>
        <Search className="h-4 w-4 text-muted-foreground" />
      </Button>

      <EnhancedSearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onExercisesSelect={handleExercisesSelect}
        selectedExercises={selectedExercises}
      />
    </div>
  );
}
