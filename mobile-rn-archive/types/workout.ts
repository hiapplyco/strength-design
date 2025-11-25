/**
 * Comprehensive Multi-Day Workout System Types
 * For Strength.Design Mobile App
 * 
 * Supports complex workout programs with full progression tracking,
 * multi-week cycles, and detailed analytics integration.
 * 
 * @version 2.0.0
 * @author Claude AI Assistant
 * @created 2025-08-18
 */

// ==================== CORE EXERCISE TYPES ====================

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  
  // Performance tracking
  sets: Set[];
  restPeriods: RestPeriod;
  
  // Exercise metadata
  instructions?: string[];
  tips?: string[];
  videoUrl?: string;
  imageUrl?: string;
  
  // Progression tracking
  progressionType: ProgressionType;
  difficulty: DifficultyLevel;
  
  // Accessibility
  alternativeExercises?: string[];
  modifications?: Modification[];
}

export interface Set {
  id: string;
  type: SetType;
  
  // Core set parameters
  reps?: number;
  repRange?: RepRange;
  weight?: number;
  weightUnit: WeightUnit;
  
  // Time-based parameters
  duration?: number; // seconds
  distance?: number; // meters
  
  // Advanced set types
  tempo?: TempoParameters;
  restBetweenReps?: number; // seconds
  
  // Tracking fields
  actualReps?: number;
  actualWeight?: number;
  actualDuration?: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  completed?: boolean;
  completedAt?: Date;
  notes?: string;
}

export interface RepRange {
  min: number;
  max: number;
}

export interface TempoParameters {
  eccentric: number; // seconds down
  pause: number;     // seconds pause
  concentric: number; // seconds up
  rest: number;      // seconds rest at top
}

export interface RestPeriod {
  between_sets: number; // seconds
  between_exercises?: number; // seconds
  active_rest?: boolean;
  active_rest_exercise?: string;
}

export interface Modification {
  id: string;
  type: ModificationType;
  title: string;
  description: string;
  targetCondition?: string[]; // e.g., "knee injury", "beginner"
}

// ==================== WORKOUT DAY STRUCTURE ====================

export interface WorkoutDay {
  id: string;
  dayNumber: number; // 1-7 within a week
  weekNumber: number; // 1-N within the program
  
  // Day metadata
  title: string;
  description: string;
  estimatedDuration: number; // minutes
  difficulty: DifficultyLevel;
  focusAreas: string[]; // e.g., "Upper Body", "Cardio"
  
  // Workout sections
  warmup: WorkoutSection;
  workout: WorkoutSection;
  strength?: WorkoutSection;
  cardio?: WorkoutSection;
  cooldown?: WorkoutSection;
  
  // Day-specific configuration
  restDay: boolean;
  activeRecovery: boolean;
  deloadDay: boolean;
  testDay: boolean; // for 1RM tests, assessments
  
  // Progression tracking
  completedSessions: WorkoutSession[];
  lastCompleted?: Date;
  averageRating?: number;
  personalRecords: PersonalRecord[];
  
  // Customization
  userNotes?: string;
  coachNotes?: string;
  adaptations?: WorkoutAdaptation[];
}

export interface WorkoutSection {
  id: string;
  name: string; // "Warmup", "Main Workout", "Strength Training"
  type: SectionType;
  exercises: Exercise[];
  
  // Section configuration
  circuits?: Circuit[];
  supersets?: Superset[];
  dropsets?: boolean;
  restBetweenExercises?: number; // seconds
  
  // Instructions
  instructions?: string;
  targetIntensity?: IntensityZone;
  estimatedDuration?: number; // minutes
}

export interface Circuit {
  id: string;
  name: string;
  exerciseIds: string[];
  rounds: number;
  restBetweenRounds: number; // seconds
  restBetweenExercises: number; // seconds
}

export interface Superset {
  id: string;
  exerciseIds: string[];
  restBetweenExercises: number; // seconds
  restAfterSuperset: number; // seconds
}

// ==================== MULTI-WEEK PROGRAM STRUCTURE ====================

export interface WorkoutProgram {
  id: string;
  
  // Program metadata
  title: string;
  description: string;
  summary?: string;
  
