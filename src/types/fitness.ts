
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
  metadata?: {
    goals?: string[];
  };
  goals?: string[]; // Added this line
}

export type WeeklyWorkouts = Record<string, WorkoutDay>;

export interface WorkoutData {
  [key: string]: WorkoutDay;
}
