
import { useCallback } from "react";
import type { Exercise } from "@/components/exercise-search/types";
import type { WeatherData } from "@/types/weather";

interface UseWorkoutFormHandlersProps {
  handleGenerateWorkout: (params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: Exercise[];
    fitnessLevel: string;
    prescribedExercises: string;
    injuries?: string;
  }) => Promise<void>;
  generatePrompt: string;
  weatherPrompt: string;
  selectedExercises: Exercise[];
  fitnessLevel: string;
  prescribedExercises: string;
  injuries: string;
  setFitnessLevel: (value: string) => void;
  setInjuries: (value: string) => void;
  setSelectedExercises: (exercises: Exercise[]) => void;
  setPrescribedExercises: (value: string) => void;
  handleWeatherUpdate: (weatherData: WeatherData | null, weatherPrompt: string) => void;
  setNumberOfDays: (value: number) => void;
}

export function useWorkoutFormHandlers({
  handleGenerateWorkout,
  generatePrompt,
  weatherPrompt,
  selectedExercises,
  fitnessLevel,
  prescribedExercises,
  injuries,
  setFitnessLevel,
  setInjuries,
  setSelectedExercises,
  setPrescribedExercises,
  handleWeatherUpdate,
  setNumberOfDays,
}: UseWorkoutFormHandlersProps) {
  // Generate workout handler
  const onGenerate = useCallback(async () => {
    await handleGenerateWorkout({
      prompt: generatePrompt,
      weatherPrompt: weatherPrompt || "",
      selectedExercises,
      fitnessLevel,
      prescribedExercises,
      injuries: injuries || undefined,
    });
  }, [handleGenerateWorkout, generatePrompt, weatherPrompt, selectedExercises, fitnessLevel, prescribedExercises, injuries]);

  // Reset form handler
  const onClear = useCallback(() => {
    setFitnessLevel("");
    setInjuries("");
    setSelectedExercises([]);
    setPrescribedExercises("");
    handleWeatherUpdate(null, "");
  }, [setFitnessLevel, setInjuries, setSelectedExercises, setPrescribedExercises, handleWeatherUpdate]);

  // Handler for preset selection
  const handleSelectPreset = useCallback((preset: { 
    title: string; 
    prescribedExercises: string; 
    fitnessLevel: string;
    numberOfDays: number;
  }) => {
    setPrescribedExercises(preset.prescribedExercises);
    setFitnessLevel(preset.fitnessLevel);
    setNumberOfDays(preset.numberOfDays);
  }, [setPrescribedExercises, setFitnessLevel, setNumberOfDays]);

  return {
    onGenerate,
    onClear,
    handleSelectPreset,
  };
}
