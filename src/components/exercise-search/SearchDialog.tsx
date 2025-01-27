import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchInput } from "./SearchInput";
import { SearchResults } from "./SearchResults";
import type { Exercise } from "./types";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  searchResults: Exercise[];
  selectedExercises: Exercise[];
  onExerciseSelect: (exercise: Exercise) => void;
  sanitizeText: (text: string) => string;
}

export function SearchDialog({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  onClearSearch,
  searchResults,
  selectedExercises,
  onExerciseSelect,
  sanitizeText,
}: SearchDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Search Exercises</DialogTitle>
          <DialogDescription>
            Search for exercises to add to your workout program.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <SearchInput 
            value={searchQuery}
            onChange={onSearchChange}
            onClear={onClearSearch}
          />
          <SearchResults
            results={searchResults}
            selectedExercises={selectedExercises}
            onExerciseSelect={onExerciseSelect}
            sanitizeText={sanitizeText}
          />
          <div className="flex justify-end pt-4">
            <Button 
              onClick={onClose}
              className="bg-primary hover:bg-primary/90"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}