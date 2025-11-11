
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
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
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (params: AddMealEntryParams) => {
      if (!session?.user) throw new Error('Not authenticated');

      const { foodId, usdaFood, mealGroup, date, amount, servingMultiplier } = params;
      const dateString = format(date, 'yyyy-MM-dd');

      let finalFoodId = foodId;

      // If it's a USDA food, save it to our food_items table first
      if (usdaFood && !foodId) {
        const { data: savedFood, error: saveError } = await supabase
          .from('food_items')
          .insert({
            name: usdaFood.name,
            brand: usdaFood.brand,
            serving_size: usdaFood.serving_size.toString(),
            serving_unit: usdaFood.serving_unit,
            calories_per_serving: usdaFood.calories_per_serving,
            protein_per_serving: usdaFood.protein_per_serving,
            carbs_per_serving: usdaFood.carbs_per_serving,
            fat_per_serving: usdaFood.fat_per_serving,
            fiber_per_serving: usdaFood.fiber_per_serving || 0,
          })
          .select()
          .single();

        if (saveError) {
          console.error('Error saving USDA food:', saveError);
          throw saveError;
        }
        finalFoodId = savedFood.id;
      }

      if (!finalFoodId) {
        throw new Error('No food ID provided');
      }

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

      // Add meal entry
      const { data, error } = await supabase
        .from('meal_entries')
        .insert({
          nutrition_log_id: log.id,
          food_item_id: finalFoodId,
          meal_group: mealGroup,
          amount: amount,
          serving_multiplier: servingMultiplier
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
      
      toast({
        title: "Success",
        description: "Food added to diary successfully!",
      });
    },
    onError: (error: any) => {
      console.error('Error adding meal entry:', error);
      toast({
        title: "Error",
        description: "Failed to add food to diary. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    addMealEntry: mutation.mutateAsync,
    isLoading: mutation.isPending
  };
};
