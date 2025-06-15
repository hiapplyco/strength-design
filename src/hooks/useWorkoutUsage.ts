
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface WorkoutUsage {
  free_workouts_used: number;
  free_workouts_remaining: number;
  can_generate_workout: boolean;
  needs_subscription: boolean;
}

export const useWorkoutUsage = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workoutUsage, isLoading } = useQuery({
    queryKey: ['workout-usage', session?.user?.id],
    queryFn: async (): Promise<WorkoutUsage> => {
      if (!session?.user) {
        return {
          free_workouts_used: 0,
          free_workouts_remaining: 3,
          can_generate_workout: false,
          needs_subscription: false,
        };
      }

      // Get user's profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('free_workouts_used')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching workout usage:', error);
        throw error;
      }

      const freeWorkoutsUsed = profile?.free_workouts_used || 0;
      const freeWorkoutsRemaining = Math.max(0, 3 - freeWorkoutsUsed);

      // Check subscription status
      const { data: subscriptionData } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const isSubscribed = subscriptionData?.subscribed || false;
      const canGenerateWorkout = isSubscribed || freeWorkoutsRemaining > 0;
      const needsSubscription = !isSubscribed && freeWorkoutsRemaining === 0;

      return {
        free_workouts_used: freeWorkoutsUsed,
        free_workouts_remaining: freeWorkoutsRemaining,
        can_generate_workout: canGenerateWorkout,
        needs_subscription: needsSubscription,
      };
    },
    enabled: !!session?.user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const incrementUsageMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ 
          free_workouts_used: (workoutUsage?.free_workouts_used || 0) + 1 
        })
        .eq('id', session.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-usage'] });
    },
    onError: (error: any) => {
      console.error('Error incrementing workout usage:', error);
      toast({
        title: "Error",
        description: "Failed to update workout usage",
        variant: "destructive",
      });
    },
  });

  return {
    workoutUsage,
    isLoading,
    incrementUsage: incrementUsageMutation.mutate,
    isIncrementing: incrementUsageMutation.isPending,
  };
};
