
import { useCallback } from "react";
import { PresetsSection } from "../input-sections/PresetsSection";
import type { Exercise } from "../../exercise-search/types";

interface PresetHandlerProps {
  onSelectPreset: (preset: {
    title: string;
    prescribedExercises: string;
    fitnessLevel: string;
    numberOfDays: number;
  }) => void;
  setSelectedExercises: (exercises: Exercise[]) => void;
  currentPrescribedExercises: string;
}

export function PresetHandler({
  onSelectPreset,
  setSelectedExercises,
  currentPrescribedExercises
}: PresetHandlerProps) {
  return (
    <PresetsSection 
      onSelectPreset={onSelectPreset}
      onExercisesExtracted={(exercises) => setSelectedExercises(exercises)}
      currentPrescribedExercises={currentPrescribedExercises}
    />
  );
}
