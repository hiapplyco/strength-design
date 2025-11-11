
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AddExerciseEntryParams {
  exerciseName: string;
  durationMinutes: number;
  caloriesBurned: number;
  mealGroup: string;
  date: Date;
  workoutData?: any;
}

export const useAddExerciseEntry = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (params: AddExerciseEntryParams) => {
      if (!session?.user) throw new Error('Not authenticated');

      const { exerciseName, durationMinutes, caloriesBurned, mealGroup, date, workoutData } = params;
      const dateString = format(date, 'yyyy-MM-dd');

      // Get or create nutrition log for the date
      let { data: log, error: logError } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date', dateString)
        .single();

      if (logError && logError.code === 'PGRST116') {
        // Create new log if doesn't exist
        const { data: newLog, error: createError } = await supabase
          .from('nutrition_logs')
          .insert({
            user_id: session.user.id,
            date: dateString,
            water_consumed_ml: 0
          })
          .select()
          .single();

        if (createError) throw createError;
        log = newLog;
      } else if (logError) {
        throw logError;
      }

      // Add exercise entry
      const { data, error } = await supabase
        .from('exercise_entries')
        .insert({
          nutrition_log_id: log.id,
          exercise_name: exerciseName,
          duration_minutes: durationMinutes,
          calories_burned: caloriesBurned,
          meal_group: mealGroup,
          workout_data: workoutData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['nutrition-log'] });
      queryClient.invalidateQueries({ queryKey: ['meal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['exercise-entries'] });
      
      toast({
        title: "Success",
        description: "Exercise added to diary successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Error adding exercise:', error);
      toast({
        title: "Error",
        description: "Failed to add exercise to diary. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    addExerciseEntry: mutation.mutateAsync,
    isLoading: mutation.isPending
  };
};
