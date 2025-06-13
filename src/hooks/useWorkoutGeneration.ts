
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { WeeklyWorkouts } from "@/types/fitness";
import type { GenerateWorkoutParams } from "./workout-generation/types";
import { WorkoutGenerationService } from "./workout-generation/workoutGenerationService";

export const useWorkoutGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();
  
  const workoutService = new WorkoutGenerationService();

  const generateWorkout = async (params: GenerateWorkoutParams): Promise<WeeklyWorkouts | null> => {
    setIsGenerating(true);
    setDebugInfo(null);

    try {
      const result = await workoutService.generateWorkout(params);
      
      // Extract debug info if present
      if (result && result._debug) {
        setDebugInfo(result._debug);
        console.log('Debug info from workout generation:', result._debug);
        delete result._debug;
      }

      return result;
    } catch (error: any) {
      console.error('Error generating workout:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate workout. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generateWorkout,
    debugInfo
  };
};
