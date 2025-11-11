
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db, auth } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
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
  const currentUser = auth.currentUser;
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
    if (!currentUser?.uid) throw new Error('Not authenticated');

    setIsAdding(true);
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');

      // Get or create nutrition log for the date
      const nutritionLogsRef = collection(db, 'nutrition_logs');
      const q = query(
        nutritionLogsRef,
        where('user_id', '==', currentUser.uid),
        where('date', '==', dateString)
      );

      const snapshot = await getDocs(q);
      let logId: string;

      if (snapshot.empty) {
        // Create new log if doesn't exist
        const newLogRef = await addDoc(nutritionLogsRef, {
          user_id: currentUser.uid,
          date: dateString,
          water_consumed_ml: 0,
          created_at: serverTimestamp(),
        });
        logId = newLogRef.id;
      } else {
        logId = snapshot.docs[0].id;
      }

      // Extract exercises from workout
      const exercises = extractExercisesFromWorkout(workout);

      // Add each exercise to nutrition diary
      const exerciseEntriesRef = collection(db, 'exercise_entries');
      await Promise.all(
        exercises.map(exercise =>
          addDoc(exerciseEntriesRef, {
            nutrition_log_id: logId,
            exercise_name: exercise.name,
            duration_minutes: exercise.duration,
            calories_burned: exercise.calories,
            meal_group: mealGroup,
            workout_data: {
              description: exercise.description,
              source: 'generated_workout',
              original_workout_title: workout._meta?.title
            },
            created_at: serverTimestamp(),
          })
        )
      );

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
