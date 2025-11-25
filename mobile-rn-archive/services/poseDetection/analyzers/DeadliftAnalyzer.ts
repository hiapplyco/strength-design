/**
 * Deadlift Movement Analyzer
 * Comprehensive biomechanical analysis for deadlift movements
 * Analyzes bar path, hip hinge mechanics, spinal alignment, and setup position
 */

import { MovementAnalyzer } from './MovementAnalyzer';
import {
  PoseSequence,
  FormAnalysis,
  MovementPhase,
  FormError,
  FormSuggestion,
  JointAngles,
  MovementPattern,
  MovementTiming,
  Landmark,
  Point2D
} from '../types';
import {
  POSE_LANDMARKS,
  ANALYSIS_THRESHOLDS,
  SCORING_WEIGHTS,
  PHASE_DETECTION_PARAMS,
  EXERCISE_CRITICAL_LANDMARKS
} from '../constants';

// Deadlift-specific analysis interfaces
interface DeadliftAnalysis extends FormAnalysis {
  barPath: BarPathAnalysis;
  hipHinge: HipHingeAnalysis;
  setupPosition: SetupAnalysis;
  lockoutPosition: LockoutAnalysis;
  phases: DeadliftPhase[];
}

interface BarPathAnalysis {
  verticalDeviation: number; // Maximum horizontal bar drift
  pathEfficiency: number; // 0-100 score
  straightness: number; // 0-1 linearity score
  totalDistance: number; // Total bar travel distance
  optimalPath: Point2D[]; // Ideal vertical path
  actualPath: Point2D[]; // Actual bar path
}

interface HipHingeAnalysis {
  hipDominance: number; // 0-100, higher = more hip dominant
  kneeForwardTravel: number; // Knee forward movement during lift
  hipHingeAngle: number; // Maximum hip hinge angle
  hipHingeScore: number; // 0-100 movement quality score
}

interface SetupAnalysis {
  barPosition: 'optimal' | 'too_far' | 'too_close';
  shoulderPosition: 'over_bar' | 'behind_bar' | 'ahead_bar';
  backAngle: number; // Back angle at setup
  setupScore: number; // 0-100 overall setup quality
}

interface LockoutAnalysis {
  hipExtension: number; // Hip extension at lockout
  shoulderPosition: 'aligned' | 'forward' | 'backward';
  lockoutScore: number; // 0-100 lockout quality
}

interface DeadliftPhase extends MovementPhase {
  type: 'setup' | 'liftoff' | 'knee_pass' | 'lockout' | 'descent';
  barHeight: number;
  hipAngle: number;
  kneeAngle: number;
  backAngle: number;
}

export class DeadliftAnalyzer extends MovementAnalyzer {
  private readonly DEADLIFT_THRESHOLDS = ANALYSIS_THRESHOLDS.DEADLIFT;
  private readonly DEADLIFT_WEIGHTS = SCORING_WEIGHTS.DEADLIFT;

  /**
   * Main analysis method for deadlift movement
   */
  async analyzeMovement(poseSequence: PoseSequence): Promise<DeadliftAnalysis> {
    // Validate input data
    if (!this.validateDeadliftData(poseSequence)) {
      throw new Error('Insufficient pose data for deadlift analysis');
    }

    // Calculate joint angles for each frame
    const jointAnglesSequence = poseSequence.map(frame => 
      this.calculateJointAngles(frame.landmarks)
    );

    // Detect movement phases
    const phases = this.detectDeadliftPhases(poseSequence);

    // Analyze bar path throughout movement
    const barPath = this.analyzeBarPath(poseSequence, phases);

    // Analyze hip hinge mechanics
    const hipHinge = this.analyzeHipHinge(poseSequence, jointAnglesSequence, phases);

    // Analyze setup position
    const setupPosition = this.analyzeSetupPosition(poseSequence, phases);

    // Analyze lockout position
    const lockoutPosition = this.analyzeLockoutPosition(poseSequence, phases);

    // Analyze timing and tempo
    const timing = this.analyzeMovementTiming(phases);

    // Analyze overall movement pattern
    const movementPattern = this.analyzeMovementPattern(poseSequence, phases);

    // Identify form errors
    const criticalErrors = this.identifyDeadliftErrors(
      barPath, hipHinge, setupPosition, lockoutPosition, phases
    );

    // Generate improvement suggestions
    const improvements = this.generateDeadliftSuggestions(
      barPath, hipHinge, setupPosition, lockoutPosition
    );

    // Calculate overall score
    const overallScore = this.calculateOverallDeadliftScore(
      barPath, hipHinge, setupPosition, lockoutPosition, timing, movementPattern
    );

    // Calculate confidence score
    const confidenceScore = this.calculateConfidenceScore(poseSequence);

    return {
      overallScore,
      criticalErrors,
      improvements,
      keyPhases: phases,
      timing,
      jointAngles: jointAnglesSequence,
      movementPattern,
      confidenceScore,
      barPath,
      hipHinge,
      setupPosition,
      lockoutPosition,
      phases: phases as DeadliftPhase[]
    };
  }

