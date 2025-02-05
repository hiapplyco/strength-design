export interface WorkoutDay {
  description: string;
  warmup: string;
  workout: string;
  strength: string;
  notes?: string;
}

export type WeeklyWorkouts = Record<string, WorkoutDay>;

// Add this new type for generated workouts
export interface WorkoutData {
  [key: string]: WorkoutDay;
}