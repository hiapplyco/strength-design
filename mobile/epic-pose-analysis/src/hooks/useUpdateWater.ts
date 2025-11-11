
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export const useUpdateWater = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateWaterMutation = useMutation({
    mutationFn: async ({ date, amount }: { date: Date; amount: number }) => {
      if (!session?.user) throw new Error('User not authenticated');

      const dateString = format(date, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('nutrition_logs')
        .update({ water_consumed_ml: Math.max(0, amount) })
        .eq('user_id', session.user.id)
        .eq('date', dateString);

      if (error) throw error;
    },
    onSuccess: (_, { date }) => {
      const dateString = format(date, 'yyyy-MM-dd');
      queryClient.invalidateQueries({ 
        queryKey: ['nutrition-log', session?.user?.id, dateString] 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update water intake",
        variant: "destructive",
      });
    },
  });

  return {
    updateWater: updateWaterMutation.mutate,
    isUpdating: updateWaterMutation.isPending,
  };
};
