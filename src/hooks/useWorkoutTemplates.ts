
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSmartToast } from '@/hooks/useSmartToast';
import type { WeeklyWorkouts } from '@/types/fitness';

export const useWorkoutTemplates = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { success, error } = useSmartToast();

  const { data: workoutTemplates, isLoading } = useQuery({
    queryKey: ['workout-templates', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('generated_workouts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const saveWorkoutTemplate = useMutation({
    mutationFn: async (workout: WeeklyWorkouts) => {
      if (!session?.user) throw new Error('Not authenticated');

      const workoutTitle = workout._meta?.title || 'Generated Workout';
      const workoutSummary = workout._meta?.summary || '';

      const { data, error } = await supabase
        .from('generated_workouts')
        .insert({
          user_id: session.user.id,
          title: workoutTitle,
          summary: workoutSummary,
          workout_data: workout,
          estimated_duration_minutes: 60, // Default estimate
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-templates'] });
      success('Workout saved successfully!');
    },
    onError: (err: any) => {
      error(err, 'Workout Save');
    }
  });

  return {
    workoutTemplates,
    isLoading,
    saveWorkoutTemplate: saveWorkoutTemplate.mutateAsync,
    isSaving: saveWorkoutTemplate.isPending
  };
};
