// Compatibility layer for migrating from Supabase hooks to Firebase hooks
import { useWorkouts, useCreateWorkout, useUpdateWorkout, useDeleteWorkout } from './firebase/useWorkouts';
import { useUserProfile } from './firebase/useUserProfile';
import { useFirebaseAuth } from '@/providers/FirebaseAuthProvider';
import { useMemo } from 'react';

// Mock Supabase query response format
interface SupabaseResponse<T> {
  data: T | null;
  error: any;
}

// Hook to get workouts in Supabase format
export function useSupabaseWorkouts() {
  const { workouts, isLoading, error } = useWorkouts();
  
  return useMemo(() => ({
    data: workouts,
    error,
    isLoading,
    refetch: () => {}, // No-op for now
  }), [workouts, error, isLoading]);
}

// Hook to get user profile in Supabase format
export function useSupabaseProfile() {
  const { user } = useFirebaseAuth();
  const { profile, isLoading, error } = useUserProfile();
  
  return useMemo(() => ({
    data: profile ? {
      id: user?.uid || '',
      tier: profile.tier,
      free_workouts_used: profile.freeWorkoutsUsed,
      trial_end_date: profile.trialEndDate?.toDate().toISOString() || null,
      created_at: profile.createdAt?.toDate().toISOString() || new Date().toISOString(),
      updated_at: profile.updatedAt?.toDate().toISOString() || new Date().toISOString(),
    } : null,
    error,
    isLoading,
  }), [profile, user, error, isLoading]);
}

// Hook for creating workouts in Supabase format
export function useSupabaseCreateWorkout() {
  const { createWorkout, isCreating, error } = useCreateWorkout();
  
  const mutate = async (workout: any): Promise<SupabaseResponse<any>> => {
    try {
      const workoutId = await createWorkout({
        day: workout.day || '',
        warmup: workout.warmup || '',
        workout: workout.workout || workout.wod || '',
        strength: workout.strength,
        notes: workout.notes,
        description: workout.description,
        title: workout.title,
      });
      return { data: { id: workoutId }, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  };
  
  return {
    mutateAsync: mutate,
    isLoading: isCreating,
    error,
  };
}

// Hook for generated workouts compatibility
export function useGeneratedWorkouts() {
  const { workouts, isLoading, error } = useWorkouts();
  
  // Transform Firebase workouts to match generated_workouts format
  const generatedWorkouts = useMemo(() => 
    workouts.filter(w => w.workoutData).map(w => ({
      id: w.id,
      user_id: '', // Will be filled by Firebase auth
      workout_data: w.workoutData,
      title: w.title,
      summary: w.summary,
      difficulty_level: w.difficultyLevel,
      equipment_needed: w.equipmentNeeded,
      estimated_duration_minutes: w.estimatedDurationMinutes,
      target_muscle_groups: w.targetMuscleGroups,
      tags: w.tags,
      is_favorite: w.isFavorite,
      scheduled_date: w.scheduledDate?.toDate().toISOString(),
      generated_at: w.createdAt?.toDate().toISOString(),
    })), [workouts]);
  
  return {
    data: generatedWorkouts,
    error,
    isLoading,
  };
}