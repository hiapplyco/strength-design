import { db, auth } from "@/lib/firebase/config";
import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, doc, setDoc, getDoc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import type { WeeklyWorkouts } from "@/types/fitness";
import type { GenerateWorkoutParams, WorkoutGenerationResult } from "./types";
import { generateWorkoutSummary } from "./workoutSummaryUtils";
import { User } from "firebase/auth";

export class WorkoutGenerationService {
  private functions = getFunctions();

  async generateWorkout(params: GenerateWorkoutParams): Promise<WeeklyWorkouts | null> {
    const startTime = performance.now();

    try {
      // Get current user to ensure authentication
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be logged in to generate workouts");
      }

      // Get the ID token for API authentication
      const idToken = await currentUser.getIdToken();

      // Check workout usage limits before proceeding
      await this.checkWorkoutLimits(currentUser, idToken);

      // Sanitize and validate inputs
      const sanitizedParams = this.sanitizeParams(params);

      console.log('Inputs being sent to function:', sanitizedParams);

      // Log the session input
      const sessionId = await this.logSessionInput(sanitizedParams);

      // Generate workout title
      const workoutTitle = await this.generateWorkoutTitle(sanitizedParams);

      // Generate the workout
      const workoutData = await this.callWorkoutGenerationAPI(sanitizedParams);

      if (!workoutData) {
        return null;
      }

      // Increment workout usage for non-subscribed users
      await this.incrementWorkoutUsage(currentUser, idToken);

      // Generate summary and save workout
      const workoutSummary = generateWorkoutSummary(workoutData, sanitizedParams);
      await this.saveGeneratedWorkout(currentUser.uid, workoutData, workoutTitle, workoutSummary, sanitizedParams);

      // Update session duration
      const sessionDuration = Math.round(performance.now() - startTime);
      await this.updateSessionDuration(sessionId, sessionDuration, workoutData);

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

  private async checkWorkoutLimits(user: User, idToken: string) {
    // Check subscription status
    const checkSubscription = httpsCallable(this.functions, 'checkSubscription');
    const subscriptionResult = await checkSubscription();
    const subscriptionData = subscriptionResult.data as any;
    const isSubscribed = subscriptionData?.subscribed || false;

    // If user is subscribed, they can generate unlimited workouts
    if (isSubscribed) {
      return;
    }

    // Check free workout usage from user profile
    const profileRef = doc(db, 'user_profiles', user.uid);
    const profileSnap = await getDoc(profileRef);
    
    if (!profileSnap.exists()) {
      console.error('User profile not found');
      throw new Error('Failed to check workout usage limits');
    }

    const profile = profileSnap.data();
    const freeWorkoutsUsed = profile?.free_workouts_used || 0;

    if (freeWorkoutsUsed >= 3) {
      throw new Error('WORKOUT_LIMIT_EXCEEDED');
    }
  }

  private async incrementWorkoutUsage(user: User, idToken: string) {
    // Check subscription status again
    const checkSubscription = httpsCallable(this.functions, 'checkSubscription');
    const subscriptionResult = await checkSubscription();
    const subscriptionData = subscriptionResult.data as any;
    const isSubscribed = subscriptionData?.subscribed || false;

    // Only increment usage for non-subscribed users
    if (!isSubscribed) {
      const profileRef = doc(db, 'user_profiles', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (!profileSnap.exists()) {
        console.error('User profile not found');
        return;
      }

      const profile = profileSnap.data();
      const currentUsage = profile?.free_workouts_used || 0;

      // Update with incremented value
      await updateDoc(profileRef, {
        free_workouts_used: currentUsage + 1,
        updated_at: serverTimestamp()
      });
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

  private async logSessionInput(params: any): Promise<string> {
    const sessionRef = await addDoc(collection(db, 'session_io'), {
      weather_prompt: params.weatherPrompt,
      fitness_level: params.fitnessLevel,
      prescribed_exercises: params.prescribedExercises,
      injuries: params.injuries,
      number_of_days: params.numberOfDays,
      number_of_cycles: params.numberOfCycles,
      session_duration_ms: 0,
      success: false,
      created_at: serverTimestamp()
    });

    return sessionRef.id;
  }

  private async generateWorkoutTitle(params: any): Promise<string> {
    try {
      const generateTitle = httpsCallable(this.functions, 'generateWorkoutTitle');
      const result = await generateTitle({
        prompt: params.prompt,
        fitnessLevel: params.fitnessLevel,
        prescribedExercises: params.prescribedExercises,
        numberOfDays: params.numberOfDays,
        numberOfCycles: params.numberOfCycles
      });

      const data = result.data as any;
      return data?.title || `${params.numberOfCycles}-Cycle ${params.numberOfDays}-Day Workout Plan`;
    } catch (error) {
      console.error('Error generating workout title:', error);
      return `${params.numberOfCycles}-Cycle ${params.numberOfDays}-Day Workout Plan`;
    }
  }

  private async callWorkoutGenerationAPI(params: any) {
    try {
      const generateWorkout = httpsCallable(this.functions, 'generateWorkout');
      const result = await generateWorkout(params);
      const data = result.data;

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from workout generation');
      }

      return data;
    } catch (error: any) {
      console.error('Function error:', error);
      const errorMessage = error?.message || 'Failed to generate workout. Please try again.';
      throw new Error(errorMessage);
    }
  }

  private async saveGeneratedWorkout(userId: string, workoutData: any, title: string, summary: string, params: any) {
    try {
      await addDoc(collection(db, `users/${userId}/workouts`), {
        workout_data: workoutData,
        title: title,
        tags: [params.fitnessLevel],
        summary: summary,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  }

  private async updateSessionDuration(sessionId: string, duration: number, workoutData: any) {
    try {
      const sessionRef = doc(db, 'session_io', sessionId);
      await updateDoc(sessionRef, {
        generated_workouts: workoutData,
        session_duration_ms: duration,
        success: true,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating session:', error);
    }
  }
}