/**
 * Global Search Context Management
 * Manages search state, history, and context across the app
 * Feeds into AI chat for workout program creation
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SearchContext = createContext();

const STORAGE_KEYS = {
  SEARCH_HISTORY: '@search_history',
  SELECTED_EXERCISES: '@selected_exercises',
  SELECTED_FOODS: '@selected_foods',
  WORKOUT_CONTEXT: '@workout_context',
};

export function SearchProvider({ children }) {
  // Search state
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [workoutContext, setWorkoutContext] = useState({
    goals: [],
    experience: null,
    equipment: [],
    schedule: null,
    preferences: {},
    nutrition: {},
  });
  
  // Recent searches for quick access
  const [recentExerciseSearches, setRecentExerciseSearches] = useState([]);
  const [recentFoodSearches, setRecentFoodSearches] = useState([]);
  
  // Load saved data on mount
  useEffect(() => {
    loadSavedData();
  }, []);
  
  const loadSavedData = async () => {
    try {
      const [history, exercises, foods, context] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.SELECTED_EXERCISES),
        AsyncStorage.getItem(STORAGE_KEYS.SELECTED_FOODS),
        AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_CONTEXT),
      ]);
      
      if (history) setSearchHistory(JSON.parse(history));
      if (exercises) setSelectedExercises(JSON.parse(exercises));
      if (foods) setSelectedFoods(JSON.parse(foods));
      if (context) setWorkoutContext(JSON.parse(context));
    } catch (error) {
      console.error('Error loading search context:', error);
    }
  };
  
  // Save data whenever it changes
  const saveData = useCallback(async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving search context:', error);
    }
  }, []);
  
  // Add to search history
  const addToHistory = useCallback((query, type, results) => {
    const newEntry = {
      query,
      type,
      timestamp: Date.now(),
      resultCount: results.length,
    };
    
    const updatedHistory = [newEntry, ...searchHistory.slice(0, 49)];
    setSearchHistory(updatedHistory);
    saveData(STORAGE_KEYS.SEARCH_HISTORY, updatedHistory);
    
    // Update recent searches
    if (type === 'exercise') {
      setRecentExerciseSearches(prev => [query, ...prev.filter(q => q !== query)].slice(0, 5));
    } else if (type === 'nutrition') {
      setRecentFoodSearches(prev => [query, ...prev.filter(q => q !== query)].slice(0, 5));
    }
  }, [searchHistory, saveData]);
  
  // Add exercise to selection
  const addExercise = useCallback((exercise) => {
    const updatedExercises = [...selectedExercises, exercise];
    setSelectedExercises(updatedExercises);
    saveData(STORAGE_KEYS.SELECTED_EXERCISES, updatedExercises);
  }, [selectedExercises, saveData]);
  
  // Remove exercise from selection
  const removeExercise = useCallback((exerciseId) => {
    const updatedExercises = selectedExercises.filter(e => e.id !== exerciseId);
    setSelectedExercises(updatedExercises);
    saveData(STORAGE_KEYS.SELECTED_EXERCISES, updatedExercises);
  }, [selectedExercises, saveData]);
  
  // Add food to selection
  const addFood = useCallback((food) => {
    const updatedFoods = [...selectedFoods, food];
    setSelectedFoods(updatedFoods);
    saveData(STORAGE_KEYS.SELECTED_FOODS, updatedFoods);
  }, [selectedFoods, saveData]);
  
  // Remove food from selection
  const removeFood = useCallback((foodId) => {
    const updatedFoods = selectedFoods.filter(f => f.id !== foodId);
    setSelectedFoods(updatedFoods);
    saveData(STORAGE_KEYS.SELECTED_FOODS, updatedFoods);
  }, [selectedFoods, saveData]);
  
  // Update workout context
  const updateWorkoutContext = useCallback((updates) => {
    const updatedContext = { ...workoutContext, ...updates };
    setWorkoutContext(updatedContext);
    saveData(STORAGE_KEYS.WORKOUT_CONTEXT, updatedContext);
  }, [workoutContext, saveData]);
  
  // Clear all selections
  const clearSelections = useCallback(() => {
    setSelectedExercises([]);
    setSelectedFoods([]);
    saveData(STORAGE_KEYS.SELECTED_EXERCISES, []);
    saveData(STORAGE_KEYS.SELECTED_FOODS, []);
  }, [saveData]);
  
  // Get context for AI chat
  const getAIChatContext = useCallback(() => {
    return {
      selectedExercises,
      selectedFoods,
      workoutContext,
      recentSearches: {
        exercises: recentExerciseSearches,
        foods: recentFoodSearches,
      },
      preferences: {
        hasExercisePreferences: selectedExercises.length > 0,
        hasNutritionPreferences: selectedFoods.length > 0,
        ...workoutContext.preferences,
      },
    };
  }, [selectedExercises, selectedFoods, workoutContext, recentExerciseSearches, recentFoodSearches]);
  
  // Get exercise recommendations based on context
  const getExerciseRecommendations = useCallback(() => {
    const recommendations = [];
    
    // Based on selected exercises, suggest complementary ones
    if (selectedExercises.length > 0) {
      const muscleGroups = [...new Set(selectedExercises.flatMap(e => e.muscleGroups || []))];
      recommendations.push({
        type: 'complementary',
        message: `Add exercises for balance: ${muscleGroups.join(', ')}`,
        exercises: [],
      });
    }
    
    // Based on goals
    if (workoutContext.goals.includes('strength')) {
      recommendations.push({
        type: 'goal',
        message: 'Recommended for strength training',
        exercises: ['bench press', 'squat', 'deadlift'],
      });
    }
    
    if (workoutContext.goals.includes('cardio')) {
      recommendations.push({
        type: 'goal',
        message: 'Recommended for cardio fitness',
        exercises: ['running', 'cycling', 'rowing'],
      });
    }
    
    return recommendations;
  }, [selectedExercises, workoutContext]);
  
  const value = {
    // State
    searchHistory,
    selectedExercises,
    selectedFoods,
    workoutContext,
    recentExerciseSearches,
    recentFoodSearches,
    
    // Actions
    addToHistory,
    addExercise,
    removeExercise,
    addFood,
    removeFood,
    updateWorkoutContext,
    clearSelections,
    getAIChatContext,
    getExerciseRecommendations,
  };
  
  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within SearchProvider');
  }
  return context;
}