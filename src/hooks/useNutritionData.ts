
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export const useNutritionData = (date: Date) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const dateString = format(date, 'yyyy-MM-dd');

  const { data: targets } = useQuery({
    queryKey: ['nutrition-targets', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return null;

      const { data, error } = await supabase
        .from('nutrition_targets')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // Create default targets for new user
        const { data: newTargets, error: createError } = await supabase
          .from('nutrition_targets')
          .insert({
            user_id: session.user.id,
            daily_calories: 2000,
            daily_protein: 150,
            daily_carbs: 250,
            daily_fat: 65,
            daily_water_ml: 2000
          })
          .select()
          .single();

        if (createError) throw createError;
        return newTargets;
      }

      return data;
    },
    enabled: !!session?.user
  });

  const { data: nutritionLog, isLoading } = useQuery({
    queryKey: ['nutrition-log', session?.user?.id, dateString],
    queryFn: async () => {
      if (!session?.user) return null;

      // Get or create nutrition log for the date
      let { data: log, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date', dateString)
        .single();

      if (error && error.code === 'PGRST116') {
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
      } else if (error) {
        throw error;
      }

      // Get meal entries for this log
      const { data: mealEntries, error: mealsError } = await supabase
        .from('meal_entries')
        .select(`
          *,
          food_items (*)
        `)
        .eq('nutrition_log_id', log.id);

      if (mealsError) throw mealsError;

      // Calculate totals
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      mealEntries?.forEach((entry: any) => {
        const multiplier = entry.serving_multiplier;
        totalCalories += entry.food_items.calories_per_serving * multiplier;
        totalProtein += entry.food_items.protein_per_serving * multiplier;
        totalCarbs += entry.food_items.carbs_per_serving * multiplier;
        totalFat += entry.food_items.fat_per_serving * multiplier;
      });

      return {
        ...log,
        mealEntries,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat
      };
    },
    enabled: !!session?.user
  });

  return {
    nutritionLog,
    targets,
    isLoading,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-log', session?.user?.id, dateString] });
    }
  };
};
