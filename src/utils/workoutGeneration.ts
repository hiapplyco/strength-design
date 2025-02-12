
import { supabase } from "@/integrations/supabase/client";
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
  if (!day.description.toLowerCase().includes(params.fitnessLevel.toLowerCase())) {
    throw new Error(`Day ${dayNumber} missing fitness level context`);
  }

  if (params.selectedExercises?.length) {
    const includedExercises = params.selectedExercises.filter(e => 
      day.workout.toLowerCase().includes(e.name.toLowerCase())
    );
    if (includedExercises.length < Math.min(2, params.selectedExercises.length)) {
      throw new Error(`Day ${dayNumber} missing required exercises`);
    }
  }

  if (params.injuries && !day.notes?.toLowerCase().includes(params.injuries.toLowerCase())) {
    throw new Error(`Day ${dayNumber} missing injury modifications`);
  }
};

export const generateWorkout = async (params: WorkoutGenerationParams): Promise<WeeklyWorkouts> => {
  console.log("Starting workout generation with params:", params);

  const { data, error } = await supabase.functions.invoke<WeeklyWorkouts>('generate-weekly-workouts', {
    body: params
  });

  console.log("Edge Function response:", { data, error });

  if (error) {
    console.error("Edge Function error:", error);
    throw new Error(error.message || 'Failed to generate workouts');
  }

  if (!data) {
    console.error("No data received from Edge Function");
    throw new Error("No workout data received");
  }

  // Validate that we have the correct number of days
  const expectedDays = Array.from({ length: params.numberOfDays }, (_, i) => `day${i + 1}`);
  const missingDays = expectedDays.filter(day => !data[day]);
  
  if (missingDays.length > 0) {
    console.error("Missing days in response:", missingDays);
    throw new Error(`Missing workouts for days: ${missingDays.join(', ')}`);
  }

  // Validate each day's content
  Object.entries(data).forEach(([day, workout], index) => {
    try {
      validateWorkoutDay(workout, index + 1, params);
    } catch (error) {
      console.error(`Validation error for ${day}:`, error);
      throw error;
    }
  });

  return data;
};

export const saveWorkoutNoAuth = async (workouts: WeeklyWorkouts) => {
  console.log("Saving workouts:", workouts);
  
  const workoutPromises = Object.entries(workouts).map(([day, workout]) => {
    return supabase.from('workouts').insert({
      day,
      warmup: workout.warmup,
      workout: workout.workout,
      notes: workout.notes,
      strength: workout.strength,
      description: workout.description
    });
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