  // Program structure
  totalWeeks: number;
  daysPerWeek: number;
  weeks: WorkoutWeek[];
  
  // Program configuration
  difficulty: DifficultyLevel;
  programType: ProgramType;
  goals: FitnessGoal[];
  targetAudience: string[]; // e.g., "Beginner", "Athletes", "Weight Loss"
  
  // Requirements
  equipment: string[];
  timeCommitment: TimeCommitment;
  prerequisites?: string[];
  
  // Progression system
  progressionScheme: ProgressionScheme;
  deloadWeeks?: number[]; // weeks that are deload
  testWeeks?: number[];   // weeks with testing/assessment
  
  // Program analytics
  estimatedCaloriesBurn?: number; // per week
  difficultyProgression?: DifficultyProgression;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  tags: string[];
  
  // User customization
  userStartDate?: Date;
  userModifications?: ProgramModification[];
  userProgress?: ProgramProgress;
}

export interface WorkoutWeek {
  id: string;
  weekNumber: number;
  title: string;
  description?: string;
  
  // Week configuration
  isDeloadWeek: boolean;
  isTestWeek: boolean;
  focusTheme?: string; // e.g., "Strength Building", "Recovery"
  
  // Days in the week
  days: WorkoutDay[];
  
  // Week-level tracking
  completedDays: number;
  startDate?: Date;
  completedDate?: Date;
  weeklyStats?: WeeklyStats;
}

// ==================== TRACKING & ANALYTICS ====================

export interface WorkoutSession {
  id: string;
  workoutDayId: string;
  programId: string;
  
  // Session timing
  startTime: Date;
  endTime?: Date;
  actualDuration?: number; // minutes
  pausedTime?: number; // minutes
  
  // Performance tracking
  exercises: ExercisePerformance[];
  totalVolume: number; // total weight lifted
  averageIntensity?: number;
  averageRPE?: number;
  
  // Session quality
  sessionRating: number; // 1-10
  sessionNotes?: string;
  fatigue: number; // 1-10
  motivation: number; // 1-10
  
  // Environmental factors
  weather?: WeatherCondition;
  location?: string;
  equipment?: string[];
  
  // Recovery metrics
  heartRateData?: HeartRateData;
  caloriesBurned?: number;
  recovery?: RecoveryMetrics;
}

export interface ExercisePerformance {
  exerciseId: string;
  exerciseName: string;
  setsCompleted: Set[];
  personalRecord?: boolean;
  improvements?: string[];
  struggles?: string[];
  modifications?: string[];
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  recordType: RecordType;
  value: number;
  unit: string;
  date: Date;
  sessionId: string;
  notes?: string;
}

export interface WeeklyStats {
  weekNumber: number;
  daysCompleted: number;
  totalVolume: number;
  averageSessionRating: number;
  totalDuration: number; // minutes
  caloriesBurned?: number;
  personalRecords: PersonalRecord[];
  injuryReports?: InjuryReport[];
}

export interface ProgramProgress {
  programId: string;
  currentWeek: number;
  currentDay: number;
  
  // Overall progress
  completionPercentage: number;
  weeksCompleted: number;
  daysCompleted: number;
  
  // Performance trends
  strengthProgression: StrengthProgression[];
  enduranceProgression: EnduranceProgression[];
  bodyComposition?: BodyCompositionChange[];
  
  // Program adherence
  adherenceRate: number; // percentage
  missedSessions: number;
  consecutiveDays: number;
  
  // Goals and achievements
  goalsAchieved: Achievement[];
  badges: Badge[];
  milestones: Milestone[];
}

// ==================== PROGRESSION & ADAPTATION ====================

export interface ProgressionScheme {
  type: ProgressionType;
  
  // Linear progression
  weightIncrease?: number; // per week
  repIncrease?: number;    // per week
  
  // Periodization
  periodization?: PeriodizationType;
  intensityWaves?: IntensityWave[];
  
  // Auto-regulation
  autoRegulation?: AutoRegulationConfig;
  rpeTargets?: RPETarget[];
  
  // Deload configuration
  deloadFrequency?: number; // weeks
  deloadIntensity?: number; // percentage reduction
}

