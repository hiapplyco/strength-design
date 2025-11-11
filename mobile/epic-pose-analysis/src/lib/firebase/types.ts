import { Timestamp } from 'firebase/firestore';

// User Profile Types
export interface UserProfile {
  // Basic profile data
  createdAt: Timestamp;
  updatedAt: Timestamp;
  tier: 'free' | 'pro' | 'premium';
  freeWorkoutsUsed: number;
  trialEndDate: Timestamp | null;
  
  // Fitness profile
  fitnessProfile?: FitnessProfile;
  
  // Nutrition settings
  nutritionSettings?: NutritionSettings;
  
  // Subscription
  subscription?: Subscription;
}

export interface FitnessProfile {
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  heightCm?: number;
  weightKg?: number;
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  primaryGoal?: string;
  secondaryGoals?: string[];
  targetWeightKg?: number;
  targetDate?: Timestamp;
  trainingExperience?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferredTrainingDays?: number;
  preferredWorkoutDuration?: number;
  preferredTrainingTime?: 'morning' | 'afternoon' | 'evening' | 'flexible';
  injuries?: string[];
  medicalConditions?: string[];
  medications?: string[];
  allergies?: string[];
  dietaryRestrictions?: string[];
  gymAccess?: boolean;
  homeEquipment?: string[];
  chatExtractedData?: Record<string, any>;
  fileExtractedData?: Record<string, any>;
  aiRecommendations?: Record<string, any>;
}

export interface NutritionSettings {
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  targetFiber?: number;
  targetSugar?: number;
  targetSodium?: number;
  targetCholesterol?: number;
  targetSaturatedFat?: number;
  targetWaterMl?: number;
  customTargets?: Record<string, number>;
  integrations?: Record<string, any>;
}

export interface Subscription {
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
  priceId?: string;
  currentPeriodEnd?: Timestamp;
  currentPeriodStart?: Timestamp;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, any>;
}

// Workout Types
export interface Workout {
  id?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  day: string;
  description?: string;
  warmup: string;
  workout: string;
  strength?: string;
  notes?: string;
  
  // From generated_workouts
  workoutData?: Record<string, any>;
  title?: string;
  summary?: string;
  difficultyLevel?: number;
  equipmentNeeded?: string[];
  estimatedDurationMinutes?: number;
  targetMuscleGroups?: string[];
  tags?: string[];
  isFavorite?: boolean;
  scheduledDate?: Timestamp;
}

export interface WorkoutHistory {
  id?: string;
  createdAt: Timestamp;
  previousWod: string;
  newWod: string;
  prompt: string;
}

export interface VoiceRecording {
  id?: string;
  createdAt: Timestamp;
  audioUrl: string;
}

// Workout Session Types
export interface WorkoutSession {
  id?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  workoutId: string;
  scheduledDate: Timestamp;
  completedDate?: Timestamp | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  actualDurationMinutes?: number;
  perceivedExertion?: number;
  satisfactionRating?: number;
  modifications?: string;
  notes?: string;
  metrics?: WorkoutMetric[];
}

export interface WorkoutMetric {
  exerciseName: string;
  setsCompleted?: number;
  repsCompleted?: number;
  weightUsed?: number;
  restTimeSeconds?: number;
  formRating?: number;
  difficultyRating?: number;
  notes?: string;
}

// Nutrition Types
export interface NutritionLog {
  id?: string;
  date: string; // YYYY-MM-DD format
  createdAt: Timestamp;
  updatedAt: Timestamp;
  waterConsumedMl: number;
  meals?: {
    breakfast: any[];
    lunch: any[];
    dinner: any[];
    snacks: any[];
  };
}

export interface MealEntry {
  id?: string;
  createdAt: Timestamp;
  mealGroup: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  foodItemId: string;
  foodItem: {
    name: string;
    brand?: string;
    caloriesPerServing: number;
    proteinPerServing: number;
    carbsPerServing: number;
    fatPerServing: number;
  };
  servingMultiplier: number;
  amount: number;
}

export interface ExerciseEntry {
  id?: string;
  createdAt: Timestamp;
  exerciseName: string;
  durationMinutes: number;
  caloriesBurned: number;
  workoutData?: Record<string, any>;
}

// Global Collections
export interface FoodItem {
  id?: string;
  name: string;
  brand?: string | null;
  caloriesPerServing: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  fiberPerServing?: number | null;
  sugarPerServing?: number | null;
  sodiumPerServing?: number | null;
  servingSize: string;
  servingUnit: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface Exercise {
  id?: string;
  name: string;
  category?: string;
  equipment?: string;
  force?: string;
  level?: string;
  mechanic?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Chat Types
export interface ChatSession {
  id?: string;
  createdAt: Timestamp;
  sessionType: 'workout' | 'nutrition' | 'wellness' | 'general';
  startedAt: Timestamp;
  endedAt?: Timestamp | null;
  messageCount: number;
  uploadedFiles?: any[];
  extractedProfileData?: Record<string, any>;
  extractedNutritionData?: Record<string, any>;
  extractedWorkoutData?: Record<string, any>;
  aiSummary?: string;
  keyInsights?: string[];
}

export interface ChatMessage {
  id?: string;
  createdAt: Timestamp;
  message: string;
  response?: string | null;
  attachments?: any[];
  extractedData?: Record<string, any>;
  tokensUsed?: number;
  modelUsed?: string;
}

// File Upload Types
export interface FileUpload {
  id?: string;
  createdAt: Timestamp;
  sessionId?: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt?: Timestamp | null;
  extractedData?: Record<string, any>;
  dataType?: 'workout' | 'nutrition' | 'medical' | 'progress_photo';
  aiAnalysis?: string;
  keyInsights?: string[];
}

// Journal Types
export interface JournalEntry {
  id?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  date: string;
  title?: string;
  content?: string;
  moodRating?: number;
  energyLevel?: number;
  sleepQuality?: number;
  stressLevel?: number;
}

// AI Insights Types
export interface AIInsight {
  id?: string;
  createdAt: Timestamp;
  insightType: string;
  title: string;
  content: string;
  confidenceScore?: number;
  actionRequired?: boolean;
  isRead?: boolean;
  metadata?: Record<string, any>;
  relatedWorkoutSessionId?: string | null;
  relatedJournalEntryId?: string | null;
}

// Collection References
export const COLLECTIONS = {
  USERS: 'users',
  EXERCISES: 'exercises',
  FOOD_ITEMS: 'foodItems',
  
  // User subcollections
  WORKOUTS: 'workouts',
  WORKOUT_SESSIONS: 'workoutSessions',
  NUTRITION_LOGS: 'nutritionLogs',
  CHAT_SESSIONS: 'chatSessions',
  FILE_UPLOADS: 'fileUploads',
  JOURNAL_ENTRIES: 'journalEntries',
  AI_INSIGHTS: 'aiInsights',
  
  // Nested subcollections
  WORKOUT_HISTORY: 'history',
  VOICE_RECORDINGS: 'voiceRecordings',
  MESSAGES: 'messages',
  MEALS: 'meals',
  EXERCISES_LOG: 'exercises',
} as const;