  /**
   * Detect deadlift-specific movement phases
   */
  detectMovementPhases(poseSequence: PoseSequence): MovementPhase[] {
    const barPositions = this.extractBarPath(poseSequence);
    const barHeights = barPositions.map(pos => pos.y);

    // Smooth bar height data
    const smoothedHeights = this.smoothMovementData(barHeights, 3);
    const velocities = this.calculateVelocity(smoothedHeights);
    const smoothedVelocities = this.smoothMovementData(velocities, 3);

    const phases: DeadliftPhase[] = [];
    let currentPhase: 'setup' | 'liftoff' | 'knee_pass' | 'lockout' | 'descent' = 'setup';
    let phaseStartFrame = 0;

    // Find the lowest and highest bar positions
    const minHeight = Math.min(...smoothedHeights);
    const maxHeight = Math.max(...smoothedHeights);
    const totalRange = maxHeight - minHeight;

    for (let i = 1; i < smoothedVelocities.length; i++) {
      const velocity = smoothedVelocities[i];
      const barHeight = smoothedHeights[i];
      const frame = poseSequence[i];
      
      // Calculate angles for this frame
      const angles = this.calculateJointAngles(frame.landmarks);
      const hipAngle = (angles.leftHip + angles.rightHip) / 2;
      const kneeAngle = (angles.leftKnee + angles.rightKnee) / 2;
      const backAngle = this.calculateBackAngle(frame.landmarks);

      switch (currentPhase) {
        case 'setup':
          // Detect liftoff (upward bar movement)
          if (velocity < -2) { // Negative velocity = upward movement
            this.finalizeDeadliftPhase(phases, currentPhase, phaseStartFrame, i, barHeight, hipAngle, kneeAngle, backAngle, frame.timestamp);
            currentPhase = 'liftoff';
            phaseStartFrame = i;
          }
          break;

        case 'liftoff':
          // Detect knee pass (bar passes knee level, typically around 30-40% of total range)
          if (barHeight <= minHeight + totalRange * 0.35) {
            this.finalizeDeadliftPhase(phases, currentPhase, phaseStartFrame, i, barHeight, hipAngle, kneeAngle, backAngle, frame.timestamp);
            currentPhase = 'knee_pass';
            phaseStartFrame = i;
          }
          break;

        case 'knee_pass':
          // Detect lockout (minimal upward velocity, near maximum height)
          if (Math.abs(velocity) < 1 && barHeight <= minHeight + totalRange * 0.8) {
            this.finalizeDeadliftPhase(phases, currentPhase, phaseStartFrame, i, barHeight, hipAngle, kneeAngle, backAngle, frame.timestamp);
            currentPhase = 'lockout';
            phaseStartFrame = i;
          }
          break;

        case 'lockout':
          // Detect start of descent (downward movement)
          if (velocity > 2) { // Positive velocity = downward movement
            this.finalizeDeadliftPhase(phases, currentPhase, phaseStartFrame, i, barHeight, hipAngle, kneeAngle, backAngle, frame.timestamp);
            currentPhase = 'descent';
            phaseStartFrame = i;
          }
          break;

        case 'descent':
          // Continue until end of movement
          break;
      }
    }

    // Finalize the last phase
    const lastFrame = poseSequence[poseSequence.length - 1];
    const lastAngles = this.calculateJointAngles(lastFrame.landmarks);
    this.finalizeDeadliftPhase(
      phases, currentPhase, phaseStartFrame, poseSequence.length - 1,
      smoothedHeights[smoothedHeights.length - 1],
      (lastAngles.leftHip + lastAngles.rightHip) / 2,
      (lastAngles.leftKnee + lastAngles.rightKnee) / 2,
      this.calculateBackAngle(lastFrame.landmarks),
      lastFrame.timestamp
    );

    return phases;
  }