export interface WorkoutAdaptation {
  id: string;
  reason: AdaptationReason;
  description: string;
  
  // Adaptation specifics
  exerciseSubstitutions?: ExerciseSubstitution[];
  intensityAdjustment?: number; // percentage
  volumeAdjustment?: number;    // percentage
  durationAdjustment?: number;  // minutes
  
  // Context
  appliedDate: Date;
  appliedBy: string; // "user" | "coach" | "ai"
  temporary: boolean;
  expiryDate?: Date;
}

export interface ExerciseSubstitution {
  originalExerciseId: string;
  replacementExerciseId: string;
  reason: string;
  permanent: boolean;
}

// ==================== SHARING & SOCIAL ====================

export interface WorkoutShare {
  id: string;
  type: ShareType;
  
  // Content
  programId?: string;
  dayId?: string;
  sessionId?: string;
  
  // Share configuration
  public: boolean;
  allowCopy: boolean;
  allowModification: boolean;
  
  // Analytics
  views: number;
  copies: number;
  ratings: ShareRating[];
  
  // Metadata
  sharedBy: string;
  sharedAt: Date;
  shareUrl?: string;
  description?: string;
  tags: string[];
}

export interface ShareRating {
  userId: string;
  rating: number; // 1-5
  comment?: string;
  date: Date;
}

// ==================== ENUMS & TYPES ====================

export type ExerciseCategory = 
  | 'strength'
  | 'cardio'
  | 'flexibility'
  | 'mobility'
  | 'balance'
  | 'plyometric'
  | 'powerlifting'
  | 'bodyweight'
  | 'functional'
  | 'rehabilitation';

export type SetType = 
  | 'working'
  | 'warmup'
  | 'dropset'
  | 'rest_pause'
  | 'cluster'
  | 'amrap'
  | 'emom'
  | 'tabata'
  | 'time_based'
  | 'distance_based';

export type DifficultyLevel = 
  | 'beginner'
  | 'novice'
  | 'intermediate'
  | 'advanced'
  | 'elite';

export type ProgressionType = 
  | 'linear'
  | 'double_progression'
  | 'percentage_based'
  | 'rpe_based'
  | 'periodized'
  | 'undulating'
  | 'block'
  | 'conjugate';

export type ProgramType = 
  | 'strength'
  | 'hypertrophy'
  | 'powerlifting'
  | 'endurance'
  | 'weight_loss'
  | 'general_fitness'
  | 'sport_specific'
  | 'rehabilitation'
  | 'bodybuilding';

export type FitnessGoal = 
  | 'strength'
  | 'muscle_gain'
  | 'weight_loss'
  | 'endurance'
  | 'power'
  | 'flexibility'
  | 'balance'
  | 'general_health'
  | 'sport_performance'
  | 'rehabilitation';

export type SectionType = 
  | 'warmup'
  | 'main'
  | 'strength'
  | 'cardio'
  | 'flexibility'
  | 'cooldown'
  | 'skill_work'
  | 'assessment';

export type WeightUnit = 'lbs' | 'kg';

export type ModificationType = 
  | 'beginner'
  | 'advanced'
  | 'injury'
  | 'equipment'
  | 'time'
  | 'space'
  | 'accessibility';

export type IntensityZone = 
  | 'recovery'
  | 'aerobic'
  | 'threshold'
  | 'vo2_max'
  | 'neuromuscular';

export type PeriodizationType = 
  | 'linear'
  | 'reverse_linear'
  | 'undulating'
  | 'block'
  | 'conjugate';

export type AdaptationReason = 
  | 'injury'
  | 'equipment_unavailable'
  | 'time_constraint'
  | 'fatigue'
  | 'plateau'
  | 'user_preference'
  | 'progression'
  | 'deload';

export type ShareType = 
  | 'program'
  | 'day'
  | 'session'
  | 'exercise'
  | 'achievement';

export type RecordType = 
  | '1rm'
  | '3rm'
  | '5rm'
  | 'volume'
  | 'endurance'
  | 'speed'
  | 'distance';

// ==================== COMPLEX INTERFACES ====================

export interface TimeCommitment {
  minutesPerSession: number;
  sessionsPerWeek: number;
  totalHoursPerWeek: number;
  flexibilityLevel: 'rigid' | 'moderate' | 'flexible';
}

