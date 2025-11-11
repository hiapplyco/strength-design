import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService } from '@/lib/firebase/services';
import { useAuth } from './useAuth';
import type { UserProfile, FitnessProfile, NutritionSettings } from '@/lib/firebase/types';

export function useUserProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query for user profile
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['userProfile', user?.uid],
    queryFn: () => user ? UserService.getUserProfile(user.uid) : null,
    enabled: !!user,
  });

  // Mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<UserProfile>) => {
      if (!user) throw new Error('No user logged in');
      return UserService.updateUserProfile(user.uid, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.uid] });
    },
  });

  // Mutation for updating fitness profile
  const updateFitnessProfileMutation = useMutation({
    mutationFn: (data: Partial<FitnessProfile>) => {
      if (!user) throw new Error('No user logged in');
      return UserService.updateFitnessProfile(user.uid, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.uid] });
    },
  });

  // Mutation for updating nutrition settings
  const updateNutritionSettingsMutation = useMutation({
    mutationFn: (data: Partial<NutritionSettings>) => {
      if (!user) throw new Error('No user logged in');
      return UserService.updateNutritionSettings(user.uid, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.uid] });
    },
  });

  // Check pro access
  const { data: hasProAccess } = useQuery({
    queryKey: ['proAccess', user?.uid],
    queryFn: () => user ? UserService.hasProAccess(user.uid) : false,
    enabled: !!user,
  });

  return {
    profile,
    isLoading,
    error,
    hasProAccess: hasProAccess || false,
    updateProfile: updateProfileMutation.mutate,
    updateFitnessProfile: updateFitnessProfileMutation.mutate,
    updateNutritionSettings: updateNutritionSettingsMutation.mutate,
    isUpdating: updateProfileMutation.isPending || 
                updateFitnessProfileMutation.isPending || 
                updateNutritionSettingsMutation.isPending,
  };
}

// Hook for checking free workouts remaining
export function useFreeWorkoutsRemaining() {
  const { profile } = useUserProfile();
  const FREE_WORKOUT_LIMIT = 3; // Adjust as needed

  const remaining = profile ? FREE_WORKOUT_LIMIT - (profile.freeWorkoutsUsed || 0) : 0;
  const hasReachedLimit = remaining <= 0;

  return {
    remaining,
    hasReachedLimit,
    used: profile?.freeWorkoutsUsed || 0,
    limit: FREE_WORKOUT_LIMIT,
  };
}