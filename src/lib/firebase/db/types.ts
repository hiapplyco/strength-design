import { Timestamp, FieldValue } from 'firebase/firestore';

// Base document interface
export interface BaseDocument {
  createdAt: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

// User profile types
export interface UserProfile extends BaseDocument {
  tier: 'free' | 'pro' | 'premium';
  freeWorkoutsUsed: number;
  trialEndDate?: Timestamp | null;
  fitnessProfile?: FitnessProfile;
  nutritionSettings?: NutritionSettings;
  subscription?: SubscriptionData;
}

export interface FitnessProfile {
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  heightCm?: number;
  weightKg?: number;
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
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

export interface SubscriptionData {
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
  priceId?: string;
  currentPeriodEnd?: Timestamp;
  currentPeriodStart?: Timestamp;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, any>;
}

// Workout types
export interface Workout extends BaseDocument {
  day?: string;
  description?: string;
  warmup?: string;
  workout?: string;
  strength?: string;
  notes?: string;
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

export interface WorkoutHistory extends BaseDocument {
  previousWod: string;
  newWod: string;
  prompt: string;
}

export interface VoiceRecording extends BaseDocument {
  audioUrl: string;
}

// Workout session types
export interface WorkoutSession extends BaseDocument {
  workoutId: string;
  scheduledDate?: Timestamp;
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

// Nutrition types
export interface NutritionLog extends BaseDocument {
  date: string; // YYYY-MM-DD format
  waterConsumedMl?: number;
  meals?: {
    breakfast?: any[];
    lunch?: any[];
    dinner?: any[];
    snacks?: any[];
  };
}

export interface MealEntry extends BaseDocument {
  mealGroup: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  foodItemId: string;
  foodItem: {
    name: string;
    brand?: string;
    caloriesPerServing?: number;
    proteinPerServing?: number;
    carbsPerServing?: number;
    fatPerServing?: number;
  };
  servingMultiplier?: number;
  amount?: number;
}

export interface ExerciseEntry extends BaseDocument {
  exerciseName: string;
  durationMinutes?: number;
  caloriesBurned?: number;
  workoutData?: Record<string, any>;
}

// Food item types
export interface FoodItem extends BaseDocument {
  name: string;
  brand?: string | null;
  caloriesPerServing?: number;
  proteinPerServing?: number;
  carbsPerServing?: number;
  fatPerServing?: number;
  fiberPerServing?: number | null;
  sugarPerServing?: number | null;
  sodiumPerServing?: number | null;
  servingSize?: string;
  servingUnit?: string;
  createdBy?: string;
}

// Exercise types
export interface Exercise extends BaseDocument {
  name: string;
  category?: string;
  equipment?: string;
  force?: string;
  level?: string;
  mechanic?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
}

// Chat types
export interface ChatSession extends BaseDocument {
  sessionType: 'workout' | 'nutrition' | 'wellness' | 'general';
  startedAt: Timestamp;
  endedAt?: Timestamp | null;
  messageCount?: number;
  uploadedFiles?: string[];
  extractedProfileData?: Record<string, any>;
  extractedNutritionData?: Record<string, any>;
  extractedWorkoutData?: Record<string, any>;
  aiSummary?: string;
  keyInsights?: string[];
}

export interface ChatMessage extends BaseDocument {
  message: string;
  response?: string | null;
  attachments?: string[];
  extractedData?: Record<string, any>;
  tokensUsed?: number;
  modelUsed?: string;
}

// File upload types
export interface FileUpload extends BaseDocument {
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

// Journal types
export interface JournalEntry extends BaseDocument {
  date: string;
  title?: string;
  content?: string;
  moodRating?: number;
  energyLevel?: number;
  sleepQuality?: number;
  stressLevel?: number;
}

// AI insights types
export interface AIInsight extends BaseDocument {
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

// Document types
export interface SharedDocument extends BaseDocument {
  content: string;
  title: string;
  url: string;
  userId?: string;
  isPublic?: boolean;
  views?: number;
}