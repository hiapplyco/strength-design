import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkoutService } from '@/lib/firebase/services';
import { useFirebaseAuth } from '@/providers/FirebaseAuthProvider';
import type { Workout, WorkoutSession } from '@/lib/firebase/types';
import { useToast } from '@/hooks/use-toast';

export function useWorkouts(limit: number = 50) {
  const { user } = useFirebaseAuth();
  const { toast } = useToast();

  const { data: workouts, isLoading, error } = useQuery({
    queryKey: ['workouts', user?.uid, limit],
    queryFn: () => user ? WorkoutService.getUserWorkouts(user.uid, limit) : [],
    enabled: !!user,
  });

  return {
    workouts: workouts || [],
    isLoading,
    error,
  };
}

export function useWorkout(workoutId: string) {
  const { user } = useFirebaseAuth();

  const { data: workout, isLoading, error } = useQuery({
    queryKey: ['workout', user?.uid, workoutId],
    queryFn: () => user ? WorkoutService.getWorkout(user.uid, workoutId) : null,
    enabled: !!user && !!workoutId,
  });

  return {
    workout,
    isLoading,
    error,
  };
}

export function useFavoriteWorkouts() {
  const { user } = useFirebaseAuth();

  const { data: workouts, isLoading, error } = useQuery({
    queryKey: ['favoriteWorkouts', user?.uid],
    queryFn: () => user ? WorkoutService.getFavoriteWorkouts(user.uid) : [],
    enabled: !!user,
  });

  return {
    workouts: workouts || [],
    isLoading,
    error,
  };
}

export function useCreateWorkout() {
  const { user } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!user) throw new Error('No user logged in');
      return WorkoutService.createWorkout(user.uid, workout);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', user?.uid] });
      toast({
        title: "Workout created",
        description: "Your workout has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create workout. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    createWorkout: mutation.mutate,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}

export function useUpdateWorkout() {
  const { user } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: ({ workoutId, data }: { workoutId: string; data: Partial<Workout> }) => {
      if (!user) throw new Error('No user logged in');
      return WorkoutService.updateWorkout(user.uid, workoutId, data);
    },
    onSuccess: (_, { workoutId }) => {
      queryClient.invalidateQueries({ queryKey: ['workout', user?.uid, workoutId] });
      queryClient.invalidateQueries({ queryKey: ['workouts', user?.uid] });
      toast({
        title: "Workout updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update workout. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    updateWorkout: mutation.mutate,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}

export function useDeleteWorkout() {
  const { user } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (workoutId: string) => {
      if (!user) throw new Error('No user logged in');
      return WorkoutService.deleteWorkout(user.uid, workoutId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', user?.uid] });
      toast({
        title: "Workout deleted",
        description: "The workout has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete workout. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    deleteWorkout: mutation.mutate,
    isDeleting: mutation.isPending,
    error: mutation.error,
  };
}

export function useToggleFavorite() {
  const { user } = useFirebaseAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (workoutId: string) => {
      if (!user) throw new Error('No user logged in');
      return WorkoutService.toggleFavorite(user.uid, workoutId);
    },
    onSuccess: (_, workoutId) => {
      queryClient.invalidateQueries({ queryKey: ['workout', user?.uid, workoutId] });
      queryClient.invalidateQueries({ queryKey: ['workouts', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['favoriteWorkouts', user?.uid] });
    },
  });

  return {
    toggleFavorite: mutation.mutate,
    isToggling: mutation.isPending,
  };
}

export function useWorkoutSessions(days: number = 7) {
  const { user } = useFirebaseAuth();

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['workoutSessions', user?.uid, days],
    queryFn: () => user ? WorkoutService.getUpcomingWorkoutSessions(user.uid, days) : [],
    enabled: !!user,
  });

  return {
    sessions: sessions || [],
    isLoading,
    error,
  };
}

export function useCreateWorkoutSession() {
  const { user } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (session: Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!user) throw new Error('No user logged in');
      return WorkoutService.createWorkoutSession(user.uid, session);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutSessions', user?.uid] });
      toast({
        title: "Session scheduled",
        description: "Your workout session has been scheduled.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to schedule session. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    createSession: mutation.mutate,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
}

export function useCompleteWorkoutSession() {
  const { user } = useFirebaseAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: ({ 
      sessionId, 
      data 
    }: { 
      sessionId: string; 
      data: Parameters<typeof WorkoutService.completeWorkoutSession>[2] 
    }) => {
      if (!user) throw new Error('No user logged in');
      return WorkoutService.completeWorkoutSession(user.uid, sessionId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutSessions', user?.uid] });
      toast({
        title: "Workout completed!",
        description: "Great job finishing your workout!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete workout. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    completeSession: mutation.mutate,
    isCompleting: mutation.isPending,
    error: mutation.error,
  };
}

export function useWorkoutStats() {
  const { user } = useFirebaseAuth();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['workoutStats', user?.uid],
    queryFn: () => user ? WorkoutService.getWorkoutStats(user.uid) : null,
    enabled: !!user,
  });

  return {
    stats,
    isLoading,
    error,
  };
}