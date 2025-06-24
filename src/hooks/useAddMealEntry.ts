
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import type { NormalizedFood } from '@/services/usdaApi';

interface AddMealEntryParams {
  foodId?: string;
  usdaFood?: NormalizedFood;
  mealGroup: string;
  date: Date;
  amount: number;
  servingMultiplier: number;
}

export const useAddMealEntry = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ foodId, usdaFood, mealGroup, date, amount, servingMultiplier }: AddMealEntryParams) => {
      if (!session?.user) throw new Error('Not authenticated');

      let finalFoodId = foodId;

      // If it's a USDA food, save it to our local database first
      if (usdaFood && usdaFood.data_source === 'usda') {
        const { data: existingFood, error: searchError } = await supabase
          .from('food_items')
          .select('id')
          .eq('usda_fdc_id', usdaFood.usda_fdc_id)
          .single();

        if (searchError && searchError.code !== 'PGRST116') {
          throw searchError;
        }

        if (existingFood) {
          finalFoodId = existingFood.id.toString();
        } else {
          // Save USDA food to our local database
          const { data: newFood, error: insertError } = await supabase
            .from('food_items')
            .insert({
              name: usdaFood.name,
              brand: usdaFood.brand,
              calories_per_serving: usdaFood.calories_per_serving,
              protein_per_serving: usdaFood.protein_per_serving,
              carbs_per_serving: usdaFood.carbs_per_serving,
              fat_per_serving: usdaFood.fat_per_serving,
              fiber_per_serving: usdaFood.fiber_per_serving,
              serving_size: usdaFood.serving_size,
              serving_unit: usdaFood.serving_unit,
              usda_fdc_id: usdaFood.usda_fdc_id
            })
            .select()
            .single();

          if (insertError) throw insertError;
          finalFoodId = newFood.id.toString();
        }
      }

      if (!finalFoodId) throw new Error('No food ID available');

      // Get or create nutrition log for the date
      const dateString = date.toISOString().split('T')[0];
      let { data: nutritionLog, error } = await supabase
        .from('nutrition_logs')
        .select('id')
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
        nutritionLog = newLog;
      } else if (error) {
        throw error;
      }

      // Add meal entry
      const { data, error: mealError } = await supabase
        .from('meal_entries')
        .insert({
          nutrition_log_id: nutritionLog.id,
          food_item_id: parseInt(finalFoodId),
          meal_group: mealGroup,
          amount,
          serving_multiplier: servingMultiplier
        })
        .select()
        .single();

      if (mealError) throw mealError;
      return data;
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['nutrition-log'] });
      queryClient.invalidateQueries({ queryKey: ['meal-entries'] });
      
      toast({
        title: "Food added",
        description: "Food has been added to your diary successfully.",
      });
    },
    onError: (error) => {
      console.error('Error adding meal entry:', error);
      toast({
        title: "Error",
        description: "Failed to add food to diary. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    addMealEntry: mutation.mutate,
    isLoading: mutation.isPending
  };
};
