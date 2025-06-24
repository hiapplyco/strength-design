
import { useCallback } from "react";
import type { Exercise } from "@/components/exercise-search/types";

interface UseExerciseSelectionProps {
  selectedExercises: Exercise[];
  setSelectedExercises: (exercises: Exercise[]) => void;
}

export function useExerciseSelection({
  selectedExercises,
  setSelectedExercises,
}: UseExerciseSelectionProps) {
  // Enhanced exercise selection handler that properly handles add vs remove
  const handleExerciseSelection = useCallback((exercise: Exercise, action?: 'add' | 'remove') => {
    console.log('InputContainer handleExerciseSelection:', exercise.name, 'action:', action);
    
    const isSelected = selectedExercises.some(e => e.id === exercise.id);
    
    if (action === 'add' && !isSelected) {
      // Always add if explicitly told to add and not already selected
      console.log('Adding exercise to selection:', exercise.name);
      setSelectedExercises([...selectedExercises, exercise]);
    } else if (action === 'remove' && isSelected) {
      // Always remove if explicitly told to remove and currently selected
      console.log('Removing exercise from selection:', exercise.name);
      setSelectedExercises(selectedExercises.filter(e => e.id !== exercise.id));
    } else if (!action) {
      // Toggle behavior when no action specified (for backwards compatibility)
      if (isSelected) {
        console.log('Toggling off exercise:', exercise.name);
        setSelectedExercises(selectedExercises.filter(e => e.id !== exercise.id));
      } else {
        console.log('Toggling on exercise:', exercise.name);
        setSelectedExercises([...selectedExercises, exercise]);
      }
    }
  }, [selectedExercises, setSelectedExercises]);

  // Handle bulk exercise selection
  const handleBulkExerciseSelection = useCallback((exercises: Exercise[]) => {
    console.log('InputContainer handleBulkExerciseSelection:', exercises.length, 'exercises');
    
    // Filter out exercises that are already selected to avoid duplicates
    const newExercises = exercises.filter(exercise => 
      !selectedExercises.some(selected => selected.id === exercise.id)
    );
    
    console.log('InputContainer: Adding', newExercises.length, 'new exercises');
    if (newExercises.length > 0) {
      setSelectedExercises(prev => {
        const updated = [...prev, ...newExercises];
        console.log('InputContainer: Updated exercise count:', updated.length);
        return updated;
      });
    }
  }, [selectedExercises, setSelectedExercises]);

  return {
    handleExerciseSelection,
    handleBulkExerciseSelection,
  };
}