export interface DifficultyProgression {
  startDifficulty: DifficultyLevel;
  endDifficulty: DifficultyLevel;
  progressionRate: 'slow' | 'moderate' | 'fast';
  adaptiveDifficulty: boolean;
}

export interface ProgramModification {
  id: string;
  type: ModificationType;
  description: string;
  affectedWeeks?: number[];
  affectedDays?: string[];
  appliedDate: Date;
}

export interface HeartRateData {
  averageHR: number;
  maxHR: number;
  minHR: number;
  timeInZones: {
    zone1: number; // minutes
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
}

export interface RecoveryMetrics {
  hrv?: number; // Heart Rate Variability
  restingHR?: number;
  sleepQuality?: number; // 1-10
  stressLevel?: number; // 1-10
  energy?: number; // 1-10
  soreness?: number; // 1-10
}

export interface WeatherCondition {
  temperature: number;
  humidity: number;
  condition: string; // "sunny", "rainy", "cloudy", etc.
  indoor: boolean;
}

export interface InjuryReport {
  id: string;
  bodyPart: string;
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
  date: Date;
  affectedExercises: string[];
  recoveryTime?: number; // days
}

export interface StrengthProgression {
  exerciseId: string;
  exerciseName: string;
  weekNumber: number;
  maxWeight: number;
  totalVolume: number;
  estimatedOneRM: number;
}

export interface EnduranceProgression {
  exerciseId: string;
  exerciseName: string;
  weekNumber: number;
  maxDuration: number;
  maxDistance?: number;
  averagePace?: number;
}

export interface BodyCompositionChange {
  date: Date;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  measurements?: { [bodyPart: string]: number };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  unlockedDate: Date;
  value?: number;
  unit?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  earnedDate: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  category: string;
  achievedDate?: Date;
}

export interface IntensityWave {
  weekNumber: number;
  intensityPercentage: number;
  volumePercentage: number;
  focusArea: string;
}

export interface AutoRegulationConfig {
  enabled: boolean;
  rpeRange: { min: number; max: number };
  adjustmentFactor: number; // percentage
  lookbackPeriod: number; // sessions
}

export interface RPETarget {
  exerciseCategory: ExerciseCategory;
  targetRPE: number;
  allowedRange: number;
}

// ==================== UTILITY TYPES ====================

export interface WorkoutFilter {
  difficulty?: DifficultyLevel[];
  duration?: { min: number; max: number };
  equipment?: string[];
  focusAreas?: string[];
  programType?: ProgramType[];
  goals?: FitnessGoal[];
}

export interface WorkoutSearchResult {
  programs: WorkoutProgram[];
  days: WorkoutDay[];
  totalResults: number;
  searchQuery: string;
  filters: WorkoutFilter;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ==================== DEFAULT VALUES & CONSTANTS ====================

export const DEFAULT_REST_PERIODS = {
  strength: 180, // 3 minutes
  hypertrophy: 90, // 1.5 minutes
  endurance: 60, // 1 minute
  power: 300, // 5 minutes
};

export const DIFFICULTY_MULTIPLIERS = {
  beginner: 0.7,
  novice: 0.8,
  intermediate: 1.0,
  advanced: 1.2,
  elite: 1.4,
};

export const RPE_DESCRIPTIONS = {
  1: "Very Easy",
  2: "Easy",
  3: "Moderate",
  4: "Somewhat Hard",
  5: "Hard",
  6: "Harder",
  7: "Very Hard",
  8: "Extremely Hard",
  9: "Maximum Effort",
  10: "Absolute Maximum"
};

// ==================== EXPORTS ====================

export default {
  // Main interfaces
  WorkoutProgram,
  WorkoutWeek,
  WorkoutDay,
  WorkoutSession,
  Exercise,
  Set,
  
  // Tracking interfaces
  PersonalRecord,
  ProgramProgress,
  WeeklyStats,
  
  // Sharing interfaces
  WorkoutShare,
  ShareRating,
  
  // Utility
  DEFAULT_REST_PERIODS,
  DIFFICULTY_MULTIPLIERS,
  RPE_DESCRIPTIONS,
};