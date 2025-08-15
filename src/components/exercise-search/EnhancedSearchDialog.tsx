
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Search } from "lucide-react";
import { useEnhancedExerciseSearch } from "@/hooks/useEnhancedExerciseSearch";
import { EnhancedSearchResults } from "./EnhancedSearchResults";
import type { Exercise } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EnhancedSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExercisesSelect: (exercises: Exercise[]) => void;
  selectedExercises: Exercise[];
}

export function EnhancedSearchDialog({
  isOpen,
  onClose,
  onExercisesSelect,
  selectedExercises
}: EnhancedSearchDialogProps) {
  const [tempSelectedExercises, setTempSelectedExercises] = useState<Exercise[]>([]);
  
  const { 
    exercises, 
    isLoading, 
    hasError, 
    exerciseCount,
    searchQuery,
    setSearchQuery,
    category,
    setCategory,
    equipment,
    setEquipment,
    muscle,
    setMuscle,
    categories,
    equipments,
    muscles,
  } = useEnhancedExerciseSearch();

  useEffect(() => {
    setTempSelectedExercises(selectedExercises);
  }, [selectedExercises]);

  const handleExerciseToggle = (exercise: Exercise) => {
    setTempSelectedExercises(prev => {
      const isSelected = prev.some(e => e.id === exercise.id);
      if (isSelected) {
        return prev.filter(e => e.id !== exercise.id);
      } else {
        return [...prev, exercise];
      }
    });
  };

  const handleDone = () => {
    onExercisesSelect(tempSelectedExercises);
    setTempSelectedExercises([]);
    setSearchQuery("");
    onClose();
  };

  const handleCancel = () => {
    setTempSelectedExercises([]);
    setSearchQuery("");
    onClose();
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const removeTempSelection = (exerciseId: string) => {
    setTempSelectedExercises(prev => prev.filter(e => e.id !== exerciseId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Search Exercises</DialogTitle>
          <DialogDescription>
            Search for exercises to add to your workout program. Select multiple exercises and click "Done" when finished.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Search Input */}
          <div className="relative">
            <Input
              placeholder="Search for exercises or equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="p-1 hover:bg-muted/50 rounded-full transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-3 gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={equipment} onValueChange={setEquipment}>
              <SelectTrigger><SelectValue placeholder="Equipment" /></SelectTrigger>
              <SelectContent>
                {equipments.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={muscle} onValueChange={setMuscle}>
              <SelectTrigger><SelectValue placeholder="Muscle" /></SelectTrigger>
              <SelectContent>
                {muscles.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Search Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </div>
              ) : (
                `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''} found`
              )}
            </span>
            <span>{tempSelectedExercises.length} selected</span>
          </div>

          {/* Selected Exercises */}
          {tempSelectedExercises.length > 0 && (
            <div className="p-3 bg-primary/5 rounded-lg border">
              <label className="text-sm font-medium mb-2 block">Selected Exercises:</label>
              <div className="flex flex-wrap gap-2">
                {tempSelectedExercises.map((exercise) => (
                  <Badge 
                    key={exercise.id}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeTempSelection(exercise.id)}
                  >
                    {exercise.name} ×
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          <div className="flex-1 overflow-hidden">
            {hasError ? (
              <div className="text-center py-8 text-destructive">
                <p>Failed to search exercises. Please try again.</p>
              </div>
            ) : (
              <EnhancedSearchResults
                results={exercises}
                selectedExercises={tempSelectedExercises}
                onExerciseToggle={handleExerciseToggle}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
        
        {/* Dialog Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button 
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDone}
            disabled={tempSelectedExercises.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            Done ({tempSelectedExercises.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
