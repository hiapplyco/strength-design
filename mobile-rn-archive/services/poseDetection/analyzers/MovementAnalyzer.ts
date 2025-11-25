/**
 * Base Movement Analyzer
 * Provides common utilities and base functionality for exercise-specific analyzers
 * Contains mathematical functions for biomechanical analysis
 */

import {
  PoseSequence,
  Landmark,
  JointAngles,
  MovementPhase,
  MovementPattern,
  FormError,
  FormSuggestion,
  Point2D,
  Vector2D
} from '../types';
import {
  POSE_LANDMARKS,
  ANALYSIS_THRESHOLDS,
  ERROR_SEVERITY_THRESHOLDS,
  PHASE_DETECTION_PARAMS
} from '../constants';

export abstract class MovementAnalyzer {
  protected confidenceThreshold = ANALYSIS_THRESHOLDS.MIN_CONFIDENCE_FOR_LANDMARK;
  protected minFramesRequired = ANALYSIS_THRESHOLDS.MIN_FRAMES_FOR_ANALYSIS;

  /**
   * Calculate the angle between three points (landmark positions)
   * Uses the law of cosines to determine joint angles
   * 
   * @param point1 - First landmark (e.g., shoulder)
   * @param vertex - Middle landmark (e.g., elbow) - the vertex of the angle
   * @param point3 - Third landmark (e.g., wrist)
   * @returns Angle in degrees (0-180)
   */
  protected calculateAngle(point1: Landmark, vertex: Landmark, point3: Landmark): number {
    // Ensure landmarks have sufficient confidence
    if (point1.inFrameLikelihood < this.confidenceThreshold ||
        vertex.inFrameLikelihood < this.confidenceThreshold ||
        point3.inFrameLikelihood < this.confidenceThreshold) {
      return 0;
    }

    // Create vectors from vertex to other points
    const vector1: Vector2D = {
      x: point1.x - vertex.x,
      y: point1.y - vertex.y
    };
    
    const vector3: Vector2D = {
      x: point3.x - vertex.x,
      y: point3.y - vertex.y
    };

    // Calculate magnitudes
    const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const mag3 = Math.sqrt(vector3.x * vector3.x + vector3.y * vector3.y);

    // Prevent division by zero
    if (mag1 === 0 || mag3 === 0) return 0;

    // Calculate dot product
    const dotProduct = vector1.x * vector3.x + vector1.y * vector3.y;
    
    // Calculate angle using dot product formula
    const cosAngle = dotProduct / (mag1 * mag3);
    
    // Clamp to prevent floating point errors
    const clampedCos = Math.max(-1, Math.min(1, cosAngle));
    
    // Return angle in degrees
    return Math.acos(clampedCos) * (180 / Math.PI);
  }

  /**
   * Calculate distance between two landmarks
   * Used for tracking movement patterns and ranges
   */
  protected calculateDistance(point1: Landmark, point2: Landmark): number {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate the slope angle of a line between two points relative to horizontal
   * Useful for measuring body segment orientations
   */
  protected calculateSlopeAngle(point1: Landmark, point2: Landmark): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  /**
   * Calculate joint angles for a single frame
   * Returns comprehensive joint angle measurements
   */
  protected calculateJointAngles(landmarks: Landmark[]): JointAngles {
    const angles: JointAngles = {
      leftKnee: 0,
      rightKnee: 0,
      leftHip: 0,
      rightHip: 0,
      leftShoulder: 0,
      rightShoulder: 0,
      leftElbow: 0,
      rightElbow: 0,
      spinalAlignment: 0
    };

    try {
      // Calculate knee angles (thigh-shin angle)
      angles.leftKnee = this.calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_HIP],
        landmarks[POSE_LANDMARKS.LEFT_KNEE],
        landmarks[POSE_LANDMARKS.LEFT_ANKLE]
      );

      angles.rightKnee = this.calculateAngle(
        landmarks[POSE_LANDMARKS.RIGHT_HIP],
        landmarks[POSE_LANDMARKS.RIGHT_KNEE],
        landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
      );

      // Calculate hip angles (torso-thigh angle)
      // Using midpoint of shoulders as reference for torso
      const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
      const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
      const shoulderMidpoint: Landmark = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2,
        inFrameLikelihood: Math.min(leftShoulder.inFrameLikelihood, rightShoulder.inFrameLikelihood)
      };

      angles.leftHip = this.calculateAngle(
        shoulderMidpoint,
        landmarks[POSE_LANDMARKS.LEFT_HIP],
        landmarks[POSE_LANDMARKS.LEFT_KNEE]
      );

      angles.rightHip = this.calculateAngle(
        shoulderMidpoint,
        landmarks[POSE_LANDMARKS.RIGHT_HIP],
        landmarks[POSE_LANDMARKS.RIGHT_KNEE]
      );

