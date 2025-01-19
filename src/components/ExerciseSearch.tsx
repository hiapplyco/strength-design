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

export const ExerciseSearch = ({ onExerciseSelect, className, embedded = false }: ExerciseSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');
        if (!response.ok) {
          throw new Error('Failed to fetch exercises');
        }
        const data = await response.json();
        setExercises(data);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExercises();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const results = exercises.filter(exercise => {
        const nameMatch = exercise.name.toLowerCase().includes(term);
        const instructionsMatch = exercise.instructions.some(
          instruction => instruction.toLowerCase().includes(term)
        );
        return nameMatch || instructionsMatch;
      });
      setFilteredExercises(results);
    } else {
      setFilteredExercises([]);
    }
  }, [searchTerm, exercises]);

  const handleClickOutside = (event: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      setSearchTerm("");
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      className={cn(
        "w-full",
        className
      )}
    >
      <SearchInput value={searchTerm} onChange={setSearchTerm} />

      {searchTerm && (
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          <SearchResults 
            isLoading={isLoading}
            exercises={filteredExercises}
            sanitizeText={sanitizeText}
            onExerciseSelect={onExerciseSelect}
          />
        </div>
      )}
    </div>
  );
};