import { workoutQueries } from "@/lib/firebase/db";
import { auth } from "@/lib/firebase/config";
import type { Exercise } from "@/components/exercise-search/types";
import type { WeatherData } from "@/types/weather";

interface WorkoutDay {
  description: string;
  warmup: string;
  workout: string;
  strength: string;
  notes?: string;
}

export type WeeklyWorkouts = Record<string, WorkoutDay>;

export interface WorkoutGenerationParams {
  prompt: string;
  numberOfDays: number;
  numberOfCycles: number;
  weatherPrompt?: string;
  selectedExercises: Exercise[];
  fitnessLevel: string;
  prescribedExercises?: string;
  injuries?: string;
  weatherData?: WeatherData;
}

const validateWorkoutDay = (
  day: WorkoutDay,
  dayNumber: number,
  params: WorkoutGenerationParams
) => {
  // Basic structure validation
  if (!day.description || !day.workout) {
    throw new Error(`Day ${dayNumber} missing required fields`);
  }

  // Fitness level validation
  if (!day.description.toLowerCase().includes(params.fitnessLevel.toLowerCase())) {
    throw new Error(`Day ${dayNumber} missing fitness level context`);
  }

  // Selected exercises validation
  if (params.selectedExercises?.length) {
    const includedExercises = params.selectedExercises.filter(e => 
      day.workout.toLowerCase().includes(e.name.toLowerCase())
    );
    if (includedExercises.length < Math.min(2, params.selectedExercises.length)) {
      throw new Error(`Day ${dayNumber} missing required exercises`);
    }
  }

  // Injury validation
  if (params.injuries) {
    const injuryKeywords = params.injuries.toLowerCase().split(/[,\s]+/);
    const hasInjuryConsideration = injuryKeywords.some(keyword =>
      day.description.toLowerCase().includes(keyword) ||
      day.notes?.toLowerCase().includes(keyword) ||
      day.workout.toLowerCase().includes("modify") ||
      day.workout.toLowerCase().includes("alternative")
    );
    if (!hasInjuryConsideration) {
      throw new Error(`Day ${dayNumber} doesn't account for injuries`);
    }
  }

  // Weather validation
  if (params.weatherData) {
    const hasWeatherConsideration = 
      day.description.toLowerCase().includes("indoor") ||
      day.description.toLowerCase().includes("outdoor") ||
      day.description.toLowerCase().includes("weather") ||
      day.description.toLowerCase().includes("rain") ||
      day.description.toLowerCase().includes("cold") ||
      day.description.toLowerCase().includes("hot");
    if (!hasWeatherConsideration) {
      throw new Error(`Day ${dayNumber} doesn't consider weather conditions`);
    }
  }
};

export const validateWeeklyWorkouts = (
  workouts: WeeklyWorkouts | null,
  params: WorkoutGenerationParams
): WeeklyWorkouts => {
  if (!workouts || typeof workouts !== 'object') {
    throw new Error("Invalid workout structure");
  }

  const expectedDays = Array.from({ length: params.numberOfDays }, (_, i) => `day${i + 1}`);
  
  expectedDays.forEach((dayKey, index) => {
    if (!workouts[dayKey]) {
      throw new Error(`Missing ${dayKey} in workout plan`);
    }
    validateWorkoutDay(workouts[dayKey], index + 1, params);
  });

  return workouts;
};

export const saveWorkoutNoAuth = async (workouts: WeeklyWorkouts) => {
  console.log("Saving workouts:", workouts);
  
  // Get current user
  const user = auth.currentUser;
  if (!user) {
    console.error("No authenticated user found");
    return false;
  }

  const workoutPromises = Object.entries(workouts).map(async ([day, workout]) => {
    try {
      await workoutQueries.createWorkout(user.uid, {
        day,
        warmup: workout.warmup,
        workout: workout.workout,
        notes: workout.notes,
        strength: workout.strength,
        description: workout.description
      });
    } catch (error) {
      console.error(`Error saving workout for ${day}:`, error);
      throw error;
    }
  });

  try {
    await Promise.all(workoutPromises);
    console.log("Successfully saved all workouts");
    return true;
  } catch (error) {
    console.error("Error saving workouts:", error);
    return false;
  }
};