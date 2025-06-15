import { supabase } from "@/integrations/supabase/client";
import type { WeeklyWorkouts } from "@/types/fitness";
import type { GenerateWorkoutParams, WorkoutGenerationResult } from "./types";
import { generateWorkoutSummary } from "./workoutSummaryUtils";

export class WorkoutGenerationService {
  async generateWorkout(params: GenerateWorkoutParams): Promise<WeeklyWorkouts | null> {
    const startTime = performance.now();

    try {
      // Get current session to ensure user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to generate workouts");
      }

      // Check workout usage limits before proceeding
      await this.checkWorkoutLimits(session);

      // Sanitize and validate inputs
      const sanitizedParams = this.sanitizeParams(params);

      console.log('Inputs being sent to edge function:', sanitizedParams);

      // Log the session input
      await this.logSessionInput(sanitizedParams);

      // Generate workout title
      const workoutTitle = await this.generateWorkoutTitle(sanitizedParams);

      // Generate the workout
      const workoutData = await this.callWorkoutGenerationAPI(sanitizedParams);

      if (!workoutData) {
        return null;
      }

      // Increment workout usage for non-subscribed users
      await this.incrementWorkoutUsage(session);

      // Generate summary and save workout
      const workoutSummary = generateWorkoutSummary(workoutData, sanitizedParams);
      await this.saveGeneratedWorkout(session.user.id, workoutData, workoutTitle, workoutSummary, sanitizedParams);

      // Update session duration
      const sessionDuration = Math.round(performance.now() - startTime);
      await this.updateSessionDuration(sessionDuration, workoutData);

      // Return enhanced data
      return {
        ...workoutData,
        _meta: {
          title: workoutTitle,
          summary: workoutSummary,
          inputs: sanitizedParams,
          debug: workoutData._debug
        }
      };
    } catch (error: any) {
      console.error('Error generating workout:', error);
      throw error;
    }
  }

  private async checkWorkoutLimits(session: any) {
    // Check subscription status
    const { data: subscriptionData } = await supabase.functions.invoke('check-subscription', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const isSubscribed = subscriptionData?.subscribed || false;

    // If user is subscribed, they can generate unlimited workouts
    if (isSubscribed) {
      return;
    }

    // Check free workout usage
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('free_workouts_used')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error checking workout usage:', error);
      throw new Error('Failed to check workout usage limits');
    }

    const freeWorkoutsUsed = profile?.free_workouts_used || 0;

    if (freeWorkoutsUsed >= 3) {
      throw new Error('WORKOUT_LIMIT_EXCEEDED');
    }
  }

  private async incrementWorkoutUsage(session: any) {
    // Check subscription status again
    const { data: subscriptionData } = await supabase.functions.invoke('check-subscription', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const isSubscribed = subscriptionData?.subscribed || false;

    // Only increment usage for non-subscribed users
    if (!isSubscribed) {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          free_workouts_used: supabase.sql`free_workouts_used + 1`
        })
        .eq('id', session.user.id);

      if (error) {
        console.error('Error incrementing workout usage:', error);
        // Don't throw here as the workout was already generated
      }
    }
  }

  private sanitizeParams(params: GenerateWorkoutParams) {
    return {
      prompt: String(params.prompt || ""),
      weatherPrompt: String(params.weatherPrompt || ""),
      fitnessLevel: String(params.fitnessLevel || "beginner"),
      prescribedExercises: String(params.prescribedExercises || ""),
      injuries: String(params.injuries || ""),
      numberOfDays: Number(params.numberOfDays) || 7,
      numberOfCycles: Number(params.numberOfCycles) || 1,
      selectedExercises: params.selectedExercises || [],
      chatHistory: params.chatHistory || []
    };
  }

  private async logSessionInput(params: any) {
    const { error } = await supabase.from('session_io').insert({
      weather_prompt: params.weatherPrompt,
      fitness_level: params.fitnessLevel,
      prescribed_exercises: params.prescribedExercises,
      injuries: params.injuries,
      number_of_days: params.numberOfDays,
      number_of_cycles: params.numberOfCycles,
      session_duration_ms: 0,
      success: false
    });

    if (error) {
      console.error('Error storing session:', error);
    }
  }

  private async generateWorkoutTitle(params: any): Promise<string> {
    const { data: titleData, error: titleError } = await supabase.functions.invoke('generate-workout-title', {
      body: {
        prompt: params.prompt,
        fitnessLevel: params.fitnessLevel,
        prescribedExercises: params.prescribedExercises,
        numberOfDays: params.numberOfDays,
        numberOfCycles: params.numberOfCycles
      }
    });

    if (titleError) {
      console.error('Error generating workout title:', titleError);
    }

    return titleData?.title || `${params.numberOfCycles}-Cycle ${params.numberOfDays}-Day Workout Plan`;
  }

  private async callWorkoutGenerationAPI(params: any) {
    const { data, error } = await supabase.functions.invoke('generate-weekly-workouts', {
      body: params
    });

    if (error || !data) {
      console.error('Edge function error:', error);
      const errorMessage = error?.message || 'Failed to generate workout. Please try again.';
      throw new Error(errorMessage);
    }

    if (typeof data !== 'object') {
      throw new Error('Invalid response format from workout generation');
    }

    return data;
  }

  private async saveGeneratedWorkout(userId: string, workoutData: any, title: string, summary: string, params: any) {
    const { error } = await supabase
      .from('generated_workouts')
      .insert({
        user_id: userId,
        workout_data: workoutData,
        title: title,
        tags: [params.fitnessLevel],
        summary: summary
      });

    if (error) {
      console.error('Error saving workout:', error);
    }
  }

  private async updateSessionDuration(duration: number, workoutData: any) {
    const { error } = await supabase
      .from('session_io')
      .update({
        generated_workouts: workoutData,
        session_duration_ms: duration,
        success: true
      })
      .eq('session_duration_ms', 0)
      .eq('success', false);

    if (error) {
      console.error('Error updating session:', error);
    }
  }
}
