import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchInput } from "./SearchInput";
import { SearchResults } from "./SearchResults";
import type { Exercise } from "./types";

interface SearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedExercises: Exercise[];
  onExerciseSelect: (exercise: Exercise) => void;
}

export function SearchDialog({
  isOpen,
  onOpenChange,
  selectedExercises,
  onExerciseSelect,
}: SearchDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Search Exercises</DialogTitle>
          <DialogDescription>
            Search for exercises to add to your workout program.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <SearchInput />
          <SearchResults
            selectedExercises={selectedExercises}
            onExerciseSelect={onExerciseSelect}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}