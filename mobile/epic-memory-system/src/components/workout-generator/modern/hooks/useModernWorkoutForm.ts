
import { useState, useEffect } from 'react';
import { useWorkoutGeneration } from '@/hooks/useWorkoutGeneration';
import { useWorkoutReplacement } from '@/hooks/useWorkoutReplacement';
import { useWorkoutStore } from '@/stores/workoutStore';
import type { WeeklyWorkouts } from '@/types/fitness';
import type { Exercise } from '@/components/exercise-search/types';

export function useModernWorkoutForm() {
  const { currentWorkout, workoutTitle, hasValidWorkout } = useWorkoutStore();
  const [selectedTab, setSelectedTab] = useState('generator');
  const [generatedWorkout, setGeneratedWorkout] = useState<WeeklyWorkouts | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [numberOfDays, setNumberOfDays] = useState(5);
  const [numberOfCycles, setNumberOfCycles] = useState(1);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { generateWorkout } = useWorkoutGeneration();
  const { getScheduledWorkoutCount, replaceWorkouts, isReplacing } = useWorkoutReplacement();

  // Check for stored workout on mount
  useEffect(() => {
    if (hasValidWorkout() && currentWorkout) {
      setGeneratedWorkout(currentWorkout as WeeklyWorkouts);
      setSelectedTab('preview');
    }
  }, []);

  const existingWorkoutCount = getScheduledWorkoutCount();

  const handleGenerateWorkout = async (params: {
    prompt: string;
    weatherPrompt: string;
    selectedExercises: Exercise[];
    fitnessLevel: string;
    prescribedExercises: string;
    injuries?: string;
  }) => {
    setIsGenerating(true);
    try {
      const workout = await generateWorkout({
        numberOfDays,
        numberOfCycles,
        fitnessLevel: params.fitnessLevel,
        weatherPrompt: params.weatherPrompt,
        prescribedExercises: params.prescribedExercises,
        injuries: params.injuries,
        prompt: params.prompt,
        selectedExercises: params.selectedExercises
      });
      
      if (workout) {
        console.log('Generated workout:', workout);
        setGeneratedWorkout(workout);
        
        // Auto-switch to preview tab after successful generation
        setTimeout(() => {
          setSelectedTab('preview');
        }, 500); // Small delay for smooth transition
      }
    } catch (error) {
      console.error('Error generating workout:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmReplace = async (): Promise<boolean> => {
    if (generatedWorkout) {
      const success = await replaceWorkouts(generatedWorkout);
      if (success) {
        setIsDialogOpen(false);
        return true;
      }
    }
    return false;
  };

  const handleReplaceWorkouts = () => {
    if (existingWorkoutCount > 0) {
      setIsDialogOpen(true);
    } else {
      handleConfirmReplace();
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
  };

  // Auto-switch back to generator tab when starting a new generation
  useEffect(() => {
    if (isGenerating && selectedTab !== 'generator') {
      setSelectedTab('generator');
    }
  }, [isGenerating, selectedTab]);

  return {
    // State
    selectedTab,
    setSelectedTab,
    generatedWorkout,
    isGenerating,
    numberOfDays,
    setNumberOfDays,
    numberOfCycles,
    setNumberOfCycles,
    generatePrompt,
    setGeneratePrompt,
    isDialogOpen,
    setIsDialogOpen,
    existingWorkoutCount,
    isReplacing,
    
    // Handlers
    handleGenerateWorkout,
    handleConfirmReplace,
    handleReplaceWorkouts,
    handleCancel,
  };
}