  /**
   * Helper method to finalize deadlift phases
   */
  private finalizeDeadliftPhase(
    phases: DeadliftPhase[],
    type: 'setup' | 'liftoff' | 'knee_pass' | 'lockout' | 'descent',
    startFrame: number,
    endFrame: number,
    barHeight: number,
    hipAngle: number,
    kneeAngle: number,
    backAngle: number,
    timestamp: number
  ): void {
    const duration = (endFrame - startFrame) * (1000 / 30); // Assuming ~30fps

    phases.push({
      type,
      startFrame,
      endFrame,
      duration,
      barHeight,
      hipAngle,
      kneeAngle,
      backAngle,
      keyMetrics: {
        averageBarHeight: barHeight,
        averageHipAngle: hipAngle,
        averageKneeAngle: kneeAngle,
        averageBackAngle: backAngle
      }
    });
  }

  /**
   * Calculate back angle relative to vertical
   */
  private calculateBackAngle(landmarks: Landmark[]): number {
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

    if (!this.validateLandmarkConfidence([leftShoulder, rightShoulder, leftHip, rightHip])) {
      return 0;
    }

    // Calculate midpoints
    const shoulderMidpoint = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
    const hipMidpoint = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };

    // Calculate angle from vertical
    const dx = shoulderMidpoint.x - hipMidpoint.x;
    const dy = shoulderMidpoint.y - hipMidpoint.y;
    
