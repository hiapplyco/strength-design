import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Dumbbell } from "lucide-react";
import type { Exercise } from "./exercise-search/types";

interface ExerciseSearchProps {
  onExerciseSelect?: (exercise: Exercise) => void;
  className?: string;
  embedded?: boolean;
}

export const ExerciseSearch = ({ onExerciseSelect, className, embedded = false }: ExerciseSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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

  const handleSearch = () => {
    setIsSearching(true);
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
    } finally {
      setIsSearching(false);
    }
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
      className={cn(
        "space-y-4",
        className
      )}
    >
      <div className="flex gap-2">
        <Input
          placeholder="Search for equipment (e.g., barbell, dumbbells, kettlebells)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 bg-white text-black placeholder:text-gray-500"
        />
        <Button 
          onClick={handleSearch}
          disabled={isSearching}
          className="min-w-[100px]"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.map((exercise, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start text-left"
              onClick={() => onExerciseSelect?.(exercise)}
            >
              <Dumbbell className="mr-2 h-4 w-4" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">{exercise.name}</span>
                <span className="text-sm text-muted-foreground">
                  {exercise.instructions[0]}
                </span>
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};