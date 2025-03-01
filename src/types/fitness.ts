
// Add, modify or inspect types here - don't delete existing types
export interface WorkoutDay {
  description?: string;
  warmup?: string;
  strength?: string;
  workout?: string;
  notes?: string;
}

export interface WorkoutMeta {
  title?: string;
  summary?: string;
}

export interface WeeklyWorkouts {
  [day: string]: WorkoutDay;
  _meta?: WorkoutMeta;
}

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
