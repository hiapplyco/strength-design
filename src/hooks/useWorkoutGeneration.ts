
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { WeeklyWorkouts } from "@/types/fitness";

interface GenerateWorkoutParams {
  prompt: string;
  weatherPrompt: string;
  fitnessLevel: string;
  prescribedExercises: string;
  numberOfDays: number;
}

export const useWorkoutGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateWorkout = async (params: GenerateWorkoutParams): Promise<WeeklyWorkouts | null> => {
    const startTime = performance.now();
    setIsGenerating(true);

    try {
      // Get current session to ensure user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to generate workouts");
      }

      // First log the session input
      const { error: sessionError } = await supabase.from('session_io').insert({
        weather_prompt: params.weatherPrompt,
        fitness_level: params.fitnessLevel,
        prescribed_exercises: params.prescribedExercises,
        number_of_days: params.numberOfDays,
        session_duration_ms: 0,
        success: false
      });

      if (sessionError) {
        console.error('Error storing session:', sessionError);
      }

      // Generate the workout
      const { data, error } = await supabase.functions.invoke('generate-weekly-workouts', {
        body: {
          ...params,
          numberOfDays: params.numberOfDays
        }
      });

      if (error) {
        console.error('Error generating workout:', error);
        throw error;
      }

      // Save to generated_workouts table
      const { error: saveError } = await supabase
        .from('generated_workouts')
        .insert({
          user_id: session.user.id,
          workout_data: data,
          title: `${params.numberOfDays}-Day Workout Plan`,
          tags: [params.fitnessLevel],
          summary: `${params.numberOfDays}-day workout plan`
        });

      if (saveError) {
        console.error('Error saving workout:', saveError);
      }

      const sessionDuration = Math.round(performance.now() - startTime);
      const { error: updateError } = await supabase
        .from('session_io')
        .update({
          generated_workouts: data,
          session_duration_ms: sessionDuration,
          success: true
        })
        .eq('session_duration_ms', 0)
        .eq('success', false);

      if (updateError) {
        console.error('Error updating session:', updateError);
      }

      return data;
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
    generateWorkout
  };
};
