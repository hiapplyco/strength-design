
export interface Exercise {
  name: string;
  sets?: string;
  reps?: string;
  details?: string;
}

export interface WorkoutDay {
  description: string;
  warmup: string;
  workout: string;
  strength: string;
  notes?: string;
  images?: string[];
  exercises?: Exercise[];
}

export type WeeklyWorkouts = Record<string, WorkoutDay>;

export interface WorkoutData {
  [key: string]: WorkoutDay;
}
