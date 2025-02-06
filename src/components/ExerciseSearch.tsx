import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dumbbell } from "lucide-react";
import type { Exercise } from "./exercise-search/types";
import { useExerciseSearch } from "./exercise-search/useExerciseSearch";
import { SearchDialog } from "./exercise-search/SearchDialog";
import { Button } from "./ui/button";
import { Search } from "lucide-react";

interface ExerciseSearchProps {
  onExerciseSelect?: (exercise: Exercise) => void;
  selectedExercises?: Exercise[];
}

export function ExerciseSearch({ onExerciseSelect, selectedExercises = [] }: ExerciseSearchProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { searchQuery, setSearchQuery, searchResults, setSearchResults } = useExerciseSearch();

  const handleExerciseSelect = (exercise: Exercise) => {
    if (onExerciseSelect) {
      onExerciseSelect(exercise);
    }
    setIsSearchOpen(false);
  };

  const sanitizeText = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <Dumbbell className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Exercise Selection</h3>
      </div>
      
      <Button 
        variant="outline" 
        className="w-full flex items-center justify-between h-[48px] bg-black/50 text-white border-2 border-primary/20 rounded-[20px] px-4 py-2"
        onClick={() => setIsSearchOpen(true)}
      >
        <span className="text-muted-foreground">Search exercises & equipment...</span>
        <Search className="h-4 w-4 text-muted-foreground" />
      </Button>

      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery("")}
        searchResults={searchResults}
        selectedExercises={selectedExercises}
        onExerciseSelect={handleExerciseSelect}
        sanitizeText={sanitizeText}
      />
    </div>
  );
}