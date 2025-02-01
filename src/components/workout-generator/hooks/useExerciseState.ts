import { useState } from "react";
import type { Exercise } from "@/components/exercise-search/types";

export const useExerciseState = () => {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [fitnessLevel, setFitnessLevel] = useState<string>("");

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercises(prev => {
      if (prev.some(e => e.name === exercise.name)) {
        return prev.filter(e => e.name !== exercise.name);
      }
      return [...prev, exercise];
    });
  };

  return {
    selectedExercises,
    fitnessLevel,
    setFitnessLevel,
    handleExerciseSelect
  };
};