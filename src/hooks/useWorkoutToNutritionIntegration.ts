
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSmartToast } from '@/hooks/useSmartToast';
import { format } from 'date-fns';
import type { WeeklyWorkouts, WorkoutDay, WorkoutCycle } from '@/types/fitness';
import { isWorkoutCycle, isWorkoutDay } from '@/types/fitness';

interface ExerciseExtraction {
  name: string;
  duration: number;
  calories: number;
  description?: string;
}

export const useWorkoutToNutritionIntegration = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { success, error } = useSmartToast();
  const [isAdding, setIsAdding] = useState(false);

  const extractExercisesFromWorkout = (workout: WeeklyWorkouts): ExerciseExtraction[] => {
    const exercises: ExerciseExtraction[] = [];

    Object.entries(workout)
      .filter(([key]) => key !== '_meta')
      .forEach(([key, value]) => {
        if (isWorkoutCycle(value)) {
          // Handle cycle structure
          Object.entries(value as WorkoutCycle)
            .filter(([dayKey, dayValue]) => isWorkoutDay(dayValue))
            .forEach(([dayKey, dayValue]) => {
              const dayExercises = extractFromWorkoutDay(dayKey, dayValue as WorkoutDay);
              exercises.push(...dayExercises);
            });
        } else if (isWorkoutDay(value)) {
          // Handle direct workout days
          const dayExercises = extractFromWorkoutDay(key, value as WorkoutDay);
          exercises.push(...dayExercises);
        }
      });

    return exercises;
  };

  const extractFromWorkoutDay = (dayKey: string, workout: WorkoutDay): ExerciseExtraction[] => {
    const exercises: ExerciseExtraction[] = [];
    const dayName = dayKey.replace(/day(\d+)/, 'Day $1').replace(/([A-Z])/g, ' $1').trim();

    // Extract from different sections
    if (workout.warmup) {
      exercises.push({
        name: `${dayName} - Warmup`,
        duration: 10,
        calories: 50,
        description: workout.warmup.substring(0, 100) + '...'
      });
    }

    if (workout.strength) {
      exercises.push({
        name: `${dayName} - Strength Training`,
        duration: 25,
        calories: 150,
        description: workout.strength.substring(0, 100) + '...'
      });
    }

    if (workout.workout) {
      exercises.push({
        name: `${dayName} - Main Workout`,
        duration: 30,
        calories: 200,
        description: workout.workout.substring(0, 100) + '...'
      });
    }

    return exercises;
  };

  const addWorkoutToNutritionDiary = async (
    workout: WeeklyWorkouts,
    selectedDate: Date,
    mealGroup: string = 'meal 1'
  ) => {
    if (!session?.user) throw new Error('Not authenticated');

    setIsAdding(true);
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');

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

      // Extract exercises from workout
      const exercises = extractExercisesFromWorkout(workout);

      // Add each exercise to nutrition diary
      const exerciseEntries = exercises.map(exercise => ({
        nutrition_log_id: log.id,
        exercise_name: exercise.name,
        duration_minutes: exercise.duration,
        calories_burned: exercise.calories,
        meal_group: mealGroup,
        workout_data: {
          description: exercise.description,
          source: 'generated_workout',
          original_workout_title: workout._meta?.title
        }
      }));

      const { error: insertError } = await supabase
        .from('exercise_entries')
        .insert(exerciseEntries);

      if (insertError) throw insertError;

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['nutrition-log'] });
      queryClient.invalidateQueries({ queryKey: ['exercise-entries'] });

      success(`Added ${exercises.length} exercises to nutrition diary!`);
      return exercises.length;
    } catch (err) {
      console.error('Error adding workout to nutrition diary:', err);
      error(err as Error, 'Workout Integration');
      throw err;
    } finally {
      setIsAdding(false);
    }
  };

  return {
    addWorkoutToNutritionDiary,
    isAdding,
    extractExercisesFromWorkout
  };
};
