
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMealEntries = (nutritionLogId?: string, mealGroup?: string) => {
  const { data: mealEntries, isLoading } = useQuery({
    queryKey: ['meal-entries', nutritionLogId, mealGroup],
    queryFn: async () => {
      if (!nutritionLogId || !mealGroup) return [];

      const { data, error } = await supabase
        .from('meal_entries')
        .select(`
          *,
          food_items (*)
        `)
        .eq('nutrition_log_id', nutritionLogId)
        .eq('meal_group', mealGroup)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!nutritionLogId && !!mealGroup
  });

  // Calculate meal summary
  const mealSummary = React.useMemo(() => {
    if (!mealEntries?.length) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

    return mealEntries.reduce((acc, entry: any) => {
      const multiplier = entry.serving_multiplier;
      return {
        calories: acc.calories + (entry.food_items.calories_per_serving * multiplier),
        protein: acc.protein + (entry.food_items.protein_per_serving * multiplier),
        carbs: acc.carbs + (entry.food_items.carbs_per_serving * multiplier),
        fat: acc.fat + (entry.food_items.fat_per_serving * multiplier),
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [mealEntries]);

  return {
    mealEntries,
    mealSummary,
    isLoading
  };
};
