
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useExerciseEntries = (nutritionLogId?: string, mealGroup?: string) => {
  const { data: exerciseEntries, isLoading } = useQuery({
    queryKey: ['exercise-entries', nutritionLogId, mealGroup],
    queryFn: async () => {
      if (!nutritionLogId || !mealGroup) return [];

      const { data, error } = await supabase
        .from('exercise_entries')
        .select('*')
        .eq('nutrition_log_id', nutritionLogId)
        .eq('meal_group', mealGroup)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!nutritionLogId && !!mealGroup
  });

  return {
    exerciseEntries,
    isLoading
  };
};
