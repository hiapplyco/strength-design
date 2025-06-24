
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

    try {
      // Call the service directly and handle the result
      const result = await workoutService.generateWorkout(params);
      
      if (!result) {
        error(new Error("No workout data received"), "Workout Generation");
        return null;
      }

      // Extract debug info if present and result is an object
      if (result && typeof result === 'object' && '_debug' in result) {
        setDebugInfo((result as any)._debug);
        console.log('Debug info from workout generation:', (result as any)._debug);
        delete (result as any)._debug;
      }

      // Show success message
      success("Workout generated successfully!");
      
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
