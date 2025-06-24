
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export const useNutritionData = (date: Date) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const dateString = format(date, 'yyyy-MM-dd');

  // Get or create nutrition log for the date
  const { data: nutritionLog, isLoading: isLoadingLog } = useQuery({
    queryKey: ['nutrition-log', session?.user?.id, dateString],
    queryFn: async () => {
      if (!session?.user) throw new Error('User not authenticated');

      // Try to get existing log
      let { data: existingLog, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date', dateString)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If no log exists, create one
      if (!existingLog) {
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
        existingLog = newLog;
      }

      return existingLog;
    },
    enabled: !!session?.user?.id,
  });

  // Get nutrition targets
  const { data: targets, isLoading: isLoadingTargets } = useQuery({
    queryKey: ['nutrition-targets', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) throw new Error('User not authenticated');

      let { data: existingTargets, error } = await supabase
        .from('nutrition_targets')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If no targets exist, create default ones
      if (!existingTargets) {
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
        existingTargets = newTargets;
      }

      return existingTargets;
    },
    enabled: !!session?.user?.id,
  });

  const isLoading = isLoadingLog || isLoadingTargets;

  return {
    nutritionLog,
    targets,
    isLoading
  };
};
