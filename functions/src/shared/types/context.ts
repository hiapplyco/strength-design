/**
 * Shared Context Schema for Cross-Platform Consistency
 * This file defines the standardized context structure used across
 * web, mobile, and Firebase Functions for AI workout generation.
 */

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  goals: string[];
  age?: number;
  weight?: number;
  height?: number;
  preferredUnits: 'metric' | 'imperial';
  injuries?: string[];
  equipment?: string[];
  trainingFrequency?: number; // days per week
  timePerSession?: number; // minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutStats {
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
  favoriteTime?: string;
  lastWorkoutDate?: Date;
  weeklyAverage: number;
  monthlyTotal: number;
  completionRate: number; // percentage
  totalMinutes: number;
  caloriesBurned?: number;
}

export interface HealthData {
  isConnected: boolean;
  platform?: 'apple_health' | 'google_fit' | 'none';
  today?: {
    steps?: number;
    calories?: number;
    activeMinutes?: number;
    distance?: number;
    sleep?: number; // hours
    heartRate?: {
      resting?: number;
      average?: number;
      max?: number;
    };
  };
  weekly?: {
    averageSteps?: number;
    averageCalories?: number;
    averageSleep?: number;
    workoutCount?: number;
  };
  lastSync?: Date;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment?: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions?: string[];
  imageUrl?: string;
  videoUrl?: string;
  isFavorite?: boolean;
  customSets?: number;
  customReps?: string;
  customRest?: string;
  personalNotes?: string;
}

export interface WorkoutPreferences {
  preferredDays: string[]; // ['monday', 'wednesday', 'friday']
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'flexible';
  workoutTypes: string[]; // ['strength', 'cardio', 'flexibility', 'hiit']
  splitType?: 'full_body' | 'upper_lower' | 'push_pull_legs' | 'body_part';
  restDayPreference?: 'fixed' | 'flexible';
  warmupDuration?: number; // minutes
  cooldownDuration?: number; // minutes
  musicPreference?: boolean;
  notificationPreference?: boolean;
}

export interface NutritionData {
  dailyCalorieTarget?: number;
  macros?: {
    protein: number; // grams
    carbs: number; // grams
    fats: number; // grams
  };
  dietaryRestrictions?: string[];
  mealFrequency?: number;
  hydrationGoal?: number; // liters
  supplements?: string[];
}

export interface UserInsights {
  strengths: string[];
  areasForImprovement: string[];
  progressTrends: {
    metric: string;
    trend: 'improving' | 'stable' | 'declining';
    percentage?: number;
  }[];
  recommendations: string[];
  achievedMilestones: {
    title: string;
    date: Date;
    description?: string;
  }[];
}

export interface UserContext {
  profile: UserProfile;
  workoutHistory: WorkoutStats;
  health: HealthData;
  savedExercises: Exercise[];
  preferences: WorkoutPreferences;
  nutrition?: NutritionData;
  insights?: UserInsights;
  contextVersion: string; // for schema versioning
  generatedAt: Date;
}

export interface ChatContext {
  userContext: UserContext;
  sessionId: string;
  conversationHistory: ChatMessage[];
  currentWorkoutPlan?: GeneratedWorkout;
  metadata: {
    platform: 'web' | 'mobile';
    appVersion: string;
    timezone?: string;
    locale?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    responseTime?: number;
    error?: string;
  };
}

export interface GeneratedWorkout {
  id: string;
  title: string;
  description?: string;
  duration: string; // e.g., "4 weeks"
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: string; // e.g., "strength", "hypertrophy", "endurance"
  weeks: WorkoutWeek[];
  createdAt: Date;
  userId: string;
  sessionId?: string;
  isActive?: boolean;
  completionPercentage?: number;
}

export interface WorkoutWeek {
  weekNumber: number;
  theme?: string;
  days: WorkoutDay[];
}

