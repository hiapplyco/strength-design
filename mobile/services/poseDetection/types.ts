/**
 * Pose Detection Service Types
 * TypeScript interfaces and types for Google ML Kit pose detection integration
 */

// Core pose detection types
export interface Landmark {
  x: number;
  y: number;
  z?: number; // Experimental depth coordinate
  inFrameLikelihood: number; // 0.0-1.0 confidence score
}

export interface PoseLandmarks {
  landmarks: Landmark[];
  timestamp: number;
  frameIndex: number;
}

export interface VideoFrame {
  uri: string;
  timestamp: number;
  duration: number;
}

export type PoseSequence = PoseLandmarks[];

// Exercise and sport types
export enum ExerciseType {
  SQUAT = 'squat',
  DEADLIFT = 'deadlift',
  PUSH_UP = 'pushup',
  BENCH_PRESS = 'bench_press',
  OVERHEAD_PRESS = 'overhead_press'
}

export enum SportType {
  BASEBALL_PITCH = 'baseball_pitch',
  TENNIS_SERVE = 'tennis_serve',
  GOLF_SWING = 'golf_swing',
  BASKETBALL_SHOT = 'basketball_shot'
}

// Movement analysis types
export interface JointAngles {
  leftKnee: number;
  rightKnee: number;
  leftHip: number;
  rightHip: number;
  leftShoulder: number;
  rightShoulder: number;
  leftElbow: number;
  rightElbow: number;
  spinalAlignment: number;
}

export interface MovementPhase {
  type: 'descent' | 'bottom' | 'ascent' | 'standing' | 'windup' | 'stride' | 'cocking' | 'acceleration' | 'follow_through';
  startFrame: number;
  endFrame?: number;
  duration?: number;
  keyMetrics?: Record<string, number>;
}

export interface MovementPattern {
  phases: MovementPhase[];
  tempo: {
    descendDuration: number;
    ascentDuration: number;
    totalDuration: number;
  };
  consistency: number; // 0-1 score
  smoothness: number; // 0-1 score
}

export interface MovementTiming {
  totalDuration: number;
  phaseTimings: Record<string, number>;
  tempoScore: number; // 0-100
  rhythmConsistency: number; // 0-1
}

// Form analysis types
export interface FormError {
  type: 'knee_cave' | 'forward_lean' | 'heel_rise' | 'elbow_flare' | 'hip_shift' | 'rounded_back' | 'shallow_depth';
  severity: 'low' | 'medium' | 'high';
  timeRange: [number, number]; // Start and end timestamps in ms
  description: string;
  correction: string;
  affectedLandmarks: number[]; // Landmark indices
}

export interface FormSuggestion {
  category: 'depth' | 'alignment' | 'tempo' | 'balance' | 'range_of_motion';
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
  expectedImprovement: string;
}

export interface FormAnalysis {
  overallScore: number; // 0-100
  criticalErrors: FormError[];
  improvements: FormSuggestion[];
  keyPhases: MovementPhase[];
  timing: MovementTiming;
  jointAngles: JointAngles[];
  movementPattern: MovementPattern;
  confidenceScore: number; // 0-1 for analysis reliability
}

// Exercise-specific analysis types
export interface SquatAnalysis extends FormAnalysis {
  depth: DepthAnalysis;
  kneeAlignment: KneeAlignment;
  spinalAlignment: SpinalAlignment;
  balanceAnalysis: BalanceAnalysis;
  phases: SquatPhase[];
}

export interface SquatPhase extends MovementPhase {
  type: 'descent' | 'bottom' | 'ascent' | 'standing';
  hipAngle: number;
  kneeAngle: number;
  ankleAngle: number;
}

export interface DepthAnalysis {
  maxDepth: number; // Hip angle at lowest point
  reachedParallel: boolean;
  belowParallel: boolean;
  depthScore: number; // 0-100
  consistency: number; // 0-1
}

export interface KneeAlignment {
  kneeTrackingScore: number; // 0-100
  valgusCollapse: boolean;
  maxInwardDeviation: number;
  consistencyScore: number; // 0-1
}

export interface SpinalAlignment {
  neutralSpine: boolean;
  forwardLean: number; // Degrees from vertical
  lateralDeviation: number;
  alignmentScore: number; // 0-100
}

export interface BalanceAnalysis {
  weightDistribution: 'centered' | 'forward' | 'backward' | 'left' | 'right';
  stabilityScore: number; // 0-100
  sway: number; // Movement deviation
}

// Sports-specific analysis types
export interface PitchAnalysis extends FormAnalysis {
  windup: PitchPhaseAnalysis;
  stride: PitchPhaseAnalysis;
  armCocking: PitchPhaseAnalysis;
  acceleration: PitchPhaseAnalysis;
  followThrough: PitchPhaseAnalysis;
  shoulderHipSeparation: number;
  armSlot: number;
  balance: BalanceAnalysis;
}

export interface PitchPhaseAnalysis {
  duration: number;
  mechanicsScore: number; // 0-100
  keyPositions: Record<string, Landmark>;
  errors: FormError[];
}

