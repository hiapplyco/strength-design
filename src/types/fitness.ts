
// Add, modify or inspect types here - don't delete existing types
export interface WorkoutDay {
  description?: string;
  warmup?: string;
  strength?: string;
  workout?: string;
  notes?: string;
  exercises?: Array<{ name: string; sets?: string; reps?: string; }>;
  images?: string[];
}

export interface WorkoutMeta {
  title?: string;
  summary?: string;
}

// Fix the WeeklyWorkouts interface to properly handle the _meta property
export interface WeeklyWorkouts {
  [key: string]: WorkoutDay | WorkoutMeta;
  _meta?: WorkoutMeta;
}

// Create a type guard to check if an entry is a WorkoutDay
export function isWorkoutDay(value: WorkoutDay | WorkoutMeta): value is WorkoutDay {
  return (value as WorkoutDay).workout !== undefined || 
         (value as WorkoutDay).warmup !== undefined || 
         (value as WorkoutDay).strength !== undefined;
}

// Explicitly exclude _meta from the string index type
export type WorkoutData = WeeklyWorkouts;

export interface StrengthExercises {
  parts: string[];
  weight: string[];
  rep_type: string[];
  reps: string[];
}

export interface Exercise {
  name: string;
  target: string;
  bodyPart: string;
  equipment: string;
  gifUrl?: string;
  id?: string;
}

export interface ExerciseSearchProps {
  onSelect?: (exercise: Exercise) => void;
  onClose?: () => void;
  defaultOpen?: boolean;
}

export interface Playbook {
  title: string;
  description: string;
  steps: PlaybookStep[];
}

export interface PlaybookStep {
  title: string;
  content: string;
  keywords?: string[];
}