    return Math.atan2(Math.abs(dx), Math.abs(dy)) * (180 / Math.PI);
  }

  /**
   * Extract bar path from hand/wrist positions
   */
  private extractBarPath(poseSequence: PoseSequence): Point2D[] {
    const barPath: Point2D[] = [];

    poseSequence.forEach(frame => {
      const leftWrist = frame.landmarks[POSE_LANDMARKS.LEFT_WRIST];
      const rightWrist = frame.landmarks[POSE_LANDMARKS.RIGHT_WRIST];

      if (this.validateLandmarkConfidence([leftWrist, rightWrist])) {
        // Assume bar is at midpoint between wrists
        barPath.push({
          x: (leftWrist.x + rightWrist.x) / 2,
          y: (leftWrist.y + rightWrist.y) / 2
        });
      }
    });

    return barPath;
  }

  /**
   * Analyze bar path efficiency and straightness
   */
  private analyzeBarPath(poseSequence: PoseSequence, phases: MovementPhase[]): BarPathAnalysis {
    const actualPath = this.extractBarPath(poseSequence);
    
    if (actualPath.length < 2) {
      return {
        verticalDeviation: 0,
        pathEfficiency: 0,
        straightness: 0,
        totalDistance: 0,
        optimalPath: [],
        actualPath: []
      };
    }

    // Calculate optimal vertical path (straight line from start to end)
    const startPoint = actualPath[0];
    const endPoint = actualPath[actualPath.length - 1];
    const optimalPath: Point2D[] = [];
    
    for (let i = 0; i < actualPath.length; i++) {
      const progress = i / (actualPath.length - 1);
      optimalPath.push({
        x: startPoint.x, // Perfectly vertical = same x
        y: startPoint.y + (endPoint.y - startPoint.y) * progress
      });
    }

    // Calculate deviations from optimal path
    let maxDeviation = 0;
    let totalDeviation = 0;
    
    for (let i = 0; i < actualPath.length; i++) {
      const deviation = Math.abs(actualPath[i].x - optimalPath[i].x);
      maxDeviation = Math.max(maxDeviation, deviation);
      totalDeviation += deviation;
    }

    const averageDeviation = totalDeviation / actualPath.length;

    // Calculate total distance traveled
    let totalDistance = 0;
    for (let i = 1; i < actualPath.length; i++) {
      const dx = actualPath[i].x - actualPath[i - 1].x;
      const dy = actualPath[i].y - actualPath[i - 1].y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate optimal distance (straight line)
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const optimalDistance = Math.sqrt(dx * dx + dy * dy);

    // Calculate efficiency (lower distance = higher efficiency)
    const pathEfficiency = optimalDistance > 0 ? Math.max(0, 100 * (optimalDistance / totalDistance)) : 100;

    // Calculate straightness (lower average deviation = higher straightness)
    const straightness = Math.max(0, 1 - (averageDeviation / 50)); // Normalize by expected range

    return {
      verticalDeviation: maxDeviation,
      pathEfficiency,
      straightness,
      totalDistance,
      optimalPath,
      actualPath
    };
  }

  /**
   * Analyze hip hinge mechanics
   */
  private analyzeHipHinge(
    poseSequence: PoseSequence,
    jointAnglesSequence: JointAngles[],
    phases: MovementPhase[]
  ): HipHingeAnalysis {
    let maxHipHingeAngle = 0;
    let totalHipMovement = 0;
    let totalKneeMovement = 0;
    let validFrames = 0;

    // Analyze hip and knee movement during lift phases
    phases.forEach(phase => {
      if (phase.type === 'liftoff' || phase.type === 'knee_pass') {
        for (let i = phase.startFrame; i <= (phase.endFrame || phase.startFrame); i++) {
          if (i < jointAnglesSequence.length) {
            const angles = jointAnglesSequence[i];
            const avgHipAngle = (angles.leftHip + angles.rightHip) / 2;
            const avgKneeAngle = (angles.leftKnee + angles.rightKnee) / 2;

            if (avgHipAngle > 0 && avgKneeAngle > 0) {
              maxHipHingeAngle = Math.max(maxHipHingeAngle, avgHipAngle);
              
              // Track movement ranges
              if (validFrames > 0) {
                const prevAngles = jointAnglesSequence[i - 1];
                const prevHipAngle = (prevAngles.leftHip + prevAngles.rightHip) / 2;
                const prevKneeAngle = (prevAngles.leftKnee + prevAngles.rightKnee) / 2;
                
                totalHipMovement += Math.abs(avgHipAngle - prevHipAngle);
                totalKneeMovement += Math.abs(avgKneeAngle - prevKneeAngle);
              }
              validFrames++;
            }
          }
        }
      }
    });

    // Calculate hip dominance (higher hip movement relative to knee movement)
    let hipDominance = 50;
    if (totalHipMovement + totalKneeMovement > 0) {
      hipDominance = (totalHipMovement / (totalHipMovement + totalKneeMovement)) * 100;
    }

    // Calculate knee forward travel
    const kneeForwardTravel = this.calculateKneeForwardTravel(poseSequence, phases);

    // Calculate hip hinge score
    let hipHingeScore = 100;
    if (maxHipHingeAngle < this.DEADLIFT_THRESHOLDS.MIN_HIP_HINGE_ANGLE) {
      hipHingeScore -= (this.DEADLIFT_THRESHOLDS.MIN_HIP_HINGE_ANGLE - maxHipHingeAngle) * 2;
    }
    if (hipDominance < 60) { // Should be hip-dominant movement
      hipHingeScore -= (60 - hipDominance);
    }
    if (kneeForwardTravel > 20) { // Excessive knee forward travel
      hipHingeScore -= (kneeForwardTravel - 20) * 2;
    }

    hipHingeScore = Math.max(0, hipHingeScore);

    return {
      hipDominance,
      kneeForwardTravel,
      hipHingeAngle: maxHipHingeAngle,
      hipHingeScore
    };
  }

  /**
   * Calculate knee forward travel during deadlift
   */
  private calculateKneeForwardTravel(poseSequence: PoseSequence, phases: MovementPhase[]): number {
    const setupPhase = phases.find(p => p.type === 'setup');
    const lockoutPhase = phases.find(p => p.type === 'lockout');

    if (!setupPhase || !lockoutPhase) return 0;

    const setupFrame = poseSequence[setupPhase.startFrame];
    const lockoutFrame = poseSequence[lockoutPhase.startFrame];

    if (!setupFrame || !lockoutFrame) return 0;

    // Calculate knee position change
    const setupKneeX = (setupFrame.landmarks[POSE_LANDMARKS.LEFT_KNEE].x + 
                       setupFrame.landmarks[POSE_LANDMARKS.RIGHT_KNEE].x) / 2;
    const lockoutKneeX = (lockoutFrame.landmarks[POSE_LANDMARKS.LEFT_KNEE].x + 
                         lockoutFrame.landmarks[POSE_LANDMARKS.RIGHT_KNEE].x) / 2;

    return Math.abs(lockoutKneeX - setupKneeX);
  }

  /**
   * Analyze setup position quality
   */
  private analyzeSetupPosition(poseSequence: PoseSequence, phases: MovementPhase[]): SetupAnalysis {
    const setupPhase = phases.find(p => p.type === 'setup');
    if (!setupPhase) {
      return {
        barPosition: 'optimal',
        shoulderPosition: 'over_bar',
        backAngle: 0,
        setupScore: 50
      };
    }

    const setupFrame = poseSequence[setupPhase.startFrame];
    if (!setupFrame) {
      return {
        barPosition: 'optimal',
        shoulderPosition: 'over_bar',
        backAngle: 0,
        setupScore: 50
      };
    }

    // Analyze bar position relative to feet
    const barPosition = this.analyzeBarPosition(setupFrame.landmarks);
    
    // Analyze shoulder position relative to bar
    const shoulderPosition = this.analyzeShoulderPosition(setupFrame.landmarks);
    
    // Calculate back angle at setup
    const backAngle = this.calculateBackAngle(setupFrame.landmarks);

    // Calculate overall setup score
    let setupScore = 100;
    if (barPosition !== 'optimal') setupScore -= 20;
    if (shoulderPosition !== 'over_bar') setupScore -= 20;
    if (backAngle > 45 || backAngle < 15) setupScore -= Math.abs(backAngle - 30); // Ideal ~30 degrees

    return {
      barPosition,
      shoulderPosition,
      backAngle,
      setupScore: Math.max(0, setupScore)
    };
  }

  /**
   * Analyze bar position relative to feet
   */
  private analyzeBarPosition(landmarks: Landmark[]): 'optimal' | 'too_far' | 'too_close' {
    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
    const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
    const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];

    if (!this.validateLandmarkConfidence([leftAnkle, rightAnkle, leftWrist, rightWrist])) {
      return 'optimal';
    }

    const ankleCenter = { x: (leftAnkle.x + rightAnkle.x) / 2, y: (leftAnkle.y + rightAnkle.y) / 2 };
    const barCenter = { x: (leftWrist.x + rightWrist.x) / 2, y: (leftWrist.y + rightWrist.y) / 2 };

    const distance = Math.abs(barCenter.x - ankleCenter.x);
    const feetWidth = Math.abs(rightAnkle.x - leftAnkle.x);

    // Bar should be close to midfoot (within ~25% of foot width)
    if (distance > feetWidth * 0.4) {
      return 'too_far';
    } else if (distance < feetWidth * 0.1) {
      return 'too_close';
    }

    return 'optimal';
  }

  /**
   * Analyze shoulder position relative to bar
   */
  private analyzeShoulderPosition(landmarks: Landmark[]): 'over_bar' | 'behind_bar' | 'ahead_bar' {
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST];
    const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST];

    if (!this.validateLandmarkConfidence([leftShoulder, rightShoulder, leftWrist, rightWrist])) {
      return 'over_bar';
    }

    const shoulderCenter = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
    const barCenter = { x: (leftWrist.x + rightWrist.x) / 2, y: (leftWrist.y + rightWrist.y) / 2 };

    const horizontalDistance = shoulderCenter.x - barCenter.x;
    const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);

    // Shoulders should be slightly ahead of or over the bar
    if (horizontalDistance > shoulderWidth * 0.2) {
      return 'ahead_bar';
    } else if (horizontalDistance < -shoulderWidth * 0.1) {
      return 'behind_bar';
    }

    return 'over_bar';
  }

  /**
   * Analyze lockout position quality
   */
  private analyzeLockoutPosition(poseSequence: PoseSequence, phases: MovementPhase[]): LockoutAnalysis {
    const lockoutPhase = phases.find(p => p.type === 'lockout');
    if (!lockoutPhase) {
      return {
        hipExtension: 0,
        shoulderPosition: 'aligned',
        lockoutScore: 50
      };
    }

    const lockoutFrame = poseSequence[lockoutPhase.startFrame];
    if (!lockoutFrame) {
      return {
        hipExtension: 0,
        shoulderPosition: 'aligned',
        lockoutScore: 50
      };
    }

    // Calculate hip extension at lockout
    const angles = this.calculateJointAngles(lockoutFrame.landmarks);
    const hipExtension = (angles.leftHip + angles.rightHip) / 2;

    // Analyze shoulder position at lockout
    const shoulderPosition = this.analyzeShoulderPositionAtLockout(lockoutFrame.landmarks);

    // Calculate lockout score
    let lockoutScore = 100;
    if (hipExtension < 160) { // Should be nearly straight
      lockoutScore -= (160 - hipExtension) * 2;
    }
    if (shoulderPosition !== 'aligned') {
      lockoutScore -= 15;
    }

    return {
      hipExtension,
      shoulderPosition,
      lockoutScore: Math.max(0, lockoutScore)
    };
  }

  /**
   * Analyze shoulder position at lockout
   */
  private analyzeShoulderPositionAtLockout(landmarks: Landmark[]): 'aligned' | 'forward' | 'backward' {
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

    if (!this.validateLandmarkConfidence([leftShoulder, rightShoulder, leftHip, rightHip])) {
      return 'aligned';
    }

    const shoulderCenter = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
    const hipCenter = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };

    const horizontalOffset = shoulderCenter.x - hipCenter.x;
    const torsoLength = Math.abs(shoulderCenter.y - hipCenter.y);

    const offsetRatio = Math.abs(horizontalOffset) / torsoLength;

    if (offsetRatio > 0.1) {
      return horizontalOffset > 0 ? 'forward' : 'backward';
    }

    return 'aligned';
  }

  /**
   * Analyze movement timing and tempo
   */
  private analyzeMovementTiming(phases: MovementPhase[]): MovementTiming {
    const phaseTimings: Record<string, number> = {};
    let totalDuration = 0;

    phases.forEach(phase => {
      const duration = phase.duration || 0;
      phaseTimings[phase.type] = duration;
      totalDuration += duration;
    });

    // Calculate tempo score based on phase durations
    const liftoffDuration = phaseTimings['liftoff'] || 0;
    const kneePassDuration = phaseTimings['knee_pass'] || 0;
    const totalLiftDuration = liftoffDuration + kneePassDuration;

    // Deadlift should be controlled but not too slow
    let tempoScore = 100;
    if (totalLiftDuration > 3000) { // More than 3 seconds for ascent
      tempoScore -= (totalLiftDuration - 3000) / 100;
    } else if (totalLiftDuration < 1000) { // Less than 1 second (too fast)
      tempoScore -= (1000 - totalLiftDuration) / 50;
    }

    const rhythmConsistency = 1.0; // Single rep movement, always consistent

    return {
      totalDuration,
      phaseTimings,
      tempoScore: Math.max(0, Math.min(100, tempoScore)),
      rhythmConsistency
    };
  }

  /**
   * Analyze overall movement pattern
   */
  private analyzeMovementPattern(poseSequence: PoseSequence, phases: MovementPhase[]): MovementPattern {
    const liftoffPhase = phases.find(p => p.type === 'liftoff');
    const kneePassPhase = phases.find(p => p.type === 'knee_pass');
    
    const tempo = {
      descendDuration: 0, // Deadlift doesn't have a descent phase in analysis
      ascentDuration: (liftoffPhase?.duration || 0) + (kneePassPhase?.duration || 0),
      totalDuration: phases.reduce((sum, p) => sum + (p.duration || 0), 0)
    };

    const consistency = 1.0; // Single rep movement

    // Calculate smoothness using bar path
    const barPath = this.extractBarPath(poseSequence);
    const barHeights = barPath.map(pos => pos.y);
    const smoothness = this.calculateSmoothnessScore(barHeights);

    return {
      phases,
      tempo,
      consistency,
      smoothness
    };
  }

  /**
   * Identify specific form errors in deadlift movement
   */
  private identifyDeadliftErrors(
    barPath: BarPathAnalysis,
    hipHinge: HipHingeAnalysis,
    setup: SetupAnalysis,
    lockout: LockoutAnalysis,
    phases: MovementPhase[]
  ): FormError[] {
    const errors: FormError[] = [];

    // Bar path errors
    if (barPath.verticalDeviation > this.DEADLIFT_THRESHOLDS.MAX_BAR_FORWARD_DRIFT) {
      const severity = this.determineErrorSeverity(barPath.verticalDeviation, 'spinal');
      errors.push(this.createFormError(
        'rounded_back',
        severity,
        [0, phases[phases.length - 1]?.endFrame || 0],
        `Excessive bar drift: ${barPath.verticalDeviation.toFixed(1)}px. Keep bar close to body.`,
        'Focus on keeping the bar against your legs throughout the lift. Improve lat engagement.',
        [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.RIGHT_WRIST]
      ));
    }

    // Hip hinge errors
    if (hipHinge.hipHingeAngle < this.DEADLIFT_THRESHOLDS.MIN_HIP_HINGE_ANGLE) {
      errors.push(this.createFormError(
        'knee_cave',
        'medium',
        [0, phases[phases.length - 1]?.endFrame || 0],
        `Insufficient hip hinge: ${hipHinge.hipHingeAngle.toFixed(1)}°. Should be ≥${this.DEADLIFT_THRESHOLDS.MIN_HIP_HINGE_ANGLE}°`,
        'Focus on pushing hips back and maintaining hip hinge pattern. Practice RDLs.',
        [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP]
      ));
    }

    // Setup errors
    if (setup.barPosition !== 'optimal') {
      errors.push(this.createFormError(
        'hip_shift',
        'low',
        [0, 30],
        `Suboptimal bar position: ${setup.barPosition}. Bar should be over midfoot.`,
        'Position bar over midfoot before lifting. Check your setup position.',
        [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE]
      ));
    }

    // Back rounding error
    const avgBackAngle = phases
      .filter(p => p.type === 'liftoff' || p.type === 'knee_pass')
      .reduce((sum, p) => sum + ((p as DeadliftPhase).backAngle || 0), 0) / 
      phases.filter(p => p.type === 'liftoff' || p.type === 'knee_pass').length;

    if (avgBackAngle > this.DEADLIFT_THRESHOLDS.MAX_BACK_ROUNDING) {
      const severity = this.determineErrorSeverity(avgBackAngle, 'spinal');
      errors.push(this.createFormError(
        'rounded_back',
        severity,
        [0, phases[phases.length - 1]?.endFrame || 0],
        `Back rounding detected: ${avgBackAngle.toFixed(1)}°. Maintain neutral spine.`,
        'Strengthen core and improve thoracic mobility. Consider reducing weight.',
        [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP]
      ));
    }

    return errors;
  }

  /**
   * Generate improvement suggestions for deadlift form
   */
  private generateDeadliftSuggestions(
    barPath: BarPathAnalysis,
    hipHinge: HipHingeAnalysis,
    setup: SetupAnalysis,
    lockout: LockoutAnalysis
  ): FormSuggestion[] {
    const suggestions: FormSuggestion[] = [];

    // Bar path improvements
    if (barPath.pathEfficiency < 85) {
      suggestions.push(this.createFormSuggestion(
        'alignment',
        'high',
        'Focus on keeping the bar in contact with your legs throughout the lift',
        'More efficient bar path increases lifting capacity and reduces injury risk'
      ));
    }

    // Hip hinge improvements
    if (hipHinge.hipDominance < 70) {
      suggestions.push(this.createFormSuggestion(
        'range_of_motion',
        'high',
        'Emphasize hip hinge movement over knee bend. Practice Romanian deadlifts',
        'Better hip mechanics improve posterior chain development'
      ));
    }

    // Setup improvements
    if (setup.setupScore < 80) {
      suggestions.push(this.createFormSuggestion(
        'alignment',
        'medium',
        'Work on consistent setup position and pre-lift checklist',
        'Better setup leads to more efficient and safer lifts'
      ));
    }

    // Lockout improvements
    if (lockout.lockoutScore < 85) {
      suggestions.push(this.createFormSuggestion(
        'range_of_motion',
        'medium',
        'Focus on complete hip extension and proud chest at lockout',
        'Full range of motion ensures maximum muscle activation'
      ));
    }

    return suggestions;
  }

  /**
   * Calculate overall deadlift score using weighted components
   */
  private calculateOverallDeadliftScore(
    barPath: BarPathAnalysis,
    hipHinge: HipHingeAnalysis,
    setup: SetupAnalysis,
    lockout: LockoutAnalysis,
    timing: MovementTiming,
    pattern: MovementPattern
  ): number {
    const weights = this.DEADLIFT_WEIGHTS;

    const weightedScore = 
      (setup.setupScore * weights.SETUP) +
      (hipHinge.hipHingeScore * weights.HIP_HINGE) +
      (barPath.pathEfficiency * weights.BAR_PATH) +
      ((100 - Math.min(100, barPath.verticalDeviation * 2)) * weights.SPINAL_ALIGNMENT) + // Convert deviation to score
      (lockout.lockoutScore * 0.1); // Small weight for lockout

    return Math.round(Math.max(0, Math.min(100, weightedScore)));
  }

  /**
   * Calculate confidence score based on data quality
   */
  private calculateConfidenceScore(poseSequence: PoseSequence): number {
    if (poseSequence.length === 0) return 0;

    let totalConfidence = 0;
    let validFrames = 0;

    poseSequence.forEach(frame => {
      const criticalLandmarks = EXERCISE_CRITICAL_LANDMARKS.DEADLIFT;
      let frameConfidence = 0;
      let validLandmarks = 0;

      criticalLandmarks.forEach(landmarkIndex => {
        const landmark = frame.landmarks[landmarkIndex];
        if (landmark && landmark.inFrameLikelihood >= this.confidenceThreshold) {
          frameConfidence += landmark.inFrameLikelihood;
          validLandmarks++;
        }
      });

      if (validLandmarks > 0) {
        totalConfidence += frameConfidence / validLandmarks;
        validFrames++;
      }
    });

    return validFrames > 0 ? totalConfidence / validFrames : 0;
  }

  /**
   * Validate deadlift-specific pose data
   */
  private validateDeadliftData(poseSequence: PoseSequence): boolean {
    if (poseSequence.length < this.minFramesRequired) {
      return false;
    }

    const criticalLandmarks = EXERCISE_CRITICAL_LANDMARKS.DEADLIFT;
    let validFrames = 0;

    for (const frame of poseSequence) {
      if (this.validatePoseData(frame.landmarks, criticalLandmarks)) {
        validFrames++;
      }
    }

    return validFrames >= poseSequence.length * 0.8;
  }

  /**
   * Validate landmark confidence
   */
  private validateLandmarkConfidence(landmarks: Landmark[]): boolean {
    return landmarks.every(landmark => 
      landmark && landmark.inFrameLikelihood >= this.confidenceThreshold
    );
  }
}