// Service configuration types
export interface PoseDetectionConfig {
  mode: 'fast' | 'accurate';
  detectAllPoses: boolean;
  enableTracking: boolean;
  confidenceThreshold: number;
  frameSkip: number; // Process every nth frame
  batchSize: number; // Frames per batch
  useWorkerThread: boolean;
}

export interface PerformanceConfig {
  frameSkip: number; // Process every nth frame for performance
  confidenceThreshold: number; // Minimum landmark confidence
  batchSize: number; // Process frames in batches
  useWorkerThread: boolean; // Background processing
  maxVideoLength: number; // Maximum video length in seconds
  maxFileSize: number; // Maximum file size in bytes
}

// Analysis result types
export interface AnalysisResult {
  success: boolean;
  analysis?: FormAnalysis | SquatAnalysis | PitchAnalysis;
  errors?: AnalysisError[];
  warnings?: string[];
  processingTime: number;
  framesProcessed: number;
  confidenceMetrics: ConfidenceMetrics;
}

export interface AnalysisError {
  type: AnalysisErrorType;
  message: string;
  details?: any;
  recoverable: boolean;
}

export enum AnalysisErrorType {
  INSUFFICIENT_POSE_DATA = 'insufficient_pose_data',
  LOW_CONFIDENCE_LANDMARKS = 'low_confidence_landmarks',
  INCOMPLETE_MOVEMENT = 'incomplete_movement',
  PROCESSING_TIMEOUT = 'processing_timeout',
  VIDEO_FORMAT_UNSUPPORTED = 'video_format_unsupported',
  FILE_TOO_LARGE = 'file_too_large',
  POSE_DETECTION_FAILED = 'pose_detection_failed',
  INVALID_EXERCISE_TYPE = 'invalid_exercise_type'
}

export interface ConfidenceMetrics {
  averageLandmarkConfidence: number;
  framesCoverage: number; // Percentage of frames with detected pose
  analysisReliability: number; // Overall reliability score 0-1
  qualityIndicators: {
    lighting: 'good' | 'fair' | 'poor';
    visibility: 'clear' | 'partial' | 'occluded';
    stability: 'stable' | 'shaky' | 'very_shaky';
  };
}

// Progress tracking types
export interface ProgressMetrics {
  previousScores: number[];
  improvement: number; // Percentage improvement
  trend: 'improving' | 'stable' | 'declining';
  consistencyTrend: number; // 0-1
  strengthAreas: string[];
  weaknessAreas: string[];
}

export interface MovementComparison {
  idealPattern: PoseSequence;
  userPattern: PoseSequence;
  deviationScore: number; // 0-100, lower is better
  keyDifferences: string[];
  similarityIndex: number; // 0-1, higher is better
}

// Analysis report types
export interface AnalysisReport {
  id: string;
  userId: string;
  videoUri: string;
  exerciseType: ExerciseType | SportType;
  overallScore: number;
  keyMetrics: {
    formScore: number;
    consistency: number;
    rangeOfMotion: number;
    timing: number;
  };
  criticalIssues: FormError[];
  recommendations: string[];
  comparisonToIdeal?: MovementComparison;
  progressTracking?: ProgressMetrics;
  analysisDate: Date;
  processingMetrics: {
    processingTime: number;
    framesAnalyzed: number;
    averageConfidence: number;
  };
}

// Database storage types
export interface PoseAnalysisRecord {
  id: string;
  userId: string;
  videoUri: string;
  exerciseType: string;
  analysisResults: FormAnalysis;
  overallScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PoseLandmarkRecord {
  id: string;
  analysisId: string;
  frameIndex: number;
  timestampMs: number;
  landmarks: Landmark[];
  createdAt: Date;
}

// Service interface types
export interface VideoFrameProcessor {
  extractFrames(videoUri: string, options?: FrameExtractionOptions): Promise<VideoFrame[]>;
  processFrameSequence(frames: VideoFrame[]): Promise<PoseSequence>;
  detectPose(frameUri: string): Promise<PoseLandmarks | null>;
}

export interface FrameExtractionOptions {
  maxFrames?: number;
  frameRate?: number; // Frames per second to extract
  quality?: 'low' | 'medium' | 'high';
  startTime?: number; // Start extraction from this time (seconds)
  endTime?: number; // End extraction at this time (seconds)
}

export interface MovementAnalyzer {
  analyzeExercise(poseSequence: PoseSequence, exerciseType: ExerciseType): Promise<FormAnalysis>;
  analyzeSport(poseSequence: PoseSequence, sportType: SportType): Promise<FormAnalysis>;
  calculateAngles(landmarks: Landmark[]): JointAngles;
  trackMovementPattern(sequence: PoseSequence): MovementPattern;
  detectMovementPhases(sequence: PoseSequence, movementType: ExerciseType | SportType): MovementPhase[];
}

// Utility types
export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Vector3D extends Vector2D {
  z: number;
}

// Export all types for easy importing
export type PoseDetectionTypes = {
  Landmark,
  PoseLandmarks,
  VideoFrame,
  PoseSequence,
  ExerciseType,
  SportType,
  FormAnalysis,
  SquatAnalysis,
  PitchAnalysis,
  AnalysisResult,
  AnalysisError,
  AnalysisErrorType,
  PoseDetectionConfig,
  PerformanceConfig
};