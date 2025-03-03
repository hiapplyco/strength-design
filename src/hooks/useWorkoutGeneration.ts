import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { WeeklyWorkouts } from "@/types/fitness";
import { safelyGetWorkoutProperty } from "@/utils/workout-helpers";

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

      // Sanitize and validate inputs
      const sanitizedParams = {
        prompt: String(params.prompt || ""),
        weatherPrompt: String(params.weatherPrompt || ""),
        fitnessLevel: String(params.fitnessLevel || "beginner"),
        prescribedExercises: String(params.prescribedExercises || ""),
        numberOfDays: Number(params.numberOfDays) || 7
      };

      console.log('Weather prompt being sent to edge function:', sanitizedParams.weatherPrompt);

      // First log the session input
      const { error: sessionError } = await supabase.from('session_io').insert({
        weather_prompt: sanitizedParams.weatherPrompt,
        fitness_level: sanitizedParams.fitnessLevel,
        prescribed_exercises: sanitizedParams.prescribedExercises,
        number_of_days: sanitizedParams.numberOfDays,
        session_duration_ms: 0,
        success: false
      });

      if (sessionError) {
        console.error('Error storing session:', sessionError);
      }

      // Generate a cute title for the workout
      const { data: titleData, error: titleError } = await supabase.functions.invoke('generate-workout-title', {
        body: {
          prompt: sanitizedParams.prompt,
          fitnessLevel: sanitizedParams.fitnessLevel,
          prescribedExercises: sanitizedParams.prescribedExercises,
          numberOfDays: sanitizedParams.numberOfDays
        }
      });

      if (titleError) {
        console.error('Error generating workout title:', titleError);
      }

      const workoutTitle = titleData?.title || `${sanitizedParams.numberOfDays}-Day Workout Plan`;

      // Generate the workout
      const { data, error } = await supabase.functions.invoke('generate-weekly-workouts', {
        body: {
          ...sanitizedParams,
          numberOfDays: sanitizedParams.numberOfDays
        }
      });

      // Check for edge function error response
      if (error || !data) {
        console.error('Edge function error:', error);
        const errorMessage = error?.message || 'Failed to generate workout. Please try again.';
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return null;
      }

      // Validate the response data
      if (typeof data !== 'object') {
        throw new Error('Invalid response format from workout generation');
      }

      // Generate a summary for the workout
      const workoutSummary = generateWorkoutSummary(data, sanitizedParams);

      // Save to generated_workouts table with the title
      const { error: saveError } = await supabase
        .from('generated_workouts')
        .insert({
          user_id: session.user.id,
          workout_data: data,
          title: workoutTitle,
          tags: [sanitizedParams.fitnessLevel],
          summary: workoutSummary
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

      // Return data with title and summary for the UI
      const enhancedData = {
        ...data,
        _meta: {
          title: workoutTitle,
          summary: workoutSummary
        }
      };

      return enhancedData;
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

  // Helper function to generate a summary based on the workout data
  const generateWorkoutSummary = (workoutData: WeeklyWorkouts, params: GenerateWorkoutParams): string => {
    const dayCount = Object.keys(workoutData).length;
    const focusAreas = new Set<string>();
    
    // Extract workout focus areas from the data
    Object.values(workoutData).forEach(day => {
      const allText = [safelyGetWorkoutProperty(day, 'description'), safelyGetWorkoutProperty(day, 'strength'), safelyGetWorkoutProperty(day, 'workout')].join(' ').toLowerCase();
      
      if (allText.includes('cardio') || allText.includes('endurance')) focusAreas.add('cardio');
      if (allText.includes('strength') || allText.includes('weight')) focusAreas.add('strength');
      if (allText.includes('hiit') || allText.includes('interval')) focusAreas.add('HIIT');
      if (allText.includes('mobility') || allText.includes('flexibility')) focusAreas.add('mobility');
      if (allText.includes('core') || allText.includes('abs')) focusAreas.add('core');
    });
    
    const focusString = Array.from(focusAreas).join(', ');
    
    return `This ${dayCount}-day ${params.fitnessLevel || ''} workout program focuses on ${focusString || 'overall fitness'} training.`;
  };

  return {
    isGenerating,
    generateWorkout
  };
};
