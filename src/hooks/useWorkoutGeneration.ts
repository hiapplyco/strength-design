
import { useState } from "react";
import { useSmartToast } from "./useSmartToast";
import type { WeeklyWorkouts } from "@/types/fitness";
import type { GenerateWorkoutParams } from "./workout-generation/types";
import { WorkoutGenerationService } from "./workout-generation/workoutGenerationService";

export const useWorkoutGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const { error, loading, success } = useSmartToast();
  
  const workoutService = new WorkoutGenerationService();

  const generateWorkout = async (params: GenerateWorkoutParams): Promise<WeeklyWorkouts | null> => {
    setIsGenerating(true);
    setDebugInfo(null);

    // Create a promise for the loading toast
    const generationPromise = workoutService.generateWorkout(params);

    try {
      // Use the loading toast with promise handling
      const result = await loading(generationPromise, {
        loading: "Generating your personalized workout...",
        success: "Workout generated successfully!",
        error: "Failed to generate workout"
      });
      
      // Extract debug info if present
      if (result && result._debug) {
        setDebugInfo(result._debug);
        console.log('Debug info from workout generation:', result._debug);
        delete result._debug;
      }

      return result;
    } catch (generationError: any) {
      console.error('Error generating workout:', generationError);
      
      // Handle workout limit exceeded error
      if (generationError.message === 'WORKOUT_LIMIT_EXCEEDED') {
        setShowPaywall(true);
        error(generationError, "Workout Generation", {
          duration: 8000,
          action: {
            label: "Upgrade",
            onClick: () => {
              window.location.href = "/pricing";
            }
          }
        });
        return null;
      }
      
      // Let the smart toast system handle other errors
      error(generationError, "Workout Generation", {
        action: {
          label: "Try Again",
          onClick: () => {
            // Retry logic would be handled by parent component
            console.log("Retry workout generation");
          }
        }
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generateWorkout,
    debugInfo,
    showPaywall,
    setShowPaywall
  };
};