      // Calculate shoulder angles (upper arm-torso angle)
      angles.leftShoulder = this.calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_HIP],
        landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[POSE_LANDMARKS.LEFT_ELBOW]
      );

      angles.rightShoulder = this.calculateAngle(
        landmarks[POSE_LANDMARKS.RIGHT_HIP],
        landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
        landmarks[POSE_LANDMARKS.RIGHT_ELBOW]
      );

      // Calculate elbow angles (upper arm-forearm angle)
      angles.leftElbow = this.calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[POSE_LANDMARKS.LEFT_ELBOW],
        landmarks[POSE_LANDMARKS.LEFT_WRIST]
      );

      angles.rightElbow = this.calculateAngle(
        landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
        landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
        landmarks[POSE_LANDMARKS.RIGHT_WRIST]
      );

      // Calculate spinal alignment (shoulder-hip line angle from vertical)
      const hipMidpoint: Landmark = {
        x: (landmarks[POSE_LANDMARKS.LEFT_HIP].x + landmarks[POSE_LANDMARKS.RIGHT_HIP].x) / 2,
        y: (landmarks[POSE_LANDMARKS.LEFT_HIP].y + landmarks[POSE_LANDMARKS.RIGHT_HIP].y) / 2,
        inFrameLikelihood: Math.min(
          landmarks[POSE_LANDMARKS.LEFT_HIP].inFrameLikelihood,
          landmarks[POSE_LANDMARKS.RIGHT_HIP].inFrameLikelihood
        )
      };

      const spineAngle = this.calculateSlopeAngle(hipMidpoint, shoulderMidpoint);
      // Convert to degrees from vertical (90 degrees is perfectly upright)
      angles.spinalAlignment = Math.abs(90 - Math.abs(spineAngle));

    } catch (error) {
      console.error('Error calculating joint angles:', error);
    }

    return angles;
  }

  /**
   * Smooth movement data using a simple moving average
   * Reduces noise in pose detection data
   */
  protected smoothMovementData(values: number[], windowSize: number = 3): number[] {
    const smoothed: number[] = [];
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = 0; i < values.length; i++) {
      let sum = 0;
      let count = 0;

      for (let j = Math.max(0, i - halfWindow); j <= Math.min(values.length - 1, i + halfWindow); j++) {
        sum += values[j];
        count++;
      }

      smoothed[i] = sum / count;
    }

    return smoothed;
  }

  /**
   * Detect velocity changes to identify movement phases
   * Used for automatic phase detection in movements
   */
  protected calculateVelocity(positions: number[]): number[] {
    const velocities: number[] = [];
    
    for (let i = 1; i < positions.length; i++) {
      velocities.push(positions[i] - positions[i - 1]);
    }
    
    return velocities;
  }

  /**
   * Detect when velocity changes direction significantly
   * Indicates phase transitions (e.g., descent to ascent)
   */
  protected detectPhaseTransitions(velocities: number[], threshold: number = PHASE_DETECTION_PARAMS.MIN_MOVEMENT_VELOCITY): number[] {
    const transitions: number[] = [];
    const smoothedVelocities = this.smoothMovementData(velocities, PHASE_DETECTION_PARAMS.PHASE_TRANSITION_SMOOTHING);

    for (let i = 1; i < smoothedVelocities.length - 1; i++) {
      const prev = smoothedVelocities[i - 1];
      const curr = smoothedVelocities[i];
      const next = smoothedVelocities[i + 1];

      // Detect zero crossings (velocity direction changes)
      if ((prev > threshold && next < -threshold) || (prev < -threshold && next > threshold)) {
        transitions.push(i);
      }

      // Detect significant velocity minima/maxima
      if (Math.abs(curr) > threshold && 
          ((curr > prev && curr > next) || (curr < prev && curr < next))) {
        if (transitions.length === 0 || i - transitions[transitions.length - 1] > 5) {
          transitions.push(i);
        }
      }
    }

    return transitions;
  }

  /**
   * Calculate movement consistency score
   * Measures how similar each repetition is to others
   */
  protected calculateConsistencyScore(phases: MovementPhase[]): number {
    if (phases.length < 2) return 1.0;

    // Group phases by type
    const phasesByType: Record<string, MovementPhase[]> = {};
    phases.forEach(phase => {
      if (!phasesByType[phase.type]) {
        phasesByType[phase.type] = [];
      }
      phasesByType[phase.type].push(phase);
    });

    let totalVariation = 0;
    let typeCount = 0;

    // Calculate consistency for each phase type
    Object.values(phasesByType).forEach(typedPhases => {
      if (typedPhases.length < 2) return;

      const durations = typedPhases.map(p => p.duration || 0);
      const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
      const coefficientOfVariation = Math.sqrt(variance) / mean;

      totalVariation += coefficientOfVariation;
      typeCount++;
    });

    if (typeCount === 0) return 1.0;

    // Convert coefficient of variation to consistency score (0-1, higher is better)
    const avgVariation = totalVariation / typeCount;
    return Math.max(0, 1 - avgVariation);
  }

  /**
   * Calculate movement smoothness score
   * Measures how fluid the movement is (less jerky = higher score)
   */
  protected calculateSmoothnessScore(positions: number[]): number {
    if (positions.length < 3) return 1.0;

    const velocities = this.calculateVelocity(positions);
    const accelerations = this.calculateVelocity(velocities);

    // Calculate jerk (rate of change of acceleration)
    let totalJerk = 0;
    for (let i = 1; i < accelerations.length; i++) {
      totalJerk += Math.abs(accelerations[i] - accelerations[i - 1]);
    }

    // Normalize jerk by movement range and duration
    const range = Math.max(...positions) - Math.min(...positions);
    const normalizedJerk = totalJerk / (range * positions.length);

    // Convert to smoothness score (lower jerk = higher smoothness)
    return Math.max(0, 1 - Math.min(1, normalizedJerk / 10));
  }

  /**
   * Validate that essential landmarks are detected with sufficient confidence
   * Returns true if the pose data is suitable for analysis
   */
  protected validatePoseData(landmarks: Landmark[], requiredLandmarks: number[]): boolean {
    if (!landmarks || landmarks.length === 0) return false;

    let validCount = 0;
    for (const landmarkIndex of requiredLandmarks) {
      if (landmarks[landmarkIndex] && landmarks[landmarkIndex].inFrameLikelihood >= this.confidenceThreshold) {
        validCount++;
      }
    }

    // Require at least 80% of critical landmarks to be detected
    return validCount >= requiredLandmarks.length * 0.8;
  }

  /**
   * Calculate the center of mass based on key body landmarks
   * Useful for balance and stability analysis
   */
  protected calculateCenterOfMass(landmarks: Landmark[]): Point2D {
    const keyPoints = [
      landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
      landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
      landmarks[POSE_LANDMARKS.LEFT_HIP],
      landmarks[POSE_LANDMARKS.RIGHT_HIP]
    ].filter(landmark => landmark && landmark.inFrameLikelihood >= this.confidenceThreshold);

    if (keyPoints.length === 0) return { x: 0, y: 0 };

    const centerX = keyPoints.reduce((sum, point) => sum + point.x, 0) / keyPoints.length;
    const centerY = keyPoints.reduce((sum, point) => sum + point.y, 0) / keyPoints.length;

    return { x: centerX, y: centerY };
  }

  /**
   * Determine error severity based on deviation from ideal values
   */
  protected determineErrorSeverity(deviation: number, type: 'knee' | 'spinal' | 'depth' | 'tempo'): 'low' | 'medium' | 'high' {
    const thresholds = ERROR_SEVERITY_THRESHOLDS;
    
    switch (type) {
      case 'knee':
        if (deviation <= thresholds.LOW.KNEE_DEVIATION) return 'low';
        if (deviation <= thresholds.MEDIUM.KNEE_DEVIATION) return 'medium';
        return 'high';
      
      case 'spinal':
        if (deviation <= thresholds.LOW.SPINAL_DEVIATION) return 'low';
        if (deviation <= thresholds.MEDIUM.SPINAL_DEVIATION) return 'medium';
        return 'high';
      
      case 'depth':
        if (deviation <= thresholds.LOW.DEPTH_SHORTAGE) return 'low';
        if (deviation <= thresholds.MEDIUM.DEPTH_SHORTAGE) return 'medium';
        return 'high';
      
      case 'tempo':
        if (deviation <= thresholds.LOW.TEMPO_VARIATION) return 'low';
        if (deviation <= thresholds.MEDIUM.TEMPO_VARIATION) return 'medium';
        return 'high';
      
      default:
        return 'medium';
    }
  }

  /**
   * Create standardized form error objects
   */
  protected createFormError(
    type: FormError['type'],
    severity: FormError['severity'],
    timeRange: [number, number],
    description: string,
    correction: string,
    affectedLandmarks: number[] = []
  ): FormError {
    return {
      type,
      severity,
      timeRange,
      description,
      correction,
      affectedLandmarks
    };
  }

  /**
   * Create standardized form suggestion objects
   */
  protected createFormSuggestion(
    category: FormSuggestion['category'],
    priority: FormSuggestion['priority'],
    suggestion: string,
    expectedImprovement: string
  ): FormSuggestion {
    return {
      category,
      priority,
      suggestion,
      expectedImprovement
    };
  }

  /**
   * Calculate Range of Motion (ROM) for a joint throughout the movement
   */
  protected calculateRangeOfMotion(angles: number[]): { min: number; max: number; range: number } {
    if (angles.length === 0) return { min: 0, max: 0, range: 0 };
    
    const validAngles = angles.filter(angle => angle > 0); // Filter out invalid angles
    if (validAngles.length === 0) return { min: 0, max: 0, range: 0 };
    
    const min = Math.min(...validAngles);
    const max = Math.max(...validAngles);
    const range = max - min;
    
    return { min, max, range };
  }

  /**
   * Abstract method to be implemented by specific exercise analyzers
   */
  abstract analyzeMovement(poseSequence: PoseSequence): Promise<any>;

  /**
   * Abstract method for exercise-specific phase detection
   */
  abstract detectMovementPhases(poseSequence: PoseSequence): MovementPhase[];
}