
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
  inputs?: {
    numberOfDays: number;
    numberOfCycles: number;
    fitnessLevel: string;
    weatherPrompt: string;
    prescribedExercises: string;
    injuries?: string;
    prompt?: string;
  };
  debug?: any;
}

// Define a type for a workout cycle which contains days
export interface WorkoutCycle {
  [key: string]: WorkoutDay;
}

// Fix the WeeklyWorkouts interface to properly handle cycles
export interface WeeklyWorkouts {
  [key: string]: WorkoutCycle | WorkoutMeta | WorkoutDay; // Can be a cycle or the _meta object or legacy workout day
  _meta?: WorkoutMeta;
}

// Create a type guard to check if an entry is a WorkoutDay
export function isWorkoutDay(value: WorkoutDay | WorkoutMeta | WorkoutCycle): value is WorkoutDay {
  return (value as WorkoutDay).workout !== undefined || 
         (value as WorkoutDay).warmup !== undefined || 
         (value as WorkoutDay).strength !== undefined;
}

// Create a type guard to check if an entry is a WorkoutCycle
export function isWorkoutCycle(value: WorkoutDay | WorkoutMeta | WorkoutCycle): value is WorkoutCycle {
  if (typeof value !== 'object' || value === null) return false;
  
  // Check if the object has at least one key that starts with "day"
  const keys = Object.keys(value);
  return keys.some(key => key.startsWith('day')) && 
         !isWorkoutDay(value) && // Not a workout day itself
         !('title' in value); // Not a meta object
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
