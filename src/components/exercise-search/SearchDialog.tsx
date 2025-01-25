import { Dialog, DialogContent, DialogClose } from "../ui/dialog";
import { Button } from "../ui/button";
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
  selectedExercises: string[];
  onExerciseSelect: (exercise: Exercise) => void;
  sanitizeText: (text: string) => string;
}

export const SearchDialog = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  onClearSearch,
  searchResults,
  selectedExercises,
  onExerciseSelect,
  sanitizeText,
}: SearchDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] p-0 gap-0 bg-background border-none">
        <div className="sticky top-0 z-10 bg-background p-4 border-b rounded-t-xl">
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={onSearchChange}
                onClear={onClearSearch}
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
            selectedExercises={selectedExercises}
            onExerciseSelect={onExerciseSelect}
            sanitizeText={sanitizeText}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};