/**
 * Pose Detection Constants
 * Pose landmark constants and configurations for Google ML Kit integration
 */

// Google ML Kit Pose Landmark Indices
export const POSE_LANDMARKS = {
  // Facial landmarks
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,

  // Upper body
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,

  // Lower body
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32
} as const;

// Landmark groups for easier analysis
export const LANDMARK_GROUPS = {
  FACE: [
    POSE_LANDMARKS.NOSE,
    POSE_LANDMARKS.LEFT_EYE_INNER,
    POSE_LANDMARKS.LEFT_EYE,
    POSE_LANDMARKS.LEFT_EYE_OUTER,
    POSE_LANDMARKS.RIGHT_EYE_INNER,
    POSE_LANDMARKS.RIGHT_EYE,
    POSE_LANDMARKS.RIGHT_EYE_OUTER,
    POSE_LANDMARKS.LEFT_EAR,
    POSE_LANDMARKS.RIGHT_EAR,
    POSE_LANDMARKS.MOUTH_LEFT,
    POSE_LANDMARKS.MOUTH_RIGHT
  ],
  
  UPPER_BODY: [
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.LEFT_ELBOW,
    POSE_LANDMARKS.RIGHT_ELBOW,
    POSE_LANDMARKS.LEFT_WRIST,
    POSE_LANDMARKS.RIGHT_WRIST
  ],
  
  HANDS: [
    POSE_LANDMARKS.LEFT_PINKY,
    POSE_LANDMARKS.RIGHT_PINKY,
    POSE_LANDMARKS.LEFT_INDEX,
    POSE_LANDMARKS.RIGHT_INDEX,
    POSE_LANDMARKS.LEFT_THUMB,
    POSE_LANDMARKS.RIGHT_THUMB
  ],
  
  LOWER_BODY: [
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.LEFT_KNEE,
    POSE_LANDMARKS.RIGHT_KNEE,
    POSE_LANDMARKS.LEFT_ANKLE,
    POSE_LANDMARKS.RIGHT_ANKLE
  ],
  
  FEET: [
    POSE_LANDMARKS.LEFT_HEEL,
    POSE_LANDMARKS.RIGHT_HEEL,
    POSE_LANDMARKS.LEFT_FOOT_INDEX,
    POSE_LANDMARKS.RIGHT_FOOT_INDEX
  ]
} as const;

// Critical landmarks for specific exercises
export const EXERCISE_CRITICAL_LANDMARKS = {
  SQUAT: [
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.LEFT_KNEE,
    POSE_LANDMARKS.RIGHT_KNEE,
    POSE_LANDMARKS.LEFT_ANKLE,
    POSE_LANDMARKS.RIGHT_ANKLE,
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER
  ],
  
  DEADLIFT: [
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.LEFT_KNEE,
    POSE_LANDMARKS.RIGHT_KNEE,
    POSE_LANDMARKS.LEFT_ANKLE,
    POSE_LANDMARKS.RIGHT_ANKLE,
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.LEFT_WRIST,
    POSE_LANDMARKS.RIGHT_WRIST
  ],
  
  PUSH_UP: [
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.LEFT_ELBOW,
    POSE_LANDMARKS.RIGHT_ELBOW,
    POSE_LANDMARKS.LEFT_WRIST,
    POSE_LANDMARKS.RIGHT_WRIST,
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.LEFT_ANKLE,
    POSE_LANDMARKS.RIGHT_ANKLE
  ],
  
  BENCH_PRESS: [
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.LEFT_ELBOW,
    POSE_LANDMARKS.RIGHT_ELBOW,
    POSE_LANDMARKS.LEFT_WRIST,
    POSE_LANDMARKS.RIGHT_WRIST
  ]
} as const;

// Default configuration values
export const DEFAULT_POSE_CONFIG = {
  mode: 'accurate' as const,
  detectAllPoses: false,
  enableTracking: true,
  confidenceThreshold: 0.7,
  frameSkip: 2, // Process every 2nd frame
  batchSize: 30,
  useWorkerThread: true
} as const;

export const PERFORMANCE_CONFIG = {
  frameSkip: 2, // Process every 2nd frame for 15fps analysis
  confidenceThreshold: 0.7,
  batchSize: 30, // Process frames in batches
  useWorkerThread: true,
  maxVideoLength: 60, // 60 seconds max
  maxFileSize: 100 * 1024 * 1024, // 100MB max
  processingTimeout: 30000 // 30 seconds timeout
} as const;

