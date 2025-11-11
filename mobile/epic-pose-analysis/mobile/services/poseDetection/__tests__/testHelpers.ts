/**
 * Test Helpers for Pose Analysis Tests
 * Utilities for creating mock data and test fixtures
 */

import { PoseLandmarks, VideoFrame, AnalysisResult, ExerciseType } from '../types';

/**
 * Create mock video URI
 */
export const createMockVideoUri = (duration: number = 60): string => {
  return `file:///mock/test-video-${duration}s.mp4`;
};

/**
 * Create mock pose landmarks with configurable parameters
 */
export const createMockLandmarks = (options: {
  exerciseType?: ExerciseType;
  quality?: 'good' | 'poor';
  phase?: 'start' | 'middle' | 'end';
} = {}): PoseLandmarks => {
  const { exerciseType = 'squat', quality = 'good', phase = 'middle' } = options;

  const confidenceScore = quality === 'good' ? 0.92 : 0.65;

  // Base landmarks (all 33 pose landmarks)
  const landmarks = Array.from({ length: 33 }, (_, i) => ({
    x: 0.5 + (Math.random() - 0.5) * 0.1,
    y: 0.5 + (Math.random() - 0.5) * 0.1,
    z: 0.0 + (Math.random() - 0.5) * 0.05,
    visibility: quality === 'good' ? 0.95 : 0.70,
    presence: quality === 'good' ? 0.98 : 0.75
  }));

  // Adjust based on exercise type and phase
  if (exerciseType === 'squat') {
    if (phase === 'middle') {
      // Bottom of squat - hips lower
      landmarks[23].y = 0.65; // left hip
      landmarks[24].y = 0.65; // right hip
      landmarks[25].y = 0.75; // left knee
      landmarks[26].y = 0.75; // right knee
    }
  }

  return {
    landmarks,
    timestamp: Date.now(),
    frameNumber: Math.floor(Math.random() * 100),
    confidence: confidenceScore
  };
};

/**
 * Create a sequence of mock landmarks for a full exercise
 */
export const createMockLandmarkSequence = (
  exerciseType: ExerciseType,
  frameCount: number = 30
): PoseLandmarks[] => {
  const sequence: PoseLandmarks[] = [];

  for (let i = 0; i < frameCount; i++) {
    const phase = i < frameCount / 3 ? 'start' :
                  i < (2 * frameCount) / 3 ? 'middle' : 'end';

    sequence.push(createMockLandmarks({
      exerciseType,
      quality: 'good',
      phase: phase as any
    }));
  }

  return sequence;
};

/**
 * Create mock squat landmarks with specific form characteristics
 */
export const createMockSquatLandmarks = (options: {
  depth?: 'shallow' | 'parallel' | 'deep';
  kneeValgus?: boolean;
  backAngle?: number;
} = {}): PoseLandmarks => {
  const { depth = 'parallel', kneeValgus = false, backAngle = 75 } = options;

  const landmarks = createMockLandmarks({ exerciseType: 'squat', phase: 'middle' }).landmarks;

  // Adjust depth
  const depthY = depth === 'shallow' ? 0.55 : depth === 'parallel' ? 0.65 : 0.75;
  landmarks[23].y = depthY; // left hip
  landmarks[24].y = depthY; // right hip

  // Adjust knee valgus
  if (kneeValgus) {
    landmarks[25].x = 0.45; // left knee inward
    landmarks[26].x = 0.55; // right knee inward
  }

  return {
    landmarks,
    timestamp: Date.now(),
    frameNumber: 15,
    confidence: 0.92
  };
};

/**
 * Create mock deadlift landmarks with specific form characteristics
 */
