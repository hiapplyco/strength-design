import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Check } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercises(prev => [...prev, exercise.name]);
    onExerciseSelect?.(exercise);
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
          className="min-w-[100px] bg-primary hover:bg-primary/90"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exercise</TableHead>
                <TableHead>Instructions</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.map((exercise, index) => {
                const isSelected = selectedExercises.includes(exercise.name);
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-2">
                        <span className="text-primary font-semibold">
                          {sanitizeText(exercise.name)}
                        </span>
                        {exercise.images?.[0] && (
                          <img
                            src={`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${exercise.images[0]}`}
                            alt={exercise.name}
                            className="rounded-md w-48 h-auto object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-md">
                      {exercise.instructions[0]}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={isSelected ? "default" : "default"}
                        onClick={() => !isSelected && handleExerciseSelect(exercise)}
                        className={cn(
                          "w-full transition-all duration-200",
                          isSelected 
                            ? "bg-green-500 hover:bg-green-600" 
                            : "bg-primary hover:bg-primary/90"
                        )}
                        disabled={isSelected}
                      >
                        {isSelected ? (
                          <Check className="h-4 w-4 text-white" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};