export interface WorkoutDay {
  dayNumber: number;
  name: string; // e.g., "Monday - Upper Body"
  focus?: string;
  exercises: WorkoutExercise[];
  estimatedDuration?: number; // minutes
  notes?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: string; // Can be range like "8-12"
  rest: string; // e.g., "60s", "2-3 min"
  tempo?: string; // e.g., "2-0-2-0"
  weight?: string; // e.g., "70% 1RM", "bodyweight"
  notes?: string;
  alternatives?: string[];
  order: number;
}

// Validation helpers
export const validateUserContext = (context: any): context is UserContext => {
  return (
    context &&
    typeof context === 'object' &&
    context.profile &&
    context.workoutHistory &&
    context.health &&
    Array.isArray(context.savedExercises) &&
    context.preferences &&
    context.contextVersion &&
    context.generatedAt
  );
};

export const getDefaultUserContext = (): Partial<UserContext> => ({
  contextVersion: '1.0.0',
  generatedAt: new Date(),
  savedExercises: [],
  health: {
    isConnected: false,
    platform: 'none'
  },
  workoutHistory: {
    totalWorkouts: 0,
    currentStreak: 0,
    longestStreak: 0,
    weeklyAverage: 0,
    monthlyTotal: 0,
    completionRate: 0,
    totalMinutes: 0
  }
});

// Context aggregation utility
export const aggregateContext = async (
  userId: string,
  db: any // Firestore instance
): Promise<UserContext> => {
  try {
    // Fetch user profile
    const userDoc = await db.collection('users').doc(userId).get();
    const profile = userDoc.exists ? userDoc.data() as UserProfile : null;

    // Fetch workout history
    const workoutsSnapshot = await db
      .collection('workouts')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(30)
      .get();

    // Calculate workout stats
    const workoutStats = calculateWorkoutStats(workoutsSnapshot.docs);

    // Fetch saved exercises
    const exercisesSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('savedExercises')
      .where('isFavorite', '==', true)
      .get();

    const savedExercises = exercisesSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    } as Exercise));

    // Fetch preferences
    const prefsDoc = await db
      .collection('users')
      .doc(userId)
      .collection('settings')
      .doc('preferences')
      .get();

    const preferences = prefsDoc.exists 
      ? prefsDoc.data() as WorkoutPreferences 
      : getDefaultPreferences();

    // Fetch health data (if available)
    const healthDoc = await db
      .collection('users')
      .doc(userId)
      .collection('health')
      .doc('current')
      .get();

    const health: HealthData = healthDoc.exists 
      ? healthDoc.data() as HealthData 
      : { isConnected: false, platform: 'none' as 'none' };

    return {
      profile: profile || getDefaultProfile(userId),
      workoutHistory: workoutStats,
      health,
      savedExercises,
      preferences,
      contextVersion: '1.0.0',
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Error aggregating context:', error);
    throw new Error('Failed to aggregate user context');
  }
};

// Helper functions
const calculateWorkoutStats = (workouts: any[]): WorkoutStats => {
  // Implementation would calculate actual stats from workout documents
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const recentWorkouts = workouts.filter((doc: any) => {
    const date = doc.data().createdAt?.toDate();
    return date && date > thirtyDaysAgo;
  });

  return {
    totalWorkouts: recentWorkouts.length,
    currentStreak: 0, // Would calculate actual streak
    longestStreak: 0,
    weeklyAverage: Math.round(recentWorkouts.length / 4),
    monthlyTotal: recentWorkouts.length,
    completionRate: 0,
    totalMinutes: 0
  };
};

const getDefaultProfile = (userId: string): UserProfile => ({
  uid: userId,
  email: '',
  fitnessLevel: 'intermediate',
  goals: ['general_fitness'],
  preferredUnits: 'imperial',
  createdAt: new Date(),
  updatedAt: new Date()
});

const getDefaultPreferences = (): WorkoutPreferences => ({
  preferredDays: ['monday', 'wednesday', 'friday'],
  preferredTime: 'flexible',
  workoutTypes: ['strength'],
  splitType: 'full_body'
});

export default {
  validateUserContext,
  getDefaultUserContext,
  aggregateContext
};