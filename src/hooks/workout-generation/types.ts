
import type { Exercise } from "@/components/exercise-search/types";

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  configUpdates?: Record<string, any>;
}

export interface GenerateWorkoutParams {
  prompt: string;
  weatherPrompt: string;
  fitnessLevel: string;
  prescribedExercises: string;
  numberOfDays: number;
  numberOfCycles: number;
  injuries?: string;
  selectedExercises?: Exercise[];
  chatHistory?: ChatMessage[];
}

export interface WorkoutGenerationResult {
  success: boolean;
  data?: any;
  error?: string;
}