// Analysis thresholds and scoring constants
export const ANALYSIS_THRESHOLDS = {
  // General thresholds
  MIN_FRAMES_FOR_ANALYSIS: 15,
  MIN_CONFIDENCE_FOR_LANDMARK: 0.6,
  MIN_POSE_COVERAGE: 0.8, // 80% of frames must have pose detected
  
  // Squat-specific thresholds
  SQUAT: {
    PARALLEL_HIP_ANGLE: 90, // Degrees
    GOOD_DEPTH_HIP_ANGLE: 85, // Below parallel
    MAX_KNEE_INWARD_DEVIATION: 15, // Degrees
    MAX_FORWARD_LEAN: 45, // Degrees from vertical
    MIN_DESCENT_DURATION: 1.0, // Seconds
    MAX_DESCENT_DURATION: 4.0, // Seconds
    IDEAL_TEMPO_RATIO: 2.0 // Descent:Ascent ratio
  },
  
  // Deadlift-specific thresholds
  DEADLIFT: {
    MAX_BACK_ROUNDING: 20, // Degrees
    MAX_BAR_FORWARD_DRIFT: 50, // Pixels
    MIN_HIP_HINGE_ANGLE: 45, // Degrees
    IDEAL_BAR_PATH_DEVIATION: 30 // Pixels
  },
  
  // Push-up specific thresholds
  PUSH_UP: {
    MIN_CHEST_DROP: 0.8, // 80% of full range
    MAX_HIP_SAG: 15, // Degrees
    MAX_HIP_PIKE: 15, // Degrees
    IDEAL_BODY_LINE_ANGLE: 5 // Degrees from straight
  }
} as const;

// Scoring weights for different analysis components
export const SCORING_WEIGHTS = {
  SQUAT: {
    DEPTH: 0.25,
    KNEE_ALIGNMENT: 0.2,
    SPINAL_ALIGNMENT: 0.2,
    BALANCE: 0.15,
    TEMPO: 0.1,
    CONSISTENCY: 0.1
  },
  
  DEADLIFT: {
    SPINAL_ALIGNMENT: 0.3,
    BAR_PATH: 0.25,
    HIP_HINGE: 0.2,
    KNEE_ALIGNMENT: 0.15,
    SETUP: 0.1
  },
  
  PUSH_UP: {
    RANGE_OF_MOTION: 0.3,
    BODY_ALIGNMENT: 0.25,
    ELBOW_POSITION: 0.2,
    CORE_STABILITY: 0.15,
    TEMPO: 0.1
  }
} as const;

// Error severity definitions
export const ERROR_SEVERITY_THRESHOLDS = {
  LOW: {
    KNEE_DEVIATION: 10, // Degrees
    SPINAL_DEVIATION: 15, // Degrees
    DEPTH_SHORTAGE: 10, // Degrees from parallel
    TEMPO_VARIATION: 0.5 // Seconds
  },
  
  MEDIUM: {
    KNEE_DEVIATION: 20,
    SPINAL_DEVIATION: 25,
    DEPTH_SHORTAGE: 20,
    TEMPO_VARIATION: 1.0
  },
  
  HIGH: {
    KNEE_DEVIATION: 30,
    SPINAL_DEVIATION: 35,
    DEPTH_SHORTAGE: 30,
    TEMPO_VARIATION: 2.0
  }
} as const;

// Movement phase detection parameters
export const PHASE_DETECTION_PARAMS = {
  // Velocity thresholds for phase transitions (pixels/frame)
  MIN_MOVEMENT_VELOCITY: 2,
  PHASE_TRANSITION_SMOOTHING: 3, // Frames to smooth over
  
  // Hip height change thresholds for squat phases
  SQUAT_DESCENT_THRESHOLD: -3, // Pixels per frame
  SQUAT_ASCENT_THRESHOLD: 3,
  SQUAT_BOTTOM_HOLD_FRAMES: 5,
  
  // Pitch phase timing windows (as percentage of total movement)
  PITCH_PHASES: {
    WINDUP: [0, 0.25],
    STRIDE: [0.25, 0.45],
    ARM_COCKING: [0.45, 0.65],
    ACCELERATION: [0.65, 0.85],
    FOLLOW_THROUGH: [0.85, 1.0]
  }
} as const;

// Video processing constants
export const VIDEO_PROCESSING = {
  SUPPORTED_FORMATS: ['mp4', 'mov', 'avi', 'mkv'],
  DEFAULT_EXTRACTION_FPS: 15,
  MAX_FRAME_RESOLUTION: 720, // Max height in pixels
  JPEG_QUALITY: 0.8,
  FRAME_BATCH_SIZE: 10,
  
  // Frame extraction options
  FRAME_EXTRACTION: {
    QUALITY_LOW: { fps: 10, resolution: 480 },
    QUALITY_MEDIUM: { fps: 15, resolution: 720 },
    QUALITY_HIGH: { fps: 30, resolution: 1080 }
  }
} as const;

