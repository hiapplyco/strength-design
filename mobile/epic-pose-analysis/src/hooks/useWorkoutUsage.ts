import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFunctions, httpsCallable } from "firebase/functions";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface WorkoutUsage {
  free_workouts_used: number;
  free_workouts_remaining: number;
  can_generate_workout: boolean;
  needs_subscription: boolean;
}

export const useWorkoutUsage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const functions = getFunctions();

  const { data: workoutUsage, isLoading } = useQuery({
    queryKey: ['workout-usage', user?.uid],
    queryFn: async (): Promise<WorkoutUsage> => {
      if (!user) {
        return {
          free_workouts_used: 0,
          free_workouts_remaining: 3,
          can_generate_workout: false,
          needs_subscription: false,
        };
      }

      // Get user's profile data
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // User profile doesn't exist yet, return defaults
        return {
          free_workouts_used: 0,
          free_workouts_remaining: 3,
          can_generate_workout: true,
          needs_subscription: false,
        };
      }

      const userData = userSnap.data();
      const freeWorkoutsUsed = userData?.free_workouts_used || 0;
      const freeWorkoutsRemaining = Math.max(0, 3 - freeWorkoutsUsed);

      // Check subscription status
      try {
        const checkSubscription = httpsCallable(functions, 'checkSubscription');
        const result = await checkSubscription();
        const subscriptionData = result.data as any;
        
        const isSubscribed = subscriptionData?.subscribed || false;
        const canGenerateWorkout = isSubscribed || freeWorkoutsRemaining > 0;
        const needsSubscription = !isSubscribed && freeWorkoutsRemaining === 0;

        return {
          free_workouts_used: freeWorkoutsUsed,
          free_workouts_remaining: freeWorkoutsRemaining,
          can_generate_workout: canGenerateWorkout,
          needs_subscription: needsSubscription,
        };
      } catch (error) {
        console.error('Error checking subscription:', error);
        // If subscription check fails, fall back to free tier limits
        return {
          free_workouts_used: freeWorkoutsUsed,
          free_workouts_remaining: freeWorkoutsRemaining,
          can_generate_workout: freeWorkoutsRemaining > 0,
          needs_subscription: freeWorkoutsRemaining === 0,
        };
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const incrementUsageMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 
        free_workouts_used: (workoutUsage?.free_workouts_used || 0) + 1,
        updated_at: new Date()
      });
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