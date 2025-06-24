
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface AddMealEntryParams {
  foodId: string;
  mealGroup: string;
  date: Date;
  amount: number;
  servingMultiplier: number;
}

export const useAddMealEntry = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addMealEntryMutation = useMutation({
    mutationFn: async ({ foodId, mealGroup, date, amount, servingMultiplier }: AddMealEntryParams) => {
      if (!session?.user) throw new Error('User not authenticated');

      const dateString = format(date, 'yyyy-MM-dd');
      
      // Get or create nutrition log for the date
      let { data: log, error } = await supabase
        .from('nutrition_logs')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('date', dateString)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: newLog, error: createError } = await supabase
          .from('nutrition_logs')
          .insert({
            user_id: session.user.id,
            date: dateString,
            water_consumed_ml: 0
          })
          .select('id')
          .single();

        if (createError) throw createError;
        log = newLog;
      } else if (error) {
        throw error;
      }

      // Add meal entry
      const { error: entryError } = await supabase
        .from('meal_entries')
        .insert({
          nutrition_log_id: log.id,
          food_item_id: foodId,
          meal_group: mealGroup,
          amount: amount,
          serving_multiplier: servingMultiplier
        });

      if (entryError) throw entryError;
    },
    onSuccess: (_, { date, mealGroup }) => {
      const dateString = format(date, 'yyyy-MM-dd');
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ['nutrition-log', session?.user?.id, dateString] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['meal-entries'] 
      });

      toast({
        title: "Food added",
        description: "Successfully added to your diary",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to add food to diary",
        variant: "destructive",
      });
    },
  });

  return {
    addMealEntry: addMealEntryMutation.mutate,
    isLoading: addMealEntryMutation.isPending,
  };
};