// Error messages and descriptions
export const ERROR_MESSAGES = {
  INSUFFICIENT_POSE_DATA: 'Not enough pose data detected in video. Ensure good lighting and clear view of the person.',
  LOW_CONFIDENCE_LANDMARKS: 'Pose detection confidence is too low. Try recording with better lighting or different angle.',
  INCOMPLETE_MOVEMENT: 'The movement appears incomplete. Ensure the entire exercise is captured in the video.',
  PROCESSING_TIMEOUT: 'Video processing took too long. Try a shorter video or reduce quality.',
  VIDEO_FORMAT_UNSUPPORTED: 'Video format not supported. Please use MP4, MOV, AVI, or MKV format.',
  FILE_TOO_LARGE: 'Video file is too large. Please use a video under 100MB.',
  POSE_DETECTION_FAILED: 'Failed to detect pose in video. Ensure person is clearly visible.',
  INVALID_EXERCISE_TYPE: 'Exercise type not recognized. Please select a supported exercise type.'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  ANALYSIS_COMPLETE: 'Pose analysis completed successfully',
  GOOD_FORM_DETECTED: 'Excellent form detected!',
  IMPROVEMENT_IDENTIFIED: 'Areas for improvement identified',
  PROGRESS_TRACKED: 'Progress compared to previous sessions'
} as const;

// Color schemes for visualization
export const POSE_COLORS = {
  LANDMARKS: {
    FACE: '#FF6B6B',
    UPPER_BODY: '#4ECDC4',
    LOWER_BODY: '#45B7D1',
    HANDS: '#FFA07A',
    FEET: '#98D8C8'
  },
  
  SKELETON_CONNECTIONS: {
    GOOD: '#4CAF50',
    WARNING: '#FF9800',
    ERROR: '#F44336'
  },
  
  ANALYSIS_FEEDBACK: {
    EXCELLENT: '#4CAF50',
    GOOD: '#8BC34A',
    FAIR: '#FFC107',
    POOR: '#FF5722',
    CRITICAL: '#F44336'
  }
} as const;

// Landmark connection pairs for skeleton visualization
export const POSE_CONNECTIONS = [
  // Face
  [POSE_LANDMARKS.LEFT_EAR, POSE_LANDMARKS.LEFT_EYE_OUTER],
  [POSE_LANDMARKS.LEFT_EYE_OUTER, POSE_LANDMARKS.LEFT_EYE],
  [POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.LEFT_EYE_INNER],
  [POSE_LANDMARKS.LEFT_EYE_INNER, POSE_LANDMARKS.NOSE],
  [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.RIGHT_EYE_INNER],
  [POSE_LANDMARKS.RIGHT_EYE_INNER, POSE_LANDMARKS.RIGHT_EYE],
  [POSE_LANDMARKS.RIGHT_EYE, POSE_LANDMARKS.RIGHT_EYE_OUTER],
  [POSE_LANDMARKS.RIGHT_EYE_OUTER, POSE_LANDMARKS.RIGHT_EAR],
  [POSE_LANDMARKS.MOUTH_LEFT, POSE_LANDMARKS.MOUTH_RIGHT],

  // Shoulders
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],

  // Left arm
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],

  // Right arm
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],

  // Left hand
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_THUMB],
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_PINKY],
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_INDEX],

  // Right hand
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_THUMB],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_PINKY],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_INDEX],

  // Torso
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],

  // Left leg
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],

  // Right leg
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],

  // Left foot
  [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_HEEL],
  [POSE_LANDMARKS.LEFT_HEEL, POSE_LANDMARKS.LEFT_FOOT_INDEX],

  // Right foot
  [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_HEEL],
  [POSE_LANDMARKS.RIGHT_HEEL, POSE_LANDMARKS.RIGHT_FOOT_INDEX]
] as const;

// Exercise form guidelines
export const FORM_GUIDELINES = {
  SQUAT: {
    depth: 'Hip crease should reach below knee level',
    knees: 'Knees should track over toes, avoid inward collapse',
    back: 'Maintain neutral spine, slight forward lean is normal',
    feet: 'Keep feet flat, weight distributed evenly'
  },
  
  DEADLIFT: {
    back: 'Keep back straight and neutral throughout movement',
    bar: 'Bar should stay close to body, vertical bar path',
    hips: 'Initiate movement with hip hinge, not knee bend',
    setup: 'Shoulders over bar, arms straight'
  },
  
  PUSH_UP: {
    body: 'Maintain straight line from head to feet',
    range: 'Lower chest to near floor level',
    elbows: 'Keep elbows at 45-degree angle to body',
    core: 'Engage core to prevent hip sag or pike'
  }
} as const;

// Export all constants for easy importing
export const POSE_DETECTION_CONSTANTS = {
  POSE_LANDMARKS,
  LANDMARK_GROUPS,
  EXERCISE_CRITICAL_LANDMARKS,
  DEFAULT_POSE_CONFIG,
  PERFORMANCE_CONFIG,
  ANALYSIS_THRESHOLDS,
  SCORING_WEIGHTS,
  ERROR_SEVERITY_THRESHOLDS,
  PHASE_DETECTION_PARAMS,
  VIDEO_PROCESSING,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  POSE_COLORS,
  POSE_CONNECTIONS,
  FORM_GUIDELINES
} as const;