import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { SearchInput } from "./exercise-search/SearchInput";
import { SearchResults } from "./exercise-search/SearchResults";
import type { Exercise } from "./exercise-search/types";

interface ExerciseSearchProps {
  onExerciseSelect?: (exercise: Exercise) => void;
  className?: string;
  embedded?: boolean;
}

export const ExerciseSearch = ({ 
  onExerciseSelect, 
  className, 
  embedded = false 
}: ExerciseSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');
        if (!response.ok) {
          throw new Error('Failed to fetch exercises');
        }
        const data = await response.json();
        setExercises(data);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      }
    };
    fetchExercises();
  }, []);

  useEffect(() => {
    const performSearch = () => {
      try {
        if (searchQuery.trim()) {
          const term = searchQuery.toLowerCase();
          const results = exercises.filter(exercise => {
            const nameMatch = exercise.name.toLowerCase().includes(term);
            const instructionsMatch = exercise.instructions.some(
              instruction => instruction.toLowerCase().includes(term)
            );
            return nameMatch || instructionsMatch;
          });
          setSearchResults(results);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching exercises:', error);
      }
    };

    const debounceTimeout = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, exercises]);

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercises(prev => [...prev, exercise.name]);
    onExerciseSelect?.(exercise);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const sanitizeText = (text: string): string => {
    return text
      .replace(/WOD/g, 'Workout')
      .replace(/[^\w\s.,!?;:()\-–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  return (
    <div 
      ref={searchRef}
      className={cn("space-y-4", className)}
    >
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={handleClearSearch}
      />
      <SearchResults
        results={searchResults}
        selectedExercises={selectedExercises}
        onExerciseSelect={handleExerciseSelect}
        sanitizeText={sanitizeText}
      />
    </div>
  );
};