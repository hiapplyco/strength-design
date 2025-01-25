import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { SearchInput } from "./exercise-search/SearchInput";
import { SearchResults } from "./exercise-search/SearchResults";
import { Dialog, DialogContent, DialogClose } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [selectedExerciseNames, setSelectedExerciseNames] = useState<string[]>(
    externalSelectedExercises.map(ex => ex.name)
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Update internal selection state when external selection changes
  useEffect(() => {
    setSelectedExerciseNames(externalSelectedExercises.map(ex => ex.name));
  }, [externalSelectedExercises]);

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

  const sanitizeText = (text: string): string => {
    return text
      .replace(/WOD/g, 'Workout')
      .replace(/[^\w\s.,!?;:()\-–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    handleClearSearch();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Input
        onClick={() => setDialogOpen(true)}
        readOnly
        placeholder="Enter exercises or equipment..."
        className="cursor-pointer bg-white text-black rounded-full border-2 border-primary focus-visible:ring-primary"
      />

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] p-0 gap-0 bg-background border-none">
          <div className="sticky top-0 z-10 bg-background p-4 border-b rounded-t-xl">
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onClear={handleClearSearch}
                />
              </div>
              <DialogClose asChild>
                <Button 
                  variant="default"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                >
                  Done
                </Button>
              </DialogClose>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <SearchResults
              results={searchResults}
              selectedExercises={selectedExerciseNames}
              onExerciseSelect={handleExerciseSelect}
              sanitizeText={sanitizeText}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};