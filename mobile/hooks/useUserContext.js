import { useContext, useCallback, useMemo } from 'react';
import { useUserContext as useUserContextProvider } from '../contexts/UserContextProvider';

/**
 * Enhanced useUserContext Hook
 * 
 * Provides convenient methods and computed values for managing user context.
 * This hook extends the basic context provider with additional utilities
 * and computed properties for easier use throughout the app.
 * 
 * Features:
 * - Memoized computed values for performance
 * - Convenient helper methods
 * - Production-ready error handling
 * - Type-safe context operations
 * - Analytics integration
 */
export default function useUserContext() {
  const contextProvider = useUserContextProvider();
  
  if (!contextProvider) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }

  const {
    userContext,
    isLoading,
    syncInProgress,
    lastSyncTime,
    updateProfile,
    updatePreferences,
    recordInteraction,
    recordContextModalShown,
    recordSkip,
    calculateContextScore,
    calculateProfileCompleteness,
    needsContextSetup,
    hasContext,
    currentUser,
    journeyStage,
    refreshContext,
    resetContext,
  } = contextProvider;

  // Define all callbacks at the top level of the hook - OUTSIDE of useMemo
  // This fixes the React Hooks violations where useCallback was inside useMemo

  // Profile management callbacks
  const setFitnessLevel = useCallback(async (level) => {
    const validLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validLevels.includes(level)) {
      throw new Error(`Invalid fitness level: ${level}`);
    }
    
    await updateProfile({ fitnessLevel: level });
    await recordInteraction('profile_setup', { field: 'fitnessLevel', value: level });
  }, [updateProfile, recordInteraction]);

  const addGoal = useCallback(async (goal) => {
    const currentGoals = userContext.profile.goals || [];
    if (!currentGoals.includes(goal)) {
      await updateProfile({ goals: [...currentGoals, goal] });
      await recordInteraction('profile_setup', { field: 'goals', action: 'add', value: goal });
    }
  }, [userContext.profile.goals, updateProfile, recordInteraction]);

  const removeGoal = useCallback(async (goal) => {
    const currentGoals = userContext.profile.goals || [];
    const updatedGoals = currentGoals.filter(g => g !== goal);
    await updateProfile({ goals: updatedGoals });
    await recordInteraction('profile_setup', { field: 'goals', action: 'remove', value: goal });
  }, [userContext.profile.goals, updateProfile, recordInteraction]);

  const setWorkoutDuration = useCallback(async (minutes) => {
    if (typeof minutes !== 'number' || minutes < 5 || minutes > 180) {
      throw new Error('Workout duration must be between 5 and 180 minutes');
    }
    
    await updateProfile({ preferredWorkoutDuration: minutes });
    await recordInteraction('profile_setup', { field: 'duration', value: minutes });
  }, [updateProfile, recordInteraction]);

  const setWorkoutFrequency = useCallback(async (frequency) => {
    if (typeof frequency !== 'number' || frequency < 1 || frequency > 7) {
      throw new Error('Workout frequency must be between 1 and 7 days per week');
    }
    
    await updateProfile({ workoutFrequency: frequency });
    await recordInteraction('profile_setup', { field: 'frequency', value: frequency });
  }, [updateProfile, recordInteraction]);

  const addEquipment = useCallback(async (equipment) => {
    const currentEquipment = userContext.profile.equipment || [];
    if (!currentEquipment.includes(equipment)) {
      await updateProfile({ equipment: [...currentEquipment, equipment] });
    }
  }, [userContext.profile.equipment, updateProfile]);

  const removeEquipment = useCallback(async (equipment) => {
    const currentEquipment = userContext.profile.equipment || [];
    const updatedEquipment = currentEquipment.filter(e => e !== equipment);
    await updateProfile({ equipment: updatedEquipment });
  }, [userContext.profile.equipment, updateProfile]);

  // Preference management callbacks
  const addFavoriteExercise = useCallback(async (exerciseId) => {
    const currentFavorites = userContext.preferences.favoriteExercises || [];
    if (!currentFavorites.includes(exerciseId)) {
      await updatePreferences({ 
        favoriteExercises: [...currentFavorites, exerciseId] 
      });
      await recordInteraction('exercise_favorited', { exerciseId });
    }
  }, [userContext.preferences.favoriteExercises, updatePreferences, recordInteraction]);

  const removeFavoriteExercise = useCallback(async (exerciseId) => {
    const currentFavorites = userContext.preferences.favoriteExercises || [];
    const updatedFavorites = currentFavorites.filter(id => id !== exerciseId);
    await updatePreferences({ favoriteExercises: updatedFavorites });
    await recordInteraction('exercise_unfavorited', { exerciseId });
  }, [userContext.preferences.favoriteExercises, updatePreferences, recordInteraction]);

  const addDislikedExercise = useCallback(async (exerciseId) => {
    const currentDislikes = userContext.preferences.dislikedExercises || [];
    if (!currentDislikes.includes(exerciseId)) {
      await updatePreferences({ 
        dislikedExercises: [...currentDislikes, exerciseId] 
      });
      await recordInteraction('exercise_disliked', { exerciseId });
    }
  }, [userContext.preferences.dislikedExercises, updatePreferences, recordInteraction]);

  const setWorkoutIntensity = useCallback(async (intensity) => {
    const validIntensities = ['low', 'moderate', 'high'];
    if (!validIntensities.includes(intensity)) {
      throw new Error(`Invalid intensity: ${intensity}`);
    }
    
    await updatePreferences({ workoutIntensity: intensity });
    await recordInteraction('preference_updated', { field: 'intensity', value: intensity });
  }, [updatePreferences, recordInteraction]);

  const addPreferredMuscleGroup = useCallback(async (muscleGroup) => {
    const current = userContext.preferences.preferredMuscleGroups || [];
    if (!current.includes(muscleGroup)) {
      await updatePreferences({ 
        preferredMuscleGroups: [...current, muscleGroup] 
      });
    }
  }, [userContext.preferences.preferredMuscleGroups, updatePreferences]);

  const removePreferredMuscleGroup = useCallback(async (muscleGroup) => {
    const current = userContext.preferences.preferredMuscleGroups || [];
    const updated = current.filter(mg => mg !== muscleGroup);
    await updatePreferences({ preferredMuscleGroups: updated });
  }, [userContext.preferences.preferredMuscleGroups, updatePreferences]);

  // Tracking callbacks
  const trackGeneratorUse = useCallback(async (metadata = {}) => {
    await recordInteraction('generator_used', metadata);
  }, [recordInteraction]);

  const trackSearch = useCallback(async (searchTerm, filters = {}) => {
    await recordInteraction('exercise_searched', { searchTerm, filters });
  }, [recordInteraction]);

  const trackWorkoutCompletion = useCallback(async (workoutId, duration, metadata = {}) => {
    await recordInteraction('workout_completed', { 
      workoutId, 
      duration, 
      ...metadata 
    });
  }, [recordInteraction]);

  const trackProfileView = useCallback(async () => {
    await recordInteraction('profile_viewed');
  }, [recordInteraction]);

  const trackOnboardingComplete = useCallback(async () => {
    await updateProfile({ onboardingCompleted: true });
    await recordInteraction('onboarding_completed');
  }, [updateProfile, recordInteraction]);

  // Memoized computed values for performance
  const computedValues = useMemo(() => {
    const contextScore = calculateContextScore();
    const profileCompleteness = calculateProfileCompleteness();
    
    return {
      contextScore,
      profileCompleteness,
      
      // Context readiness checks
      isProfileReady: profileCompleteness >= 50,
      isContextReady: contextScore >= 30,
      isFullySetup: contextScore >= 70,
      
      // User engagement metrics
      isNewUser: journeyStage === 'new',
      isExploringUser: journeyStage === 'exploring',
      isEngagedUser: journeyStage === 'engaged',
      isExperiencedUser: journeyStage === 'experienced',
      
      // Content personalization readiness
      canPersonalizeWorkouts: contextScore >= 40,
      canShowAdvancedFeatures: contextScore >= 60,
      shouldShowOnboarding: contextScore < 20 && !userContext.analytics.onboardingCompleted,
      
      // Interaction insights
      hasUsedApp: userContext.interactions.generatorUsageCount > 0 || 
                   userContext.interactions.searchCount > 0,
      isActiveUser: userContext.interactions.workoutCompletions > 2,
      needsReengagement: (() => {
        const lastActive = userContext.interactions.lastActiveDate;
        if (!lastActive) return false;
        
        const daysSinceActive = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceActive > 7; // More than a week inactive
      })(),
    };
  }, [
    userContext,
    calculateContextScore,
    calculateProfileCompleteness,
    journeyStage,
  ]);

  // Now create memoized objects that reference the callbacks defined above
  const profileHelpers = useMemo(() => ({
    setFitnessLevel,
    addGoal,
    removeGoal,
    setWorkoutDuration,
    setWorkoutFrequency,
    addEquipment,
    removeEquipment,
  }), [
    setFitnessLevel,
    addGoal,
    removeGoal,
    setWorkoutDuration,
    setWorkoutFrequency,
    addEquipment,
    removeEquipment,
  ]);

  const preferenceHelpers = useMemo(() => ({
    addFavoriteExercise,
    removeFavoriteExercise,
    addDislikedExercise,
    setWorkoutIntensity,
    addPreferredMuscleGroup,
    removePreferredMuscleGroup,
  }), [
    addFavoriteExercise,
    removeFavoriteExercise,
    addDislikedExercise,
    setWorkoutIntensity,
    addPreferredMuscleGroup,
    removePreferredMuscleGroup,
  ]);

  const trackingHelpers = useMemo(() => ({
    trackGeneratorUse,
    trackSearch,
    trackWorkoutCompletion,
    trackProfileView,
    trackOnboardingComplete,
  }), [
    trackGeneratorUse,
    trackSearch,
    trackWorkoutCompletion,
    trackProfileView,
    trackOnboardingComplete,
  ]);

  // Context readiness utilities
  const contextUtils = useMemo(() => ({
    // Get personalization recommendations
    getPersonalizationTips: () => {
      const tips = [];
      
      if (!userContext.profile.fitnessLevel) {
        tips.push({
          type: 'profile',
          message: 'Add your fitness level to get appropriate workout difficulty',
          action: 'setFitnessLevel',
          priority: 'high',
        });
      }
      
      if (!userContext.profile.goals?.length) {
        tips.push({
          type: 'profile',
          message: 'Set your fitness goals to get targeted workouts',
          action: 'addGoals',
          priority: 'high',
        });
      }
      
      if (!userContext.preferences.favoriteExercises?.length && computedValues.hasUsedApp) {
        tips.push({
          type: 'preferences',
          message: 'Like some exercises to get similar recommendations',
          action: 'exploreExercises',
          priority: 'medium',
        });
      }
      
      return tips.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    },

    // Get context summary for AI prompts
    getContextSummary: () => {
      const { profile, preferences, interactions } = userContext;
      
      const summary = {
        profile: {
          fitnessLevel: profile.fitnessLevel,
          goals: profile.goals,
          duration: profile.preferredWorkoutDuration,
          frequency: profile.workoutFrequency,
          equipment: profile.equipment,
          limitations: profile.limitations,
        },
        preferences: {
          intensity: preferences.workoutIntensity,
          favoriteCount: preferences.favoriteExercises?.length || 0,
          muscleGroups: preferences.preferredMuscleGroups,
        },
        experience: {
          workoutsCompleted: interactions.workoutCompletions,
          journeyStage,
          isNewUser: computedValues.isNewUser,
        },
      };
      
      return summary;
    },

    // Check if specific features should be available
    shouldShowFeature: (featureName) => {
      const features = {
        'advanced_metrics': computedValues.isExperiencedUser,
        'social_features': computedValues.contextScore >= 50,
        'ai_coaching': computedValues.canPersonalizeWorkouts,
        'custom_programs': computedValues.isFullySetup,
        'progress_tracking': computedValues.hasUsedApp,
      };
      
      return features[featureName] || false;
    },
  }), [userContext, computedValues, journeyStage]);

  // Return enhanced context with all helpers and computed values
  return {
    // Original context provider values
    userContext,
    isLoading,
    syncInProgress,
    lastSyncTime,
    currentUser,
    journeyStage,
    
    // Computed values
    ...computedValues,
    
    // Helper functions
    profile: profileHelpers,
    preferences: preferenceHelpers,
    tracking: trackingHelpers,
    utils: contextUtils,
    
    // Original methods
    updateProfile,
    updatePreferences,
    recordInteraction,
    recordContextModalShown,
    recordSkip,
    calculateContextScore,
    calculateProfileCompleteness,
    needsContextSetup,
    hasContext,
    refreshContext,
    resetContext,
    
    // Quick access methods
    markOnboardingComplete: trackingHelpers.trackOnboardingComplete,
    getPersonalizationLevel: () => {
      if (computedValues.contextScore >= 70) return 'high';
      if (computedValues.contextScore >= 40) return 'medium';
      if (computedValues.contextScore >= 20) return 'low';
      return 'none';
    },
  };
}

// Export type definitions for TypeScript users (if using TypeScript)
export const CONTEXT_LEVELS = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const JOURNEY_STAGES = {
  NEW: 'new',
  EXPLORING: 'exploring',
  ENGAGED: 'engaged',
  EXPERIENCED: 'experienced',
};