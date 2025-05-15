
import { useCallback } from "react";

interface UseWorkoutGenerationProps {
  setIsGenerating: (value: boolean) => void;
  handleGenerateWorkout: (params: any) => Promise<void>;
  generatePrompt: string;
  weatherPrompt: string;
  selectedExercises: any[];
  fitnessLevel: string;
  prescribedExercises: string;
  injuries: string;
  numberOfDays: number;
  numberOfCycles: number;
}

export function useWorkoutGeneration({
  setIsGenerating,
  handleGenerateWorkout,
  generatePrompt,
  weatherPrompt,
  selectedExercises,
  fitnessLevel,
  prescribedExercises,
  injuries,
  numberOfDays,
  numberOfCycles,
}: UseWorkoutGenerationProps) {
  
  const handleSubmit = useCallback(() => {
    setIsGenerating(true);
    
    console.log('Sending to workout generator:');
    console.log('- Weather prompt:', weatherPrompt);
    console.log('- Fitness level:', fitnessLevel);
    console.log('- Number of days:', numberOfDays);
    console.log('- Number of cycles:', numberOfCycles);
    console.log('- Prescribed exercises:', prescribedExercises ? 'provided' : 'none');
    console.log('- Injuries:', injuries ? 'provided' : 'none');
    
    handleGenerateWorkout({
      prompt: generatePrompt,
      weatherPrompt,
      selectedExercises,
      fitnessLevel,
      prescribedExercises,
      injuries,
      numberOfDays,
      numberOfCycles
    }).finally(() => {
      setIsGenerating(false);
    });
  }, [
    generatePrompt,
    weatherPrompt,
    selectedExercises,
    fitnessLevel,
    prescribedExercises,
    injuries,
    handleGenerateWorkout,
    setIsGenerating,
    numberOfDays,
    numberOfCycles,
  ]);

  return { handleSubmit };
}