export const createMockDeadliftLandmarks = (options: {
  hipHinge?: boolean;
  backRounded?: boolean;
  barPath?: 'straight' | 'forward';
} = {}): PoseLandmarks => {
  const { hipHinge = true, backRounded = false, barPath = 'straight' } = options;

  const landmarks = createMockLandmarks({ exerciseType: 'deadlift', phase: 'middle' }).landmarks;

  // Adjust hip hinge
  if (!hipHinge) {
    landmarks[23].y = 0.70; // hips too low (squat pattern)
  }

  // Adjust back rounding
  if (backRounded) {
    landmarks[11].z = 0.1; // shoulders forward
    landmarks[12].z = 0.1;
  }

  return {
    landmarks,
    timestamp: Date.now(),
    frameNumber: 15,
    confidence: 0.90
  };
};

/**
 * Create mock push-up landmarks
 */
export const createMockPushUpLandmarks = (options: {
  depth?: 'shallow' | 'full';
  elbowFlare?: boolean;
  saggyHips?: boolean;
} = {}): PoseLandmarks => {
  const { depth = 'full', elbowFlare = false, saggyHips = false } = options;

  const landmarks = createMockLandmarks({ exerciseType: 'push_up', phase: 'middle' }).landmarks;

  // Adjust depth
  if (depth === 'shallow') {
    landmarks[11].y = 0.45; // shoulders higher
    landmarks[12].y = 0.45;
  } else {
    landmarks[11].y = 0.55; // shoulders lower (deep)
    landmarks[12].y = 0.55;
  }

  // Adjust elbow flare
  if (elbowFlare) {
    landmarks[13].x = 0.35; // left elbow out
    landmarks[14].x = 0.65; // right elbow out
  }

  // Adjust hip sag
  if (saggyHips) {
    landmarks[23].y = 0.65; // hips drop
    landmarks[24].y = 0.65;
  }

  return {
    landmarks,
    timestamp: Date.now(),
    frameNumber: 15,
    confidence: 0.91
  };
};

/**
 * Create mock video frames
 */
export const createMockVideoFrames = (count: number = 30): VideoFrame[] => {
  return Array.from({ length: count }, (_, i) => ({
    uri: `file:///mock/frame-${i}.jpg`,
    timestamp: i * 33, // ~30fps
    frameNumber: i,
    width: 1920,
    height: 1080
  }));
};

/**
 * Create mock analysis result
 */
export const createMockAnalysisResult = (options: {
  exerciseType?: ExerciseType;
  score?: number;
  success?: boolean;
} = {}): AnalysisResult => {
  const {
    exerciseType = 'squat',
    score = 85,
    success = true
  } = options;

  return {
    id: `test-analysis-${Date.now()}`,
    userId: 'test-user-123',
    exerciseType,
    videoUri: createMockVideoUri(),
    analysisScore: score,
    feedback: [
      {
        id: '1',
        type: 'correction',
        severity: 'medium',
        area: 'depth',
        message: 'Try to squat slightly deeper',
        suggestion: 'Aim for hips parallel to knees',
        timestamp: 5000
      },
      {
        id: '2',
        type: 'positive',
        severity: 'low',
        area: 'knees',
        message: 'Excellent knee tracking',
        suggestion: 'Keep maintaining this form',
        timestamp: 7000
      }
    ],
    landmarks: createMockLandmarkSequence(exerciseType, 30),
    timestamp: new Date().toISOString(),
    processingTimeMs: 25000,
    success,
    metadata: {
      videoLength: 60,
      framesAnalyzed: 30,
      averageConfidence: 0.92,
      deviceTier: 'medium',
      appVersion: '2.5.0'
    }
  };
};

/**
 * Create mock progress callback
 */
export const createMockProgressCallback = () => {
  const calls: any[] = [];

  const callback = jest.fn((progress) => {
    calls.push(progress);
  });

  return { callback, calls };
};

/**
 * Wait for async operations
 */
export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Mock file info
 */
export const createMockFileInfo = (duration: number = 60) => {
  return {
    exists: true,
    uri: createMockVideoUri(duration),
    size: duration * 500000, // ~500KB per second
    isDirectory: false,
    modificationTime: Date.now(),
    md5: 'test-hash-123'
  };
};
