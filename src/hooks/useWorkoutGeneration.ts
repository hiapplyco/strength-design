
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
  numberOfCycles: number;
  injuries?: string;
}

export const useWorkoutGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();

  const generateWorkout = async (params: GenerateWorkoutParams): Promise<WeeklyWorkouts | null> => {
    const startTime = performance.now();
    setIsGenerating(true);
    setDebugInfo(null);

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
        injuries: String(params.injuries || ""),
        numberOfDays: Number(params.numberOfDays) || 7,
        numberOfCycles: Number(params.numberOfCycles) || 1
      };

      console.log('Inputs being sent to edge function:', sanitizedParams);

      // First log the session input
      const { error: sessionError } = await supabase.from('session_io').insert({
        weather_prompt: sanitizedParams.weatherPrompt,
        fitness_level: sanitizedParams.fitnessLevel,
        prescribed_exercises: sanitizedParams.prescribedExercises,
        injuries: sanitizedParams.injuries,
        number_of_days: sanitizedParams.numberOfDays,
        number_of_cycles: sanitizedParams.numberOfCycles,
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
          numberOfDays: sanitizedParams.numberOfDays,
          numberOfCycles: sanitizedParams.numberOfCycles
        }
      });

      if (titleError) {
        console.error('Error generating workout title:', titleError);
      }

      const workoutTitle = titleData?.title || `${sanitizedParams.numberOfCycles}-Cycle ${sanitizedParams.numberOfDays}-Day Workout Plan`;

      // Generate the workout
      const { data, error } = await supabase.functions.invoke('generate-weekly-workouts', {
        body: {
          ...sanitizedParams,
          numberOfDays: sanitizedParams.numberOfDays,
          numberOfCycles: sanitizedParams.numberOfCycles
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

      // Extract any debug information from the response
      if (data._debug) {
        setDebugInfo(data._debug);
        console.log('Debug info from workout generation:', data._debug);
        delete data._debug; // Remove debug info from the workout data
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
          summary: workoutSummary,
          inputs: sanitizedParams,  // Include all inputs used
          debug: debugInfo  // Include debug info
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
    const cycleCount = params.numberOfCycles;
    const dayCount = params.numberOfDays;
    const focusAreas = new Set<string>();
    
    // Extract workout focus areas from the data
    Object.entries(workoutData).forEach(([key, value]) => {
      if (key === '_meta') return;
      
      if (key.startsWith('cycle')) {
        // Handle new format with cycles
        Object.values(value).forEach(day => {
          const allText = [
            safelyGetWorkoutProperty(day, 'description'), 
            safelyGetWorkoutProperty(day, 'strength'), 
            safelyGetWorkoutProperty(day, 'workout')
          ].join(' ').toLowerCase();
          
          extractFocusAreas(allText, focusAreas);
        });
      } else {
        // Handle legacy format (direct days)
        const allText = [
          safelyGetWorkoutProperty(value, 'description'), 
          safelyGetWorkoutProperty(value, 'strength'), 
          safelyGetWorkoutProperty(value, 'workout')
        ].join(' ').toLowerCase();
        
        extractFocusAreas(allText, focusAreas);
      }
    });
    
    const focusString = Array.from(focusAreas).join(', ');
    
    return `This ${cycleCount}-cycle, ${dayCount}-day ${params.fitnessLevel || ''} workout program focuses on ${focusString || 'overall fitness'} training.`;
  };
  
  const extractFocusAreas = (text: string, focusAreas: Set<string>) => {
    if (text.includes('cardio') || text.includes('endurance')) focusAreas.add('cardio');
    if (text.includes('strength') || text.includes('weight')) focusAreas.add('strength');
    if (text.includes('hiit') || text.includes('interval')) focusAreas.add('HIIT');
    if (text.includes('mobility') || text.includes('flexibility')) focusAreas.add('mobility');
    if (text.includes('core') || text.includes('abs')) focusAreas.add('core');
  };

  return {
    isGenerating,
    generateWorkout,
    debugInfo
  };
};
