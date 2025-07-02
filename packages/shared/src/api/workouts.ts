import type { SupabaseClient } from './supabase';
import type { WorkoutPlan, WorkoutTemplate } from '../types/workout';

export const workoutQueries = {
  getWorkouts: (supabase: SupabaseClient, userId: string) => ({
    queryKey: ['workouts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  }),

  getWorkout: (supabase: SupabaseClient, workoutId: string) => ({
    queryKey: ['workout', workoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .single();
      
      if (error) throw error;
      return data;
    },
  }),

  createWorkout: async (supabase: SupabaseClient, workout: WorkoutPlan & { user_id: string }) => {
    const { data, error } = await supabase
      .from('workouts')
      .insert({
        user_id: workout.user_id,
        title: workout.title,
        content: workout as any,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  updateWorkout: async (supabase: SupabaseClient, id: string, updates: Partial<WorkoutPlan>) => {
    const { data, error } = await supabase
      .from('workouts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  deleteWorkout: async (supabase: SupabaseClient, id: string) => {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};