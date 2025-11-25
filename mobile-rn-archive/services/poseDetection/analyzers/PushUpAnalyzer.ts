/**
 * Push-Up Movement Analyzer
 * Comprehensive biomechanical analysis for push-up movements
 * Analyzes body alignment, range of motion, elbow position, and core stability
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

// Push-up specific analysis interfaces
interface PushUpAnalysis extends FormAnalysis {
  bodyAlignment: BodyAlignmentAnalysis;
  rangeOfMotion: RangeOfMotionAnalysis;
  elbowPosition: ElbowPositionAnalysis;
  coreStability: CoreStabilityAnalysis;
  phases: PushUpPhase[];
}

interface BodyAlignmentAnalysis {
  bodyLineScore: number; // 0-100 straightness of body line
  hipSag: number; // Degrees of hip sag (positive = sagging)
  hipPike: number; // Degrees of hip pike (positive = piking)
  headPosition: 'neutral' | 'forward' | 'dropped';
  alignmentConsistency: number; // 0-1 consistency throughout movement
}

interface RangeOfMotionAnalysis {
  chestDropPercentage: number; // 0-100% of full range
  fullRangeAchieved: boolean;
  rangeConsistency: number; // 0-1 consistency across reps
  bottomPosition: Point2D; // Lowest chest position
  topPosition: Point2D; // Highest chest position
}

interface ElbowPositionAnalysis {
  elbowAngle: number; // Angle relative to body at bottom position
  elbowFlare: number; // Degrees of elbow flare from ideal 45°
  elbowTracking: number; // 0-100 quality of elbow path
  symmetry: number; // 0-1 left/right arm symmetry
}

interface CoreStabilityAnalysis {
  stabilityScore: number; // 0-100 overall core stability
  sagPattern: 'none' | 'mild' | 'moderate' | 'severe';
  pikePattern: 'none' | 'mild' | 'moderate' | 'severe';
  lateralMovement: number; // Side-to-side body movement
}

interface PushUpPhase extends MovementPhase {
  type: 'top' | 'descent' | 'bottom' | 'ascent';
  chestHeight: number;
  bodyLineAngle: number;
  elbowAngle: number;
  coreStability: number;
}

export class PushUpAnalyzer extends MovementAnalyzer {
  private readonly PUSHUP_THRESHOLDS = ANALYSIS_THRESHOLDS.PUSH_UP;
  private readonly PUSHUP_WEIGHTS = SCORING_WEIGHTS.PUSH_UP;

  /**
   * Main analysis method for push-up movement
   */
  async analyzeMovement(poseSequence: PoseSequence): Promise<PushUpAnalysis> {
    // Validate input data
    if (!this.validatePushUpData(poseSequence)) {
      throw new Error('Insufficient pose data for push-up analysis');
    }

    // Calculate joint angles for each frame
    const jointAnglesSequence = poseSequence.map(frame => 
      this.calculateJointAngles(frame.landmarks)
    );

    // Detect movement phases
    const phases = this.detectPushUpPhases(poseSequence);

    // Perform detailed analyses
    const bodyAlignment = this.analyzeBodyAlignment(poseSequence, phases);
    const rangeOfMotion = this.analyzeRangeOfMotion(poseSequence, phases);
    const elbowPosition = this.analyzeElbowPosition(poseSequence, jointAnglesSequence, phases);
    const coreStability = this.analyzeCoreStability(poseSequence, phases);
    const timing = this.analyzeMovementTiming(phases);
    const movementPattern = this.analyzeMovementPattern(poseSequence, phases);

    // Identify form errors and suggestions
    const criticalErrors = this.identifyPushUpErrors(
      bodyAlignment, rangeOfMotion, elbowPosition, coreStability, phases
    );
    const improvements = this.generatePushUpSuggestions(
      bodyAlignment, rangeOfMotion, elbowPosition, coreStability
    );

    // Calculate overall score
    const overallScore = this.calculateOverallPushUpScore(
      bodyAlignment, rangeOfMotion, elbowPosition, coreStability, timing, movementPattern
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
      bodyAlignment,
      rangeOfMotion,
      elbowPosition,
      coreStability,
      phases: phases as PushUpPhase[]
    };
  }

  /**
   * Detect push-up specific movement phases
   */
  detectMovementPhases(poseSequence: PoseSequence): MovementPhase[] {
    // Use chest position (average of shoulders) to detect phases
    const chestPositions = poseSequence.map(frame => {
      const leftShoulder = frame.landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
      const rightShoulder = frame.landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
      return (leftShoulder.y + rightShoulder.y) / 2;
    });

    // Smooth position data
    const smoothedPositions = this.smoothMovementData(chestPositions, 5);
    const velocities = this.calculateVelocity(smoothedPositions);
    const smoothedVelocities = this.smoothMovementData(velocities, 3);

    const phases: PushUpPhase[] = [];
    let currentPhase: 'top' | 'descent' | 'bottom' | 'ascent' = 'top';
    let phaseStartFrame = 0;

    // Find the range of motion
    const minHeight = Math.min(...smoothedPositions);
    const maxHeight = Math.max(...smoothedPositions);
    const range = maxHeight - minHeight;
    const midpoint = minHeight + range * 0.5;

    for (let i = 1; i < smoothedVelocities.length; i++) {
      const velocity = smoothedVelocities[i];
      const position = smoothedPositions[i];
      const frame = poseSequence[i];
      
      // Calculate metrics for this frame
      const bodyLineAngle = this.calculateBodyLineAngle(frame.landmarks);
      const elbowAngle = this.calculateElbowAngle(frame.landmarks);
      const coreStability = this.calculateFrameCoreStability(frame.landmarks);

      switch (currentPhase) {
        case 'top':
          // Detect start of descent (downward movement)
          if (velocity > 2 && position > midpoint) {
            this.finalizePushUpPhase(phases, currentPhase, phaseStartFrame, i, position, bodyLineAngle, elbowAngle, coreStability, frame.timestamp);
            currentPhase = 'descent';
            phaseStartFrame = i;
          }
          break;

        case 'descent':
          // Detect bottom position (velocity slows, near lowest position)
          if (Math.abs(velocity) < 1.5 && position >= minHeight + range * 0.1) {
            this.finalizePushUpPhase(phases, currentPhase, phaseStartFrame, i, position, bodyLineAngle, elbowAngle, coreStability, frame.timestamp);
            currentPhase = 'bottom';
            phaseStartFrame = i;
          }
          break;

        case 'bottom':
          // Detect start of ascent (upward movement)
          if (velocity < -2 && i - phaseStartFrame > 3) { // Minimum hold time
            this.finalizePushUpPhase(phases, currentPhase, phaseStartFrame, i, position, bodyLineAngle, elbowAngle, coreStability, frame.timestamp);
            currentPhase = 'ascent';
            phaseStartFrame = i;
          }
          break;

        case 'ascent':
          // Detect return to top (minimal movement, near highest position)
          if (Math.abs(velocity) < 1.5 && position <= minHeight + range * 0.2) {
            this.finalizePushUpPhase(phases, currentPhase, phaseStartFrame, i, position, bodyLineAngle, elbowAngle, coreStability, frame.timestamp);
            currentPhase = 'top';
            phaseStartFrame = i;
          }
          break;
      }
    }

    // Finalize the last phase
    const lastFrame = poseSequence[poseSequence.length - 1];
    this.finalizePushUpPhase(
      phases, currentPhase, phaseStartFrame, poseSequence.length - 1,
      smoothedPositions[smoothedPositions.length - 1],
      this.calculateBodyLineAngle(lastFrame.landmarks),
      this.calculateElbowAngle(lastFrame.landmarks),
      this.calculateFrameCoreStability(lastFrame.landmarks),
      lastFrame.timestamp
    );

    return phases;
  }

  /**
   * Helper method to finalize push-up phases
   */
  private finalizePushUpPhase(
    phases: PushUpPhase[],
    type: 'top' | 'descent' | 'bottom' | 'ascent',
    startFrame: number,
    endFrame: number,
    chestHeight: number,
    bodyLineAngle: number,
    elbowAngle: number,
    coreStability: number,
    timestamp: number
  ): void {
    const duration = (endFrame - startFrame) * (1000 / 30); // Assuming ~30fps

    phases.push({
      type,
      startFrame,
      endFrame,
      duration,
      chestHeight,
      bodyLineAngle,
      elbowAngle,
      coreStability,
      keyMetrics: {
        averageChestHeight: chestHeight,
        averageBodyLineAngle: bodyLineAngle,
        averageElbowAngle: elbowAngle,
        averageCoreStability: coreStability
      }
    });
  }

  /**
   * Calculate body line angle (deviation from straight line)
   */
  private calculateBodyLineAngle(landmarks: Landmark[]): number {
    const head = this.getHeadCenter(landmarks);
    const shoulder = this.getShoulderCenter(landmarks);
    const hip = this.getHipCenter(landmarks);
    const ankle = this.getAnkleCenter(landmarks);

    if (!head || !shoulder || !hip || !ankle) return 0;

    // Calculate angles between body segments
    const headShoulderAngle = this.calculateSlopeAngle(head, shoulder);
    const shoulderHipAngle = this.calculateSlopeAngle(shoulder, hip);
    const hipAnkleAngle = this.calculateSlopeAngle(hip, ankle);

    // Ideal body line should be straight (all angles should be similar)
    const avgAngle = (headShoulderAngle + shoulderHipAngle + hipAnkleAngle) / 3;
    const maxDeviation = Math.max(
      Math.abs(headShoulderAngle - avgAngle),
      Math.abs(shoulderHipAngle - avgAngle),
      Math.abs(hipAnkleAngle - avgAngle)
    );

    return maxDeviation;
  }

  /**
   * Calculate elbow angle and position
   */
  private calculateElbowAngle(landmarks: Landmark[]): number {
    const leftElbowAngle = this.calculateAngle(
      landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
      landmarks[POSE_LANDMARKS.LEFT_ELBOW],
      landmarks[POSE_LANDMARKS.LEFT_WRIST]
    );

    const rightElbowAngle = this.calculateAngle(
      landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
      landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
      landmarks[POSE_LANDMARKS.RIGHT_WRIST]
    );

    return (leftElbowAngle + rightElbowAngle) / 2;
  }

  /**
   * Calculate core stability for a single frame
   */
  private calculateFrameCoreStability(landmarks: Landmark[]): number {
    const bodyLineAngle = this.calculateBodyLineAngle(landmarks);
    const hipSag = this.calculateHipSag(landmarks);
    const hipPike = this.calculateHipPike(landmarks);

    // Core stability score based on body line maintenance
    let stabilityScore = 100;
    stabilityScore -= bodyLineAngle * 2; // Penalize body line deviation
    stabilityScore -= Math.abs(hipSag) * 3; // Penalize hip sag
    stabilityScore -= Math.abs(hipPike) * 3; // Penalize hip pike

    return Math.max(0, Math.min(100, stabilityScore));
  }

  /**
   * Get center point of head landmarks
   */
  private getHeadCenter(landmarks: Landmark[]): Point2D | null {
    const nose = landmarks[POSE_LANDMARKS.NOSE];
    const leftEar = landmarks[POSE_LANDMARKS.LEFT_EAR];
    const rightEar = landmarks[POSE_LANDMARKS.RIGHT_EAR];

    if (!this.validateLandmarkConfidence([nose, leftEar, rightEar])) {
      return null;
    }

    return {
      x: (nose.x + leftEar.x + rightEar.x) / 3,
      y: (nose.y + leftEar.y + rightEar.y) / 3
    };
  }

  /**
   * Get center point of shoulders
   */
  private getShoulderCenter(landmarks: Landmark[]): Point2D | null {
    const left = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const right = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];

    if (!this.validateLandmarkConfidence([left, right])) {
      return null;
    }

    return { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
  }

  /**
   * Get center point of hips
   */
  private getHipCenter(landmarks: Landmark[]): Point2D | null {
    const left = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const right = landmarks[POSE_LANDMARKS.RIGHT_HIP];

    if (!this.validateLandmarkConfidence([left, right])) {
      return null;
    }

    return { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
  }

  /**
   * Get center point of ankles
   */
  private getAnkleCenter(landmarks: Landmark[]): Point2D | null {
    const left = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const right = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

    if (!this.validateLandmarkConfidence([left, right])) {
      return null;
    }

    return { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
  }

  /**
   * Calculate hip sag (hips dropping below body line)
   */
  private calculateHipSag(landmarks: Landmark[]): number {
    const shoulder = this.getShoulderCenter(landmarks);
    const hip = this.getHipCenter(landmarks);
    const ankle = this.getAnkleCenter(landmarks);

    if (!shoulder || !hip || !ankle) return 0;

    // Calculate expected hip position on straight line from shoulder to ankle
    const totalDistance = Math.sqrt(
      Math.pow(ankle.x - shoulder.x, 2) + Math.pow(ankle.y - shoulder.y, 2)
    );
    const shoulderHipDistance = Math.sqrt(
      Math.pow(hip.x - shoulder.x, 2) + Math.pow(hip.y - shoulder.y, 2)
    );

    const ratio = shoulderHipDistance / totalDistance;
    const expectedHipY = shoulder.y + (ankle.y - shoulder.y) * ratio;

    // Positive value = hip sag (below expected position)
    return (hip.y - expectedHipY) * (180 / Math.PI) / 10; // Convert to approximate degrees
  }

  /**
   * Calculate hip pike (hips rising above body line)
   */
  private calculateHipPike(landmarks: Landmark[]): number {
    const sagValue = this.calculateHipSag(landmarks);
    return sagValue < 0 ? Math.abs(sagValue) : 0; // Pike is negative sag
  }

  /**
   * Analyze body alignment throughout the movement
   */
  private analyzeBodyAlignment(poseSequence: PoseSequence, phases: MovementPhase[]): BodyAlignmentAnalysis {
    let totalBodyLineScore = 0;
    let maxHipSag = 0;
    let maxHipPike = 0;
    let validFrames = 0;

    const bodyLineScores: number[] = [];
    const hipSags: number[] = [];
    const hipPikes: number[] = [];
    
    // Analyze each frame during movement phases
    phases.forEach(phase => {
      if (phase.type !== 'top') { // Exclude top position hold
        for (let i = phase.startFrame; i <= (phase.endFrame || phase.startFrame); i++) {
          if (i < poseSequence.length) {
            const frame = poseSequence[i];
            
            const bodyLineAngle = this.calculateBodyLineAngle(frame.landmarks);
            const hipSag = this.calculateHipSag(frame.landmarks);
            const hipPike = this.calculateHipPike(frame.landmarks);

            if (bodyLineAngle >= 0) { // Valid measurement
              const bodyLineScore = Math.max(0, 100 - bodyLineAngle * 5);
              bodyLineScores.push(bodyLineScore);
              totalBodyLineScore += bodyLineScore;

              hipSags.push(hipSag);
              hipPikes.push(hipPike);

              maxHipSag = Math.max(maxHipSag, hipSag);
              maxHipPike = Math.max(maxHipPike, hipPike);

              validFrames++;
            }
          }
        }
      }
    });

    const avgBodyLineScore = validFrames > 0 ? totalBodyLineScore / validFrames : 0;

    // Analyze head position
    const headPosition = this.analyzeHeadPosition(poseSequence, phases);

    // Calculate alignment consistency
    const alignmentConsistency = bodyLineScores.length > 1 ? 
      this.calculateVariationCoefficient(bodyLineScores) : 1.0;

    return {
      bodyLineScore: avgBodyLineScore,
      hipSag: maxHipSag,
      hipPike: maxHipPike,
      headPosition,
      alignmentConsistency
    };
  }

  /**
   * Analyze head position throughout movement
   */
  private analyzeHeadPosition(poseSequence: PoseSequence, phases: MovementPhase[]): 'neutral' | 'forward' | 'dropped' {
    let forwardCount = 0;
    let droppedCount = 0;
    let neutralCount = 0;
    let totalFrames = 0;

    phases.forEach(phase => {
      for (let i = phase.startFrame; i <= (phase.endFrame || phase.startFrame); i++) {
        if (i < poseSequence.length) {
          const frame = poseSequence[i];
          const headPos = this.analyzeFrameHeadPosition(frame.landmarks);
          
          switch (headPos) {
            case 'forward': forwardCount++; break;
            case 'dropped': droppedCount++; break;
            case 'neutral': neutralCount++; break;
          }
          totalFrames++;
        }
      }
    });

    if (totalFrames === 0) return 'neutral';

    // Return the most common head position
    const forwardRatio = forwardCount / totalFrames;
    const droppedRatio = droppedCount / totalFrames;
    const neutralRatio = neutralCount / totalFrames;

    if (forwardRatio > 0.5) return 'forward';
    if (droppedRatio > 0.5) return 'dropped';
    return 'neutral';
  }

  /**
   * Analyze head position for a single frame
   */
  private analyzeFrameHeadPosition(landmarks: Landmark[]): 'neutral' | 'forward' | 'dropped' {
    const nose = landmarks[POSE_LANDMARKS.NOSE];
    const shoulder = this.getShoulderCenter(landmarks);

    if (!nose || !shoulder || nose.inFrameLikelihood < this.confidenceThreshold) {
      return 'neutral';
    }

    const horizontalDistance = nose.x - shoulder.x;
    const verticalDistance = Math.abs(nose.y - shoulder.y);

    // Head should be roughly above shoulders
    if (Math.abs(horizontalDistance) > verticalDistance * 0.3) {
      return horizontalDistance > 0 ? 'forward' : 'forward'; // Both directions are forward lean
    }

    if (nose.y > shoulder.y + verticalDistance * 0.5) {
      return 'dropped';
    }

    return 'neutral';
  }

  /**
   * Analyze range of motion
   */
  private analyzeRangeOfMotion(poseSequence: PoseSequence, phases: MovementPhase[]): RangeOfMotionAnalysis {
    const chestPositions: Point2D[] = [];
    let minChestHeight = Infinity;
    let maxChestHeight = -Infinity;

    // Collect chest positions throughout movement
    poseSequence.forEach(frame => {
      const shoulder = this.getShoulderCenter(landmarks);
      if (shoulder) {
        chestPositions.push(shoulder);
        minChestHeight = Math.min(minChestHeight, shoulder.y);
        maxChestHeight = Math.max(maxChestHeight, shoulder.y);
      }
    });

    const totalRange = maxChestHeight - minChestHeight;
    
    // Find deepest position during bottom phases
    let deepestPosition = maxChestHeight;
    phases.forEach(phase => {
      if (phase.type === 'bottom') {
        for (let i = phase.startFrame; i <= (phase.endFrame || phase.startFrame); i++) {
          if (i < poseSequence.length) {
            const frame = poseSequence[i];
            const shoulder = this.getShoulderCenter(frame.landmarks);
            if (shoulder) {
              deepestPosition = Math.max(deepestPosition, shoulder.y);
            }
          }
        }
      }
    });

    // Calculate range percentage
    const achievedRange = deepestPosition - minChestHeight;
    const chestDropPercentage = totalRange > 0 ? (achievedRange / totalRange) * 100 : 0;
    const fullRangeAchieved = chestDropPercentage >= this.PUSHUP_THRESHOLDS.MIN_CHEST_DROP * 100;

    // Calculate range consistency across repetitions
    const bottomPhases = phases.filter(p => p.type === 'bottom') as PushUpPhase[];
    const bottomHeights = bottomPhases.map(p => p.chestHeight);
    const rangeConsistency = bottomHeights.length > 1 ? 
      this.calculateVariationCoefficient(bottomHeights) : 1.0;

    return {
      chestDropPercentage,
      fullRangeAchieved,
      rangeConsistency,
      bottomPosition: { x: 0, y: deepestPosition },
      topPosition: { x: 0, y: minChestHeight }
    };
  }

  /**
   * Analyze elbow position and tracking
   */
  private analyzeElbowPosition(
    poseSequence: PoseSequence,
    jointAnglesSequence: JointAngles[],
    phases: MovementPhase[]
  ): ElbowPositionAnalysis {
    let totalElbowAngle = 0;
    let maxElbowFlare = 0;
    let validFrames = 0;

    const leftElbowAngles: number[] = [];
    const rightElbowAngles: number[] = [];
    const elbowFlares: number[] = [];

    // Analyze elbow position during bottom phases
    phases.forEach(phase => {
      if (phase.type === 'bottom') {
        for (let i = phase.startFrame; i <= (phase.endFrame || phase.startFrame); i++) {
          if (i < jointAnglesSequence.length) {
            const angles = jointAnglesSequence[i];
            const frame = poseSequence[i];
            
            if (angles.leftElbow > 0 && angles.rightElbow > 0) {
              leftElbowAngles.push(angles.leftElbow);
              rightElbowAngles.push(angles.rightElbow);
              
              const avgElbowAngle = (angles.leftElbow + angles.rightElbow) / 2;
              totalElbowAngle += avgElbowAngle;

              // Calculate elbow flare (deviation from 45-degree angle to body)
              const elbowFlare = this.calculateElbowFlare(frame.landmarks);
              elbowFlares.push(elbowFlare);
              maxElbowFlare = Math.max(maxElbowFlare, elbowFlare);

              validFrames++;
            }
          }
        }
      }
    });

    const avgElbowAngle = validFrames > 0 ? totalElbowAngle / validFrames : 0;

    // Calculate elbow tracking quality based on consistency
    const elbowTracking = elbowFlares.length > 0 ? 
      Math.max(0, 100 - maxElbowFlare * 2) : 100;

    // Calculate left-right symmetry
    let symmetry = 1.0;
    if (leftElbowAngles.length > 0 && rightElbowAngles.length > 0) {
      const avgLeftAngle = leftElbowAngles.reduce((sum, angle) => sum + angle, 0) / leftElbowAngles.length;
      const avgRightAngle = rightElbowAngles.reduce((sum, angle) => sum + angle, 0) / rightElbowAngles.length;
      const angleDifference = Math.abs(avgLeftAngle - avgRightAngle);
      symmetry = Math.max(0, 1 - angleDifference / 30); // Normalize by 30-degree tolerance
    }

    return {
      elbowAngle: avgElbowAngle,
      elbowFlare: maxElbowFlare,
      elbowTracking,
      symmetry
    };
  }

  /**
   * Calculate elbow flare from ideal 45-degree angle
   */
  private calculateElbowFlare(landmarks: Landmark[]): number {
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftElbow = landmarks[POSE_LANDMARKS.LEFT_ELBOW];
    const rightElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW];

    if (!this.validateLandmarkConfidence([leftShoulder, rightShoulder, leftElbow, rightElbow])) {
      return 0;
    }

    // Calculate angle of upper arms relative to torso line
    const shoulderLine = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    );

    const leftUpperArmAngle = Math.atan2(
      leftElbow.y - leftShoulder.y,
      leftElbow.x - leftShoulder.x
    );

    const rightUpperArmAngle = Math.atan2(
      rightElbow.y - rightShoulder.y,
      rightElbow.x - rightShoulder.x
    );

    // Calculate deviations from ideal 45-degree angle
    const idealAngle = Math.PI / 4; // 45 degrees
    const leftDeviation = Math.abs(leftUpperArmAngle - shoulderLine - idealAngle);
    const rightDeviation = Math.abs(rightUpperArmAngle - shoulderLine + idealAngle);

    const avgDeviation = (leftDeviation + rightDeviation) / 2;
    return avgDeviation * (180 / Math.PI); // Convert to degrees
  }

  /**
   * Analyze core stability throughout movement
   */
  private analyzeCoreStability(poseSequence: PoseSequence, phases: MovementPhase[]): CoreStabilityAnalysis {
    let totalStabilityScore = 0;
    let maxSag = 0;
    let maxPike = 0;
    let maxLateralMovement = 0;
    let validFrames = 0;

    const sagValues: number[] = [];
    const pikeValues: number[] = [];
    const lateralPositions: number[] = [];

    phases.forEach(phase => {
      for (let i = phase.startFrame; i <= (phase.endFrame || phase.startFrame); i++) {
        if (i < poseSequence.length) {
          const frame = poseSequence[i];
          
          const stabilityScore = this.calculateFrameCoreStability(frame.landmarks);
          const sag = this.calculateHipSag(frame.landmarks);
          const pike = this.calculateHipPike(frame.landmarks);
          const hip = this.getHipCenter(frame.landmarks);

          if (stabilityScore >= 0) {
            totalStabilityScore += stabilityScore;
            sagValues.push(Math.abs(sag));
            pikeValues.push(pike);
            
            if (hip) {
              lateralPositions.push(hip.x);
            }

            maxSag = Math.max(maxSag, Math.abs(sag));
            maxPike = Math.max(maxPike, pike);
            validFrames++;
          }
        }
      }
    });

    // Calculate lateral movement (side-to-side sway)
    if (lateralPositions.length > 1) {
      const minX = Math.min(...lateralPositions);
      const maxX = Math.max(...lateralPositions);
      maxLateralMovement = maxX - minX;
    }

    // Determine patterns
    const sagPattern = this.categorizeSagPattern(maxSag);
    const pikePattern = this.categorizePikePattern(maxPike);

    const avgStabilityScore = validFrames > 0 ? totalStabilityScore / validFrames : 0;

    return {
      stabilityScore: avgStabilityScore,
      sagPattern,
      pikePattern,
      lateralMovement: maxLateralMovement
    };
  }

  /**
   * Categorize hip sag severity
   */
  private categorizeSagPattern(maxSag: number): 'none' | 'mild' | 'moderate' | 'severe' {
    if (maxSag < 5) return 'none';
    if (maxSag < 10) return 'mild';
    if (maxSag < 15) return 'moderate';
    return 'severe';
  }

  /**
   * Categorize hip pike severity
   */
  private categorizePikePattern(maxPike: number): 'none' | 'mild' | 'moderate' | 'severe' {
    if (maxPike < 5) return 'none';
    if (maxPike < 10) return 'mild';
    if (maxPike < 15) return 'moderate';
    return 'severe';
  }

  /**
   * Analyze movement timing and tempo
   */
  private analyzeMovementTiming(phases: MovementPhase[]): MovementTiming {
    const phaseTimings: Record<string, number> = {};
    let totalDuration = 0;

    phases.forEach(phase => {
      const duration = phase.duration || 0;
      phaseTimings[phase.type] = (phaseTimings[phase.type] || 0) + duration;
      totalDuration += duration;
    });

    // Calculate tempo score (moderate pace is ideal)
    const descentDuration = phaseTimings['descent'] || 0;
    const ascentDuration = phaseTimings['ascent'] || 0;
    
    let tempoScore = 100;
    
    // Ideal descent: 1-2 seconds, ascent: 0.5-1.5 seconds
    if (descentDuration > 2000 || descentDuration < 500) {
      tempoScore -= Math.abs(descentDuration - 1500) / 50;
    }
    if (ascentDuration > 1500 || ascentDuration < 300) {
      tempoScore -= Math.abs(ascentDuration - 900) / 30;
    }

    tempoScore = Math.max(0, Math.min(100, tempoScore));

    // Calculate rhythm consistency across multiple reps
    const descentPhases = phases.filter(p => p.type === 'descent');
    const rhythmConsistency = descentPhases.length > 1 ? 
      this.calculateVariationCoefficient(descentPhases.map(p => p.duration || 0)) : 1.0;

    return {
      totalDuration,
      phaseTimings,
      tempoScore,
      rhythmConsistency
    };
  }

  /**
   * Analyze overall movement pattern
   */
  private analyzeMovementPattern(poseSequence: PoseSequence, phases: MovementPhase[]): MovementPattern {
    const descentPhases = phases.filter(p => p.type === 'descent');
    const ascentPhases = phases.filter(p => p.type === 'ascent');
    
    const tempo = {
      descendDuration: descentPhases.reduce((sum, p) => sum + (p.duration || 0), 0),
      ascentDuration: ascentPhases.reduce((sum, p) => sum + (p.duration || 0), 0),
      totalDuration: phases.reduce((sum, p) => sum + (p.duration || 0), 0)
    };

    const consistency = this.calculateConsistencyScore(phases);

    // Calculate smoothness using chest position data
    const chestPositions = poseSequence.map(frame => {
      const shoulder = this.getShoulderCenter(frame.landmarks);
      return shoulder ? shoulder.y : 0;
    }).filter(pos => pos > 0);
    
    const smoothness = this.calculateSmoothnessScore(chestPositions);

    return {
      phases,
      tempo,
      consistency,
      smoothness
    };
  }

  /**
   * Identify specific form errors in push-up movement
   */
  private identifyPushUpErrors(
    bodyAlignment: BodyAlignmentAnalysis,
    rangeOfMotion: RangeOfMotionAnalysis,
    elbowPosition: ElbowPositionAnalysis,
    coreStability: CoreStabilityAnalysis,
    phases: MovementPhase[]
  ): FormError[] {
    const errors: FormError[] = [];

    // Range of motion errors
    if (!rangeOfMotion.fullRangeAchieved) {
      const severity = this.determineErrorSeverity(
        this.PUSHUP_THRESHOLDS.MIN_CHEST_DROP * 100 - rangeOfMotion.chestDropPercentage,
        'depth'
      );
      errors.push(this.createFormError(
        'shallow_depth',
        severity,
        [0, phases[phases.length - 1]?.endFrame || 0],
        `Insufficient range of motion: ${rangeOfMotion.chestDropPercentage.toFixed(1)}%. Lower chest closer to floor.`,
        'Focus on controlled descent to full depth. Build strength with incline push-ups if needed.',
        [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER]
      ));
    }

    // Body alignment errors
    if (bodyAlignment.bodyLineScore < 70) {
      errors.push(this.createFormError(
        'hip_shift',
        'medium',
        [0, phases[phases.length - 1]?.endFrame || 0],
        `Poor body alignment detected. Maintain straight line from head to heels.`,
        'Engage core muscles and practice plank holds to improve body line control.',
        [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER]
      ));
    }

    // Hip sag errors
    if (bodyAlignment.hipSag > this.PUSHUP_THRESHOLDS.MAX_HIP_SAG) {
      const severity = this.determineErrorSeverity(bodyAlignment.hipSag, 'spinal');
      errors.push(this.createFormError(
        'hip_shift',
        severity,
        [0, phases[phases.length - 1]?.endFrame || 0],
        `Hip sagging detected: ${bodyAlignment.hipSag.toFixed(1)}°. Engage core and glutes.`,
        'Strengthen core with planks and dead bugs. Focus on squeezing glutes throughout movement.',
        [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP]
      ));
    }

    // Hip pike errors
    if (bodyAlignment.hipPike > this.PUSHUP_THRESHOLDS.MAX_HIP_PIKE) {
      const severity = this.determineErrorSeverity(bodyAlignment.hipPike, 'spinal');
      errors.push(this.createFormError(
        'hip_shift',
        severity,
        [0, phases[phases.length - 1]?.endFrame || 0],
        `Hip piking detected: ${bodyAlignment.hipPike.toFixed(1)}°. Lower hips to neutral position.`,
        'Focus on maintaining hip position. Practice modified push-ups to build strength.',
        [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP]
      ));
    }

    // Elbow flare errors
    if (elbowPosition.elbowFlare > 30) { // More than 30 degrees from ideal
      errors.push(this.createFormError(
        'elbow_flare',
        'medium',
        [0, phases[phases.length - 1]?.endFrame || 0],
        `Excessive elbow flare: ${elbowPosition.elbowFlare.toFixed(1)}°. Keep elbows at 45° angle.`,
        'Focus on elbow position. Practice against wall to feel proper elbow tracking.',
        [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.RIGHT_ELBOW]
      ));
    }

    return errors;
  }

  /**
   * Generate improvement suggestions for push-up form
   */
  private generatePushUpSuggestions(
    bodyAlignment: BodyAlignmentAnalysis,
    rangeOfMotion: RangeOfMotionAnalysis,
    elbowPosition: ElbowPositionAnalysis,
    coreStability: CoreStabilityAnalysis
  ): FormSuggestion[] {
    const suggestions: FormSuggestion[] = [];

    // Range of motion improvements
    if (rangeOfMotion.chestDropPercentage < 80) {
      suggestions.push(this.createFormSuggestion(
        'range_of_motion',
        'high',
        'Work on achieving full range of motion by lowering chest closer to floor',
        'Full ROM maximizes muscle activation and strength gains'
      ));
    }

    // Body alignment improvements
    if (bodyAlignment.bodyLineScore < 85) {
      suggestions.push(this.createFormSuggestion(
        'alignment',
        'high',
        'Practice plank holds and focus on maintaining straight body line',
        'Better alignment improves exercise effectiveness and reduces injury risk'
      ));
    }

    // Core stability improvements
    if (coreStability.stabilityScore < 80) {
      suggestions.push(this.createFormSuggestion(
        'alignment',
        'medium',
        'Strengthen core with planks, dead bugs, and bird dogs',
        'Improved core stability allows for better push-up form and progression'
      ));
    }

    // Elbow position improvements
    if (elbowPosition.elbowTracking < 80) {
      suggestions.push(this.createFormSuggestion(
        'alignment',
        'medium',
        'Focus on keeping elbows at 45-degree angle to torso',
        'Proper elbow position reduces shoulder stress and improves power transfer'
      ));
    }

    // Consistency improvements
    if (rangeOfMotion.rangeConsistency < 0.8) {
      suggestions.push(this.createFormSuggestion(
        'range_of_motion',
        'low',
        'Focus on consistent depth across all repetitions',
        'Consistent ROM ensures even strength development and better results'
      ));
    }

    return suggestions;
  }

  /**
   * Calculate overall push-up score using weighted components
   */
  private calculateOverallPushUpScore(
    bodyAlignment: BodyAlignmentAnalysis,
    rangeOfMotion: RangeOfMotionAnalysis,
    elbowPosition: ElbowPositionAnalysis,
    coreStability: CoreStabilityAnalysis,
    timing: MovementTiming,
    pattern: MovementPattern
  ): number {
    const weights = this.PUSHUP_WEIGHTS;

    const rangeScore = rangeOfMotion.fullRangeAchieved ? 100 : rangeOfMotion.chestDropPercentage;

    const weightedScore = 
      (rangeScore * weights.RANGE_OF_MOTION) +
      (bodyAlignment.bodyLineScore * weights.BODY_ALIGNMENT) +
      (elbowPosition.elbowTracking * weights.ELBOW_POSITION) +
      (coreStability.stabilityScore * weights.CORE_STABILITY) +
      (timing.tempoScore * weights.TEMPO);

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
      const criticalLandmarks = EXERCISE_CRITICAL_LANDMARKS.PUSH_UP;
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
   * Validate push-up specific pose data
   */
  private validatePushUpData(poseSequence: PoseSequence): boolean {
    if (poseSequence.length < this.minFramesRequired) {
      return false;
    }

    const criticalLandmarks = EXERCISE_CRITICAL_LANDMARKS.PUSH_UP;
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

  /**
   * Calculate coefficient of variation for consistency metrics
   */
  private calculateVariationCoefficient(values: number[]): number {
    if (values.length < 2) return 1.0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    if (mean === 0) return 1.0;
    
    const coefficientOfVariation = standardDeviation / mean;
    return Math.max(0, 1 - coefficientOfVariation);
  }
}