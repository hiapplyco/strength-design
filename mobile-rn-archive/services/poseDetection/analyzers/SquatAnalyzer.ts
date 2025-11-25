/**
 * Squat Movement Analyzer
 * Comprehensive biomechanical analysis for squat movements
 * Analyzes depth, knee alignment, spinal posture, balance, and movement phases
 */

import { MovementAnalyzer } from './MovementAnalyzer';
import {
  PoseSequence,
  SquatAnalysis,
  SquatPhase,
  MovementPhase,
  DepthAnalysis,
  KneeAlignment,
  SpinalAlignment,
  BalanceAnalysis,
  FormError,
  FormSuggestion,
  JointAngles,
  MovementPattern,
  MovementTiming,
  Landmark
} from '../types';
import {
  POSE_LANDMARKS,
  ANALYSIS_THRESHOLDS,
  SCORING_WEIGHTS,
  PHASE_DETECTION_PARAMS,
  EXERCISE_CRITICAL_LANDMARKS
} from '../constants';

export class SquatAnalyzer extends MovementAnalyzer {
  private readonly SQUAT_THRESHOLDS = ANALYSIS_THRESHOLDS.SQUAT;
  private readonly SQUAT_WEIGHTS = SCORING_WEIGHTS.SQUAT;

  /**
   * Main analysis method for squat movement
   * Performs comprehensive biomechanical evaluation
   */
  async analyzeMovement(poseSequence: PoseSequence): Promise<SquatAnalysis> {
    // Validate input data
    if (!this.validateSquatData(poseSequence)) {
      throw new Error('Insufficient pose data for squat analysis');
    }

    // Calculate joint angles for each frame
    const jointAnglesSequence = poseSequence.map(frame => 
      this.calculateJointAngles(frame.landmarks)
    );

    // Detect movement phases (descent, bottom, ascent, standing)
    const phases = this.detectSquatPhases(poseSequence);

    // Perform detailed analyses
    const depthAnalysis = this.analyzeSquatDepth(poseSequence, jointAnglesSequence, phases);
    const kneeAlignment = this.analyzeKneeAlignment(poseSequence, phases);
    const spinalAlignment = this.analyzeSpinalAlignment(poseSequence, jointAnglesSequence, phases);
    const balanceAnalysis = this.analyzeBalance(poseSequence, phases);
    const timing = this.analyzeMovementTiming(phases);
    const movementPattern = this.analyzeMovementPattern(poseSequence, phases);

    // Identify form errors and suggestions
    const criticalErrors = this.identifySquatErrors(
      depthAnalysis, kneeAlignment, spinalAlignment, balanceAnalysis, phases
    );
    const improvements = this.generateSquatSuggestions(
      depthAnalysis, kneeAlignment, spinalAlignment, balanceAnalysis
    );

    // Calculate overall score
    const overallScore = this.calculateOverallSquatScore(
      depthAnalysis, kneeAlignment, spinalAlignment, balanceAnalysis, timing, movementPattern
    );

    // Calculate confidence score based on data quality
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
      depth: depthAnalysis,
      kneeAlignment,
      spinalAlignment,
      balanceAnalysis,
      phases: phases as SquatPhase[]
    };
  }

  /**
   * Detect movement phases specific to squat exercise
   * Identifies descent, bottom hold, ascent, and standing phases
   */
  detectMovementPhases(poseSequence: PoseSequence): MovementPhase[] {
    const hipPositions = poseSequence.map(frame => {
      const leftHip = frame.landmarks[POSE_LANDMARKS.LEFT_HIP];
      const rightHip = frame.landmarks[POSE_LANDMARKS.RIGHT_HIP];
      return (leftHip.y + rightHip.y) / 2; // Average hip height
    });

    // Smooth hip position data to reduce noise
    const smoothedPositions = this.smoothMovementData(hipPositions, 5);
    const velocities = this.calculateVelocity(smoothedPositions);
    const smoothedVelocities = this.smoothMovementData(velocities, 3);

    const phases: SquatPhase[] = [];
    let currentPhase: 'descent' | 'bottom' | 'ascent' | 'standing' = 'standing';
    let phaseStartFrame = 0;

    for (let i = 1; i < smoothedVelocities.length; i++) {
      const velocity = smoothedVelocities[i];
      const frame = poseSequence[i];
      
      // Calculate joint angles for this frame
      const angles = this.calculateJointAngles(frame.landmarks);
      const avgHipAngle = (angles.leftHip + angles.rightHip) / 2;
      const avgKneeAngle = (angles.leftKnee + angles.rightKnee) / 2;
      const avgAnkleAngle = this.calculateAnkleAngles(frame.landmarks);

      switch (currentPhase) {
        case 'standing':
          // Detect start of descent (downward movement)
          if (velocity > PHASE_DETECTION_PARAMS.SQUAT_DESCENT_THRESHOLD) {
            this.finalizePhase(phases, currentPhase, phaseStartFrame, i, avgHipAngle, avgKneeAngle, avgAnkleAngle, frame.timestamp);
            currentPhase = 'descent';
            phaseStartFrame = i;
          }
          break;

        case 'descent':
          // Detect bottom position (velocity approaches zero, lowest position)
          if (Math.abs(velocity) < Math.abs(PHASE_DETECTION_PARAMS.SQUAT_DESCENT_THRESHOLD) * 0.3) {
            this.finalizePhase(phases, currentPhase, phaseStartFrame, i, avgHipAngle, avgKneeAngle, avgAnkleAngle, frame.timestamp);
            currentPhase = 'bottom';
            phaseStartFrame = i;
          }
          break;

        case 'bottom':
          // Detect start of ascent (upward movement)
          if (velocity < PHASE_DETECTION_PARAMS.SQUAT_ASCENT_THRESHOLD && 
              i - phaseStartFrame > PHASE_DETECTION_PARAMS.SQUAT_BOTTOM_HOLD_FRAMES) {
            this.finalizePhase(phases, currentPhase, phaseStartFrame, i, avgHipAngle, avgKneeAngle, avgAnkleAngle, frame.timestamp);
            currentPhase = 'ascent';
            phaseStartFrame = i;
          }
          break;

        case 'ascent':
          // Detect return to standing (minimal movement, high hip position)
          if (Math.abs(velocity) < Math.abs(PHASE_DETECTION_PARAMS.SQUAT_ASCENT_THRESHOLD) * 0.3 &&
              smoothedPositions[i] <= smoothedPositions[phaseStartFrame] * 1.02) { // Within 2% of starting position
            this.finalizePhase(phases, currentPhase, phaseStartFrame, i, avgHipAngle, avgKneeAngle, avgAnkleAngle, frame.timestamp);
            currentPhase = 'standing';
            phaseStartFrame = i;
          }
          break;
      }
    }

    // Finalize the last phase
    const lastFrame = poseSequence[poseSequence.length - 1];
    const lastAngles = this.calculateJointAngles(lastFrame.landmarks);
    this.finalizePhase(
      phases, currentPhase, phaseStartFrame, poseSequence.length - 1,
      (lastAngles.leftHip + lastAngles.rightHip) / 2,
      (lastAngles.leftKnee + lastAngles.rightKnee) / 2,
      this.calculateAnkleAngles(lastFrame.landmarks),
      lastFrame.timestamp
    );

    return phases;
  }

  /**
   * Helper method to finalize movement phases
   */
  private finalizePhase(
    phases: SquatPhase[],
    type: 'descent' | 'bottom' | 'ascent' | 'standing',
    startFrame: number,
    endFrame: number,
    hipAngle: number,
    kneeAngle: number,
    ankleAngle: number,
    timestamp: number
  ): void {
    const duration = (endFrame - startFrame) * (1000 / 30); // Assuming ~30fps, convert to ms

    phases.push({
      type,
      startFrame,
      endFrame,
      duration,
      hipAngle,
      kneeAngle,
      ankleAngle,
      keyMetrics: {
        averageHipAngle: hipAngle,
        averageKneeAngle: kneeAngle,
        averageAnkleAngle: ankleAngle
      }
    });
  }

  /**
   * Calculate ankle angles (shin-foot angle)
   */
  private calculateAnkleAngles(landmarks: Landmark[]): number {
    const leftAnkleAngle = this.calculateAngle(
      landmarks[POSE_LANDMARKS.LEFT_KNEE],
      landmarks[POSE_LANDMARKS.LEFT_ANKLE],
      landmarks[POSE_LANDMARKS.LEFT_FOOT_INDEX]
    );

    const rightAnkleAngle = this.calculateAngle(
      landmarks[POSE_LANDMARKS.RIGHT_KNEE],
      landmarks[POSE_LANDMARKS.RIGHT_ANKLE],
      landmarks[POSE_LANDMARKS.RIGHT_FOOT_INDEX]
    );

    return (leftAnkleAngle + rightAnkleAngle) / 2;
  }

  /**
   * Analyze squat depth - critical for proper squat form
   * Measures hip angle at lowest point and determines if parallel is reached
   */
  private analyzeSquatDepth(
    poseSequence: PoseSequence,
    jointAnglesSequence: JointAngles[],
    phases: MovementPhase[]
  ): DepthAnalysis {
    // Find the deepest point (minimum hip angle during descent/bottom phases)
    let minHipAngle = Infinity;
    let reachedParallel = false;
    let belowParallel = false;
    const hipAngles: number[] = [];

    // Collect hip angles during descent and bottom phases
    phases.forEach(phase => {
      if (phase.type === 'descent' || phase.type === 'bottom') {
        for (let i = phase.startFrame; i <= (phase.endFrame || phase.startFrame); i++) {
          if (i < jointAnglesSequence.length) {
            const angles = jointAnglesSequence[i];
            const avgHipAngle = (angles.leftHip + angles.rightHip) / 2;
            if (avgHipAngle > 0) { // Valid angle
              hipAngles.push(avgHipAngle);
              minHipAngle = Math.min(minHipAngle, avgHipAngle);
            }
          }
        }
      }
    });

    // Determine depth achievement
    if (minHipAngle <= this.SQUAT_THRESHOLDS.PARALLEL_HIP_ANGLE) {
      reachedParallel = true;
    }
    if (minHipAngle <= this.SQUAT_THRESHOLDS.GOOD_DEPTH_HIP_ANGLE) {
      belowParallel = true;
    }

    // Calculate depth score (100 = perfect depth, 0 = no depth)
    let depthScore = 0;
    if (minHipAngle < Infinity) {
      if (belowParallel) {
        depthScore = 100;
      } else if (reachedParallel) {
        depthScore = 85;
      } else {
        // Partial credit for partial depth
        const depthRatio = (180 - minHipAngle) / (180 - this.SQUAT_THRESHOLDS.PARALLEL_HIP_ANGLE);
        depthScore = Math.max(0, Math.min(70, depthRatio * 70));
      }
    }

    // Calculate consistency of depth across repetitions
    const depthConsistency = this.calculateDepthConsistency(hipAngles);

    return {
      maxDepth: minHipAngle === Infinity ? 180 : minHipAngle,
      reachedParallel,
      belowParallel,
      depthScore,
      consistency: depthConsistency
    };
  }

  /**
   * Calculate consistency of squat depth across repetitions
   */
  private calculateDepthConsistency(hipAngles: number[]): number {
    if (hipAngles.length < 2) return 1.0;

    // Find local minima (deepest points in each rep)
    const localMinima: number[] = [];
    for (let i = 1; i < hipAngles.length - 1; i++) {
      if (hipAngles[i] < hipAngles[i - 1] && hipAngles[i] < hipAngles[i + 1]) {
        localMinima.push(hipAngles[i]);
      }
    }

    if (localMinima.length < 2) return 1.0;

    // Calculate coefficient of variation
    const mean = localMinima.reduce((sum, angle) => sum + angle, 0) / localMinima.length;
    const variance = localMinima.reduce((sum, angle) => sum + Math.pow(angle - mean, 2), 0) / localMinima.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / mean;

    // Convert to consistency score (lower variation = higher consistency)
    return Math.max(0, 1 - coefficientOfVariation);
  }

  /**
   * Analyze knee alignment - prevents knee valgus (inward collapse)
   */
  private analyzeKneeAlignment(poseSequence: PoseSequence, phases: MovementPhase[]): KneeAlignment {
    let maxInwardDeviation = 0;
    let valgusCollapse = false;
    const kneeDeviations: number[] = [];

    // Analyze knee tracking during descent and ascent phases
    phases.forEach(phase => {
      if (phase.type === 'descent' || phase.type === 'ascent') {
        for (let i = phase.startFrame; i <= (phase.endFrame || phase.startFrame); i++) {
          if (i < poseSequence.length) {
            const frame = poseSequence[i];
            const deviation = this.calculateKneeDeviation(frame.landmarks);
            if (deviation > 0) {
              kneeDeviations.push(deviation);
              maxInwardDeviation = Math.max(maxInwardDeviation, deviation);
              
              if (deviation > this.SQUAT_THRESHOLDS.MAX_KNEE_INWARD_DEVIATION) {
                valgusCollapse = true;
              }
            }
          }
        }
      }
    });

    // Calculate knee tracking score
    let kneeTrackingScore = 100;
    if (valgusCollapse) {
      kneeTrackingScore = Math.max(0, 100 - (maxInwardDeviation - this.SQUAT_THRESHOLDS.MAX_KNEE_INWARD_DEVIATION) * 2);
    } else {
      kneeTrackingScore = Math.max(70, 100 - maxInwardDeviation);
    }

    // Calculate consistency
    const consistencyScore = kneeDeviations.length > 1 ? 
      this.calculateConsistencyScore(kneeDeviations.map((dev, idx) => ({ 
        type: 'knee_tracking' as const, 
        startFrame: idx, 
        duration: 1,
        keyMetrics: { deviation: dev }
      }))) : 1.0;

    return {
      kneeTrackingScore,
      valgusCollapse,
      maxInwardDeviation,
      consistencyScore
    };
  }

  /**
   * Calculate knee inward deviation using landmark positions
   */
  private calculateKneeDeviation(landmarks: Landmark[]): number {
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
    const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
    const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
    const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

    if (!this.validateLandmarkConfidence([leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle])) {
      return 0;
    }

    // Calculate ideal knee position (directly below hip, above ankle)
    const leftIdealKneeX = (leftHip.x + leftAnkle.x) / 2;
    const rightIdealKneeX = (rightHip.x + rightAnkle.x) / 2;

    // Calculate actual deviation
    const leftDeviation = Math.abs(leftKnee.x - leftIdealKneeX);
    const rightDeviation = Math.abs(rightKnee.x - rightIdealKneeX);

    // Convert pixel deviation to degrees (approximation)
    const avgDeviation = (leftDeviation + rightDeviation) / 2;
    const hipWidth = Math.abs(rightHip.x - leftHip.x);
    const deviationRatio = avgDeviation / hipWidth;
    
    // Convert to degrees (rough approximation based on typical joint mechanics)
    return deviationRatio * 45; // Max ~45 degrees for complete collapse
  }

  /**
   * Analyze spinal alignment during squat movement
   */
  private analyzeSpinalAlignment(
    poseSequence: PoseSequence,
    jointAnglesSequence: JointAngles[],
    phases: MovementPhase[]
  ): SpinalAlignment {
    let maxForwardLean = 0;
    let maxLateralDeviation = 0;
    let neutralSpineFrames = 0;
    let totalFrames = 0;

    phases.forEach(phase => {
      if (phase.type !== 'standing') { // Analyze during movement phases
        for (let i = phase.startFrame; i <= (phase.endFrame || phase.startFrame); i++) {
          if (i < poseSequence.length && i < jointAnglesSequence.length) {
            const frame = poseSequence[i];
            const angles = jointAnglesSequence[i];
            
            // Calculate forward lean
            const forwardLean = this.calculateForwardLean(frame.landmarks);
            maxForwardLean = Math.max(maxForwardLean, forwardLean);

            // Calculate lateral deviation
            const lateralDev = this.calculateLateralDeviation(frame.landmarks);
            maxLateralDeviation = Math.max(maxLateralDeviation, lateralDev);

            // Check for neutral spine
            if (forwardLean <= this.SQUAT_THRESHOLDS.MAX_FORWARD_LEAN && lateralDev <= 10) {
              neutralSpineFrames++;
            }
            totalFrames++;
          }
        }
      }
    });

    const neutralSpine = totalFrames > 0 ? neutralSpineFrames / totalFrames > 0.8 : true;
    
    // Calculate alignment score
    let alignmentScore = 100;
    if (maxForwardLean > this.SQUAT_THRESHOLDS.MAX_FORWARD_LEAN) {
      alignmentScore -= (maxForwardLean - this.SQUAT_THRESHOLDS.MAX_FORWARD_LEAN) * 1.5;
    }
    if (maxLateralDeviation > 10) {
      alignmentScore -= maxLateralDeviation * 2;
    }
    alignmentScore = Math.max(0, alignmentScore);

    return {
      neutralSpine,
      forwardLean: maxForwardLean,
      lateralDeviation: maxLateralDeviation,
      alignmentScore
    };
  }

  /**
   * Calculate forward lean of the torso
   */
  private calculateForwardLean(landmarks: Landmark[]): number {
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
    const angleFromVertical = Math.atan2(Math.abs(dx), Math.abs(dy)) * (180 / Math.PI);

    return angleFromVertical;
  }

  /**
   * Calculate lateral deviation of the spine
   */
  private calculateLateralDeviation(landmarks: Landmark[]): number {
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

    if (!this.validateLandmarkConfidence([leftShoulder, rightShoulder, leftHip, rightHip])) {
      return 0;
    }

    // Calculate shoulder and hip line angles
    const shoulderAngle = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x);
    const hipAngle = Math.atan2(rightHip.y - leftHip.y, rightHip.x - leftHip.x);

    // Calculate difference (lateral spine curvature)
    const angleDifference = Math.abs(shoulderAngle - hipAngle) * (180 / Math.PI);

    return angleDifference;
  }

  /**
   * Analyze balance and weight distribution
   */
  private analyzeBalance(poseSequence: PoseSequence, phases: MovementPhase[]): BalanceAnalysis {
    const centerOfMassPositions: Array<{ x: number; y: number }> = [];
    const anklePositions: Array<{ x: number; y: number }> = [];

    // Collect center of mass and ankle positions during movement
    phases.forEach(phase => {
      for (let i = phase.startFrame; i <= (phase.endFrame || phase.startFrame); i++) {
        if (i < poseSequence.length) {
          const frame = poseSequence[i];
          const com = this.calculateCenterOfMass(frame.landmarks);
          centerOfMassPositions.push(com);

          // Calculate average ankle position (base of support)
          const leftAnkle = frame.landmarks[POSE_LANDMARKS.LEFT_ANKLE];
          const rightAnkle = frame.landmarks[POSE_LANDMARKS.RIGHT_ANKLE];
          if (this.validateLandmarkConfidence([leftAnkle, rightAnkle])) {
            anklePositions.push({
              x: (leftAnkle.x + rightAnkle.x) / 2,
              y: (leftAnkle.y + rightAnkle.y) / 2
            });
          }
        }
      }
    });

    if (centerOfMassPositions.length === 0 || anklePositions.length === 0) {
      return {
        weightDistribution: 'centered',
        stabilityScore: 50,
        sway: 0
      };
    }

    // Calculate sway (total movement of center of mass)
    let totalSway = 0;
    for (let i = 1; i < centerOfMassPositions.length; i++) {
      const dx = centerOfMassPositions[i].x - centerOfMassPositions[i - 1].x;
      const dy = centerOfMassPositions[i].y - centerOfMassPositions[i - 1].y;
      totalSway += Math.sqrt(dx * dx + dy * dy);
    }
    const averageSway = totalSway / (centerOfMassPositions.length - 1);

    // Determine weight distribution
    const comXPositions = centerOfMassPositions.map(pos => pos.x);
    const ankleXPositions = anklePositions.map(pos => pos.x);
    const avgComX = comXPositions.reduce((sum, x) => sum + x, 0) / comXPositions.length;
    const avgAnkleX = ankleXPositions.reduce((sum, x) => sum + x, 0) / ankleXPositions.length;
    
    const forwardBackwardDeviation = avgComX - avgAnkleX;
    let weightDistribution: BalanceAnalysis['weightDistribution'] = 'centered';
    
    if (Math.abs(forwardBackwardDeviation) > 20) {
      weightDistribution = forwardBackwardDeviation > 0 ? 'forward' : 'backward';
    }

    // Calculate stability score (lower sway = higher stability)
    const stabilityScore = Math.max(0, 100 - averageSway * 2);

    return {
      weightDistribution,
      stabilityScore,
      sway: averageSway
    };
  }

  /**
   * Analyze movement timing and tempo
   */
  private analyzeMovementTiming(phases: MovementPhase[]): MovementTiming {
    let descendDuration = 0;
    let ascentDuration = 0;
    let totalDuration = 0;

    const phaseTimings: Record<string, number> = {};

    phases.forEach(phase => {
      const duration = phase.duration || 0;
      phaseTimings[phase.type] = duration;
      totalDuration += duration;

      if (phase.type === 'descent') {
        descendDuration = duration;
      } else if (phase.type === 'ascent') {
        ascentDuration = duration;
      }
    });

    // Calculate tempo score (ideal descent:ascent ratio is 2:1)
    let tempoScore = 100;
    if (descendDuration > 0 && ascentDuration > 0) {
      const actualRatio = descendDuration / ascentDuration;
      const idealRatio = this.SQUAT_THRESHOLDS.IDEAL_TEMPO_RATIO;
      const ratioDeviation = Math.abs(actualRatio - idealRatio);
      tempoScore = Math.max(0, 100 - ratioDeviation * 25);
    }

    // Check if descent duration is within ideal range
    if (descendDuration < this.SQUAT_THRESHOLDS.MIN_DESCENT_DURATION * 1000 || 
        descendDuration > this.SQUAT_THRESHOLDS.MAX_DESCENT_DURATION * 1000) {
      tempoScore = Math.min(tempoScore, 70);
    }

    // Calculate rhythm consistency (for multiple reps)
    const rhythmConsistency = this.calculateRhythmConsistency(phases);

    return {
      totalDuration,
      phaseTimings,
      tempoScore,
      rhythmConsistency
    };
  }

  /**
   * Calculate rhythm consistency across multiple repetitions
   */
  private calculateRhythmConsistency(phases: MovementPhase[]): number {
    const descentPhases = phases.filter(p => p.type === 'descent');
    const ascentPhases = phases.filter(p => p.type === 'ascent');

    if (descentPhases.length < 2 || ascentPhases.length < 2) {
      return 1.0; // Perfect consistency if only one rep
    }

    // Calculate consistency for descent phases
    const descentDurations = descentPhases.map(p => p.duration || 0);
    const descentConsistency = this.calculateVariationCoefficient(descentDurations);

    // Calculate consistency for ascent phases
    const ascentDurations = ascentPhases.map(p => p.duration || 0);
    const ascentConsistency = this.calculateVariationCoefficient(ascentDurations);

    // Average consistency
    return (descentConsistency + ascentConsistency) / 2;
  }

  /**
   * Calculate coefficient of variation for timing consistency
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

  /**
   * Analyze overall movement pattern
   */
  private analyzeMovementPattern(poseSequence: PoseSequence, phases: MovementPhase[]): MovementPattern {
    // Calculate tempo from phases
    const descendPhase = phases.find(p => p.type === 'descent');
    const ascentPhase = phases.find(p => p.type === 'ascent');
    
    const tempo = {
      descendDuration: descendPhase?.duration || 0,
      ascentDuration: ascentPhase?.duration || 0,
      totalDuration: phases.reduce((sum, p) => sum + (p.duration || 0), 0)
    };

    // Calculate consistency across all phases
    const consistency = this.calculateConsistencyScore(phases);

    // Calculate smoothness using hip position data
    const hipPositions = poseSequence.map(frame => {
      const leftHip = frame.landmarks[POSE_LANDMARKS.LEFT_HIP];
      const rightHip = frame.landmarks[POSE_LANDMARKS.RIGHT_HIP];
      return (leftHip.y + rightHip.y) / 2;
    });
    const smoothness = this.calculateSmoothnessScore(hipPositions);

    return {
      phases,
      tempo,
      consistency,
      smoothness
    };
  }

  /**
   * Identify specific form errors in squat movement
   */
  private identifySquatErrors(
    depth: DepthAnalysis,
    knee: KneeAlignment,
    spine: SpinalAlignment,
    balance: BalanceAnalysis,
    phases: MovementPhase[]
  ): FormError[] {
    const errors: FormError[] = [];

    // Depth errors
    if (!depth.reachedParallel) {
      const severity = this.determineErrorSeverity(
        this.SQUAT_THRESHOLDS.PARALLEL_HIP_ANGLE - depth.maxDepth,
        'depth'
      );
      errors.push(this.createFormError(
        'shallow_depth',
        severity,
        [0, phases[phases.length - 1]?.endFrame || 0],
        `Squat depth insufficient. Hip angle reached ${depth.maxDepth.toFixed(1)}°, need ≤${this.SQUAT_THRESHOLDS.PARALLEL_HIP_ANGLE}°`,
        'Focus on sitting back further and allowing knees to bend more. Practice bodyweight squats to full depth.',
        [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE]
      ));
    }

    // Knee alignment errors
    if (knee.valgusCollapse) {
      const severity = this.determineErrorSeverity(knee.maxInwardDeviation, 'knee');
      errors.push(this.createFormError(
        'knee_cave',
        severity,
        [0, phases[phases.length - 1]?.endFrame || 0],
        `Knee valgus detected. Maximum inward deviation: ${knee.maxInwardDeviation.toFixed(1)}°`,
        'Focus on pushing knees out and strengthening glutes. Practice wall sits with band around knees.',
        [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE]
      ));
    }

    // Spinal alignment errors
    if (!spine.neutralSpine) {
      const severity = this.determineErrorSeverity(spine.forwardLean, 'spinal');
      if (spine.forwardLean > this.SQUAT_THRESHOLDS.MAX_FORWARD_LEAN) {
        errors.push(this.createFormError(
          'forward_lean',
          severity,
          [0, phases[phases.length - 1]?.endFrame || 0],
          `Excessive forward lean: ${spine.forwardLean.toFixed(1)}°. Keep chest up and core engaged.`,
          'Work on ankle mobility and core strength. Practice goblet squats to improve posture.',
          [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP]
        ));
      }
    }

    // Balance errors
    if (balance.weightDistribution !== 'centered') {
      errors.push(this.createFormError(
        'hip_shift',
        'medium',
        [0, phases[phases.length - 1]?.endFrame || 0],
        `Weight distribution is ${balance.weightDistribution}. Center weight over feet.`,
        'Focus on even weight distribution. Practice single-leg exercises to improve balance.',
        [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE]
      ));
    }

    return errors;
  }

  /**
   * Generate improvement suggestions for squat form
   */
  private generateSquatSuggestions(
    depth: DepthAnalysis,
    knee: KneeAlignment,
    spine: SpinalAlignment,
    balance: BalanceAnalysis
  ): FormSuggestion[] {
    const suggestions: FormSuggestion[] = [];

    // Depth improvements
    if (depth.depthScore < 90) {
      suggestions.push(this.createFormSuggestion(
        'depth',
        'high',
        'Work on hip and ankle mobility to achieve greater squat depth',
        'Improved depth will better target glutes and quadriceps'
      ));
    }

    // Knee alignment improvements
    if (knee.kneeTrackingScore < 85) {
      suggestions.push(this.createFormSuggestion(
        'alignment',
        'high',
        'Strengthen glutes and practice external rotation exercises',
        'Better knee tracking reduces injury risk and improves power transfer'
      ));
    }

    // Spinal alignment improvements
    if (spine.alignmentScore < 80) {
      suggestions.push(this.createFormSuggestion(
        'alignment',
        'medium',
        'Improve thoracic mobility and core stability',
        'Better spinal alignment reduces lower back stress'
      ));
    }

    // Balance improvements
    if (balance.stabilityScore < 75) {
      suggestions.push(this.createFormSuggestion(
        'balance',
        'medium',
        'Practice single-leg exercises and balance training',
        'Improved stability allows for heavier loads and better form'
      ));
    }

    // Consistency improvements
    if (depth.consistency < 0.8) {
      suggestions.push(this.createFormSuggestion(
        'range_of_motion',
        'low',
        'Focus on consistent depth across all repetitions',
        'Consistent form ensures even muscle development'
      ));
    }

    return suggestions;
  }

  /**
   * Calculate overall squat score using weighted components
   */
  private calculateOverallSquatScore(
    depth: DepthAnalysis,
    knee: KneeAlignment,
    spine: SpinalAlignment,
    balance: BalanceAnalysis,
    timing: MovementTiming,
    pattern: MovementPattern
  ): number {
    const weights = this.SQUAT_WEIGHTS;

    const weightedScore = 
      (depth.depthScore * weights.DEPTH) +
      (knee.kneeTrackingScore * weights.KNEE_ALIGNMENT) +
      (spine.alignmentScore * weights.SPINAL_ALIGNMENT) +
      (balance.stabilityScore * weights.BALANCE) +
      (timing.tempoScore * weights.TEMPO) +
      (pattern.consistency * 100 * weights.CONSISTENCY);

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
      const criticalLandmarks = EXERCISE_CRITICAL_LANDMARKS.SQUAT;
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
   * Validate squat-specific pose data
   */
  private validateSquatData(poseSequence: PoseSequence): boolean {
    if (poseSequence.length < this.minFramesRequired) {
      return false;
    }

    // Check if critical landmarks are detected in sufficient frames
    const criticalLandmarks = EXERCISE_CRITICAL_LANDMARKS.SQUAT;
    let validFrames = 0;

    for (const frame of poseSequence) {
      if (this.validatePoseData(frame.landmarks, criticalLandmarks)) {
        validFrames++;
      }
    }

    // Require at least 80% of frames to have valid pose data
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