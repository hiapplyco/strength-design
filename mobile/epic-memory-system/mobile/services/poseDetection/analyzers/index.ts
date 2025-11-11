/**
 * Movement Analyzers Export
 * Central export point for all exercise-specific movement analyzers
 */

export { MovementAnalyzer } from './MovementAnalyzer';
export { SquatAnalyzer } from './SquatAnalyzer';
export { DeadliftAnalyzer } from './DeadliftAnalyzer';
export { PushUpAnalyzer } from './PushUpAnalyzer';

// Re-export types for convenience
export type {
  PoseSequence,
  FormAnalysis,
  MovementPhase,
  FormError,
  FormSuggestion,
  JointAngles,
  MovementPattern,
  MovementTiming,
  Landmark,
  Point2D,
  Vector2D,
  SquatAnalysis,
  DepthAnalysis,
  KneeAlignment,
  SpinalAlignment,
  BalanceAnalysis
} from '../types';

// Re-export constants for convenience
export {
  POSE_LANDMARKS,
  ANALYSIS_THRESHOLDS,
  SCORING_WEIGHTS,
  EXERCISE_CRITICAL_LANDMARKS,
  ERROR_SEVERITY_THRESHOLDS,
  PHASE_DETECTION_PARAMS
} from '../constants';

/**
 * Factory function to create appropriate analyzer for exercise type
 */
import { ExerciseType } from '../types';

export function createAnalyzer(exerciseType: ExerciseType): MovementAnalyzer {
  switch (exerciseType) {
    case ExerciseType.SQUAT:
      return new SquatAnalyzer();
    case ExerciseType.DEADLIFT:
      return new DeadliftAnalyzer();
    case ExerciseType.PUSH_UP:
      return new PushUpAnalyzer();
    case ExerciseType.BENCH_PRESS:
      // TODO: Implement BenchPressAnalyzer
      throw new Error('Bench press analyzer not yet implemented');
    case ExerciseType.OVERHEAD_PRESS:
      // TODO: Implement OverheadPressAnalyzer  
      throw new Error('Overhead press analyzer not yet implemented');
    default:
      throw new Error(`Unsupported exercise type: ${exerciseType}`);
  }
}

/**
 * Get list of supported exercise types for analysis
 */
export function getSupportedExerciseTypes(): ExerciseType[] {
  return [
    ExerciseType.SQUAT,
    ExerciseType.DEADLIFT,
    ExerciseType.PUSH_UP
  ];
}

/**
 * Check if an exercise type is supported for analysis
 */
export function isExerciseSupported(exerciseType: ExerciseType): boolean {
  return getSupportedExerciseTypes().includes(exerciseType);
}

/**
 * Get analyzer class name for a given exercise type
 */
export function getAnalyzerClassName(exerciseType: ExerciseType): string {
  switch (exerciseType) {
    case ExerciseType.SQUAT:
      return 'SquatAnalyzer';
    case ExerciseType.DEADLIFT:
      return 'DeadliftAnalyzer';
    case ExerciseType.PUSH_UP:
      return 'PushUpAnalyzer';
    default:
      return 'UnsupportedAnalyzer';
  }
}

/**
 * Exercise-specific analysis configuration
 */
export const ANALYZER_CONFIGS = {
  [ExerciseType.SQUAT]: {
    minFrames: 30,
    criticalLandmarks: ['LEFT_HIP', 'RIGHT_HIP', 'LEFT_KNEE', 'RIGHT_KNEE', 'LEFT_ANKLE', 'RIGHT_ANKLE'],
    primaryMetrics: ['depth', 'knee_alignment', 'spinal_alignment', 'balance'],
    analysisComplexity: 'high'
  },
  [ExerciseType.DEADLIFT]: {
    minFrames: 20,
    criticalLandmarks: ['LEFT_HIP', 'RIGHT_HIP', 'LEFT_KNEE', 'RIGHT_KNEE', 'LEFT_WRIST', 'RIGHT_WRIST'],
    primaryMetrics: ['bar_path', 'hip_hinge', 'spinal_alignment', 'setup_position'],
    analysisComplexity: 'high'
  },
  [ExerciseType.PUSH_UP]: {
    minFrames: 25,
    criticalLandmarks: ['LEFT_SHOULDER', 'RIGHT_SHOULDER', 'LEFT_ELBOW', 'RIGHT_ELBOW', 'LEFT_HIP', 'RIGHT_HIP'],
    primaryMetrics: ['body_alignment', 'range_of_motion', 'elbow_position', 'core_stability'],
    analysisComplexity: 'medium'
  }
} as const;

/**
 * Get analysis configuration for a specific exercise
 */
export function getAnalyzerConfig(exerciseType: ExerciseType) {
  return ANALYZER_CONFIGS[exerciseType] || null;
}