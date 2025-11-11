/**
 * Pose Analysis Service - Main service class for pose detection and movement analysis
 * Integrates with React Native ML Kit for on-device pose detection
 * 
 * Features:
 * - Video file processing and frame extraction
 * - Real-time pose detection on video frames  
 * - Exercise-specific movement analysis
 * - Form feedback and scoring
 * - Progress tracking and comparison
 */

import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Video } from 'expo-av';

// Subscription and usage tracking services
import usageTrackingService from '../usageTrackingService';
import poseSubscriptionService from '../poseSubscriptionService';

// Performance and video processing services
import performanceMonitor from '../performanceMonitor';
import frameOptimizer from '../frameOptimizer';

// Types
import {
  PoseLandmarks,
  PoseSequence,
  VideoFrame,
  FormAnalysis,
  SquatAnalysis,
  PitchAnalysis,
  ExerciseType,
  SportType,
  AnalysisResult,
  AnalysisError,
  AnalysisErrorType,
  PoseDetectionConfig,
  PerformanceConfig,
  FrameExtractionOptions,
  JointAngles,
  MovementPhase,
  MovementPattern,
  FormError,
  FormSuggestion,
  ConfidenceMetrics,
  Landmark
} from './types';

// Constants
import {
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
  SUCCESS_MESSAGES
} from './constants';

// Storage keys
const POSE_ANALYSIS_CACHE_KEY = '@pose_analysis_cache';
const POSE_SETTINGS_KEY = '@pose_settings';
const ANALYSIS_HISTORY_KEY = '@analysis_history';

/**
 * Main Pose Analysis Service Class
 * Handles all aspects of pose detection and movement analysis
 */
class PoseAnalysisService {
  private isInitialized: boolean = false;
  private config: PoseDetectionConfig;
  private performanceConfig: PerformanceConfig;
  private analysisCache: Map<string, AnalysisResult> = new Map();
  private processingQueue: Map<string, Promise<AnalysisResult>> = new Map();

  constructor(config?: Partial<PoseDetectionConfig>) {
    this.config = { ...DEFAULT_POSE_CONFIG, ...config };
    this.performanceConfig = PERFORMANCE_CONFIG;
    console.log('PoseAnalysisService: Initialized with config', this.config);
  }

  /**
   * Initialize the pose analysis service
   */
  async initialize(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('PoseAnalysisService: Initializing...');

      // Check platform support
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        return {
          success: false,
          message: 'Pose analysis is only supported on iOS and Android devices'
        };
      }

      // Load saved settings
      const savedSettings = await AsyncStorage.getItem(POSE_SETTINGS_KEY);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        this.config = { ...this.config, ...settings };
      }

      // Check ML Kit availability (in production would check actual ML Kit)
      const mlKitAvailable = await this.checkMLKitAvailability();
      if (!mlKitAvailable) {
        console.warn('ML Kit not available, using mock analysis');
      }

      this.isInitialized = true;
      console.log('PoseAnalysisService: Initialization complete');

      return {
        success: true,
        message: 'Pose analysis service initialized successfully'
      };
    } catch (error) {
      console.error('PoseAnalysisService: Initialization failed:', error);
      return {
        success: false,
        message: `Initialization failed: ${error.message}`
      };
    }
  }

  /**
   * Analyze a video file for exercise form
   */
  async analyzeVideoFile(
    videoUri: string,
    exerciseType: ExerciseType | SportType,
    options?: {
      frameExtractionOptions?: FrameExtractionOptions;
      saveToHistory?: boolean;
      enableProgressTracking?: boolean;
    }
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    let sessionId: string | null = null;

    try {
      console.log(`PoseAnalysisService: Starting analysis for ${exerciseType}`, { videoUri });

      if (!this.isInitialized) {
        throw new Error('Service not initialized. Call initialize() first.');
      }

      // STEP 1: Check subscription and usage permissions
      const permission = await usageTrackingService.checkAnalysisPermission();
      if (!permission.allowed) {
        const processingTime = Date.now() - startTime;
        return {
          success: false,
          errors: [{
            type: AnalysisErrorType.QUOTA_EXCEEDED,
            message: permission.message || 'Analysis quota exceeded',
            details: {
              reason: permission.reason,
              quotaInfo: permission.quotaInfo,
              resetDate: permission.resetDate
            },
            recoverable: permission.reason === 'quota_exceeded'
          }],
          warnings: [],
          processingTime,
          framesProcessed: 0,
          confidenceMetrics: this.createEmptyConfidenceMetrics()
        };
      }

      // STEP 2: Validate video file size and format based on subscription tier
      const subscription = await poseSubscriptionService.getSubscriptionStatus();
      const videoValidation = await this.validateVideoWithSubscription(videoUri, subscription);
      if (!videoValidation.valid) {
        const processingTime = Date.now() - startTime;
        return {
          success: false,
          errors: [{
            type: AnalysisErrorType.FILE_VALIDATION_FAILED,
            message: videoValidation.error || 'Video file validation failed',
            details: videoValidation.details,
            recoverable: true
          }],
          warnings: [],
          processingTime,
          framesProcessed: 0,
          confidenceMetrics: this.createEmptyConfidenceMetrics()
        };
      }

      // STEP 3: Start usage tracking session
      sessionId = await usageTrackingService.startAnalysisSession({
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        exerciseType,
        videoUri,
        videoSize: videoValidation.fileSize,
        videoDuration: videoValidation.duration
      });

      console.log(`🟢 Analysis session started: ${sessionId.sessionId}`);

      // Check if analysis is already in progress
      const cacheKey = this.generateCacheKey(videoUri, exerciseType);
      if (this.processingQueue.has(cacheKey)) {
        console.log('Analysis already in progress, waiting for result...');
        return await this.processingQueue.get(cacheKey)!;
      }

      // Start analysis and add to queue
      const analysisPromise = this.performAnalysisWithTracking(
        videoUri, 
        exerciseType, 
        options, 
        sessionId.sessionId,
        subscription
      );
      this.processingQueue.set(cacheKey, analysisPromise);

      try {
        const result = await analysisPromise;
        
        // STEP 4: Complete usage tracking session
        if (sessionId && result.success) {
          await usageTrackingService.completeAnalysisSession(sessionId.sessionId, {
            ...result,
            exerciseType
          });
          console.log(`✅ Analysis session completed: ${sessionId.sessionId}`);
        } else if (sessionId && !result.success) {
          await usageTrackingService.failAnalysisSession(sessionId.sessionId, {
            type: 'analysis_failed',
            message: result.errors?.[0]?.message || 'Analysis failed',
            details: result.errors?.[0]?.details,
            processingTime: result.processingTime
          });
          console.log(`❌ Analysis session failed: ${sessionId.sessionId}`);
        }
        
        // Cache successful results
        if (result.success) {
          this.analysisCache.set(cacheKey, result);
          
          // Save to history if requested
          if (options?.saveToHistory !== false) {
            // Get video metadata for progress tracking
            const videoMetadata = {
              duration: videoValidation?.duration || await this.getVideoDuration(videoUri).catch(() => null),
              fileSize: videoValidation?.fileSize || null,
            };
            await this.saveToHistory(videoUri, exerciseType, result, videoMetadata);
          }

          // Generate form context for AI coaching integration
          if (options?.generateFormContext) {
            try {
              const { default: formContextService } = await import('../../formContextService');
              await formContextService.initialize();
              
              // Build AI coaching context with the analysis result
              const formContext = await formContextService.buildAICoachingContext(
                result,
                exerciseType,
                {
                  contextType: options.contextType || 'focused',
                  includeHistory: options.includeHistory !== false,
                  targetTokens: options.targetTokens || 1500
                }
              );
              
              // Attach context to result for downstream AI coaching
              result.formContext = formContext;
              console.log('✅ Form context generated for AI coaching');
            } catch (contextError) {
              console.warn('⚠️ Failed to generate form context:', contextError);
              // Don't fail the analysis if context generation fails
            }
          }
        }

        return result;
      } finally {
        // Remove from processing queue
        this.processingQueue.delete(cacheKey);
      }

    } catch (error) {
      console.error('PoseAnalysisService: Video analysis failed:', error);
      
      // Handle session failure if session was started
      if (sessionId) {
        try {
          await usageTrackingService.failAnalysisSession(sessionId.sessionId, {
            type: 'system_error',
            message: error.message || 'System error during analysis',
            details: { error: error.toString() },
            processingTime: Date.now() - startTime
          });
        } catch (sessionError) {
          console.error('Failed to record session failure:', sessionError);
        }
      }
      
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        errors: [{
          type: AnalysisErrorType.POSE_DETECTION_FAILED,
          message: error.message || 'Unknown error occurred during analysis',
          details: error,
          recoverable: true
        }],
        warnings: [],
        processingTime,
        framesProcessed: 0,
        confidenceMetrics: this.createEmptyConfidenceMetrics()
      };
    }
  }

  /**
   * Perform the actual video analysis with tracking integration
   */
  private async performAnalysisWithTracking(
    videoUri: string,
    exerciseType: ExerciseType | SportType,
    options: any,
    sessionId: string,
    subscription: any
  ): Promise<AnalysisResult> {
    // Delegate to the original analysis method
    return this.performAnalysis(videoUri, exerciseType, options);
  }

  /**
   * Perform the actual video analysis
   */
  private async performAnalysis(
    videoUri: string,
    exerciseType: ExerciseType | SportType,
    options?: any
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    let framesProcessed = 0;

    // Start performance monitoring session
    const videoInfo = { videoUri, exerciseType };
    performanceMonitor.startSession(videoInfo);

    try {
      // Step 1: Validate video file
      const videoValidation = await this.validateVideoFile(videoUri);
      if (!videoValidation.valid) {
        throw new Error(videoValidation.error || 'Video validation failed');
      }

      // Get video metadata for performance monitoring
      const videoDuration = await this.getVideoDuration(videoUri);
      performanceMonitor.startProcessing(Math.floor(videoDuration / 100)); // Estimate total frames

      // Step 2: Extract frames from video using optimized frame optimizer
      console.log('Extracting frames from video with frameOptimizer...');
      const frames = await this.extractFramesFromVideo(
        videoUri,
        options?.frameExtractionOptions
      );

      if (frames.length < ANALYSIS_THRESHOLDS.MIN_FRAMES_FOR_ANALYSIS) {
        throw new Error(`Insufficient frames for analysis. Got ${frames.length}, need at least ${ANALYSIS_THRESHOLDS.MIN_FRAMES_FOR_ANALYSIS}`);
      }

      // Step 3: Process frames for pose detection
      console.log(`Processing ${frames.length} frames for pose detection...`);
      const poseSequence = await this.processFramesForPoseDetection(frames);
      framesProcessed = poseSequence.length;

      if (poseSequence.length === 0) {
        throw new Error('No pose data detected in video frames');
      }

      // Step 4: Validate pose data quality
      const confidenceMetrics = this.calculateConfidenceMetrics(poseSequence, frames.length);
      if (confidenceMetrics.framesCoverage < ANALYSIS_THRESHOLDS.MIN_POSE_COVERAGE) {
        throw new Error(`Insufficient pose coverage: ${(confidenceMetrics.framesCoverage * 100).toFixed(1)}%`);
      }

      // Step 5: Perform movement analysis
      console.log(`Analyzing movement pattern for ${exerciseType}...`);
      let analysis: FormAnalysis;

      if (Object.values(ExerciseType).includes(exerciseType as ExerciseType)) {
        analysis = await this.analyzeExerciseMovement(poseSequence, exerciseType as ExerciseType);
      } else if (Object.values(SportType).includes(exerciseType as SportType)) {
        analysis = await this.analyzeSportMovement(poseSequence, exerciseType as SportType);
      } else {
        throw new Error(`Unsupported exercise/sport type: ${exerciseType}`);
      }

      const processingTime = Date.now() - startTime;
      console.log(`Analysis completed in ${processingTime}ms`);

      // End performance monitoring
      const performanceMetrics = await performanceMonitor.endProcessing(true);
      const sessionReport = await performanceMonitor.endSession();

      console.log('Performance Report:', {
        score: sessionReport.score,
        processingDuration: sessionReport.processingMetrics.duration,
        batteryDrain: sessionReport.resourceUsage.batteryDrain,
        recommendations: sessionReport.recommendations
      });

      return {
        success: true,
        analysis,
        errors: [],
        warnings: this.generateWarnings(confidenceMetrics, analysis),
        processingTime,
        framesProcessed,
        confidenceMetrics
      };

    } catch (error) {
      console.error('Analysis failed:', error);

      // End performance monitoring with failure
      await performanceMonitor.endProcessing(false);
      await performanceMonitor.endSession();

      throw error;
    }
  }

  /**
   * Extract frames from video file
   */
  private async extractFramesFromVideo(
    videoUri: string,
    options?: FrameExtractionOptions
  ): Promise<VideoFrame[]> {
    try {
      const extractionOptions = {
        frameRate: VIDEO_PROCESSING.DEFAULT_EXTRACTION_FPS,
        quality: 'medium' as const,
        maxFrames: 300, // 10 seconds at 30fps
        ...options
      };

      console.log('Extracting frames with frameOptimizer:', extractionOptions);

      // Get device tier from performance monitor for adaptive processing
      const deviceTier = performanceMonitor.metrics?.performanceTier || 'medium';
      const videoDuration = await this.getVideoDuration(videoUri);

      // Use frameOptimizer for intelligent frame extraction
      const result = await frameOptimizer.extractOptimizedFrames(videoUri, {
        duration: videoDuration / 1000, // Convert to seconds
        exerciseType: 'general', // Could be passed from options
        deviceTier: deviceTier,
        onProgress: (progress) => {
          // Track frame processing progress
          performanceMonitor.recordFrameProcessing(
            progress.current,
            Date.now() - (performanceMonitor.metrics?.processingStartTime || Date.now()),
            true
          );
        }
      });

      if (!result.success) {
        throw new Error(result.error || 'Frame extraction failed');
      }

      // Convert optimized frames to VideoFrame format expected by pose detection
      const frames: VideoFrame[] = result.frames.map(frame => ({
        uri: frame.uri,
        timestamp: frame.timestamp * 1000, // Convert seconds to ms
        duration: 1000 / extractionOptions.frameRate
      }));

      console.log(`✅ Extracted ${frames.length} optimized frames (${result.metadata.compressionRatio.toFixed(2)}x compression)`);
      console.log(`Frame optimization: ${result.metadata.originalFrameCount} → ${result.metadata.optimizedFrameCount} frames`);

      return frames;
    } catch (error) {
      console.error('Frame extraction failed:', error);
      throw new Error(`Failed to extract frames: ${error.message}`);
    }
  }

  /**
   * Process video frames for pose detection
   */
  private async processFramesForPoseDetection(frames: VideoFrame[]): Promise<PoseSequence> {
    const poseSequence: PoseSequence = [];
    const batchSize = this.performanceConfig.batchSize;

    try {
      // Process frames in batches for better performance
      for (let i = 0; i < frames.length; i += batchSize) {
        const batch = frames.slice(i, i + batchSize);
        
        console.log(`Processing frame batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(frames.length / batchSize)}`);
        
        const batchResults = await Promise.allSettled(
          batch.map(async (frame, index) => {
            // Skip frames based on frameSkip setting
            if ((i + index) % this.performanceConfig.frameSkip !== 0) {
              return null;
            }

            try {
              const pose = await this.detectPoseInFrame(frame);
              return pose;
            } catch (error) {
              console.warn(`Pose detection failed for frame ${i + index}:`, error);
              return null;
            }
          })
        );

        // Add successful detections to sequence
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            poseSequence.push(result.value);
          }
        });
      }

      console.log(`Pose detection complete: ${poseSequence.length} poses detected from ${frames.length} frames`);
      return poseSequence;
    } catch (error) {
      console.error('Pose detection processing failed:', error);
      throw new Error(`Pose detection failed: ${error.message}`);
    }
  }

  /**
   * Detect pose in a single frame
   */
  private async detectPoseInFrame(frame: VideoFrame): Promise<PoseLandmarks | null> {
    try {
      // In production: Use @react-native-ml-kit/pose-detection
      // For now: Generate mock pose data with realistic variation
      const landmarks = this.generateMockPoseLandmarks(frame.timestamp);
      
      return {
        landmarks,
        timestamp: frame.timestamp,
        frameIndex: parseInt(frame.uri.split('-')[1]) || 0
      };
    } catch (error) {
      console.error('Individual frame pose detection failed:', error);
      return null;
    }
  }

  /**
   * Analyze exercise movement pattern
   */
  private async analyzeExerciseMovement(
    poseSequence: PoseSequence,
    exerciseType: ExerciseType
  ): Promise<FormAnalysis> {
    try {
      switch (exerciseType) {
        case ExerciseType.SQUAT:
          return await this.analyzeSquat(poseSequence);
        case ExerciseType.DEADLIFT:
          return await this.analyzeDeadlift(poseSequence);
        case ExerciseType.PUSH_UP:
          return await this.analyzePushUp(poseSequence);
        case ExerciseType.BENCH_PRESS:
          return await this.analyzeBenchPress(poseSequence);
        case ExerciseType.OVERHEAD_PRESS:
          return await this.analyzeOverheadPress(poseSequence);
        default:
          throw new Error(`Exercise analysis not implemented for: ${exerciseType}`);
      }
    } catch (error) {
      console.error(`Exercise analysis failed for ${exerciseType}:`, error);
      throw error;
    }
  }

  /**
   * Analyze sport movement pattern
   */
  private async analyzeSportMovement(
    poseSequence: PoseSequence,
    sportType: SportType
  ): Promise<FormAnalysis> {
    try {
      switch (sportType) {
        case SportType.BASEBALL_PITCH:
          return await this.analyzeBaseballPitch(poseSequence);
        case SportType.TENNIS_SERVE:
          return await this.analyzeTennisServe(poseSequence);
        case SportType.GOLF_SWING:
          return await this.analyzeGolfSwing(poseSequence);
        case SportType.BASKETBALL_SHOT:
          return await this.analyzeBasketballShot(poseSequence);
        default:
          throw new Error(`Sport analysis not implemented for: ${sportType}`);
      }
    } catch (error) {
      console.error(`Sport analysis failed for ${sportType}:`, error);
      throw error;
    }
  }

  /**
   * Analyze squat movement
   */
  private async analyzeSquat(poseSequence: PoseSequence): Promise<SquatAnalysis> {
    try {
      console.log('Analyzing squat movement...');

      // Detect movement phases
      const phases = this.detectSquatPhases(poseSequence);
      
      // Calculate joint angles throughout movement
      const jointAnglesSequence = poseSequence.map(pose => this.calculateJointAngles(pose.landmarks));
      
      // Analyze depth
      const depth = this.analyzeSquatDepth(poseSequence, phases);
      
      // Analyze knee alignment
      const kneeAlignment = this.analyzeKneeAlignment(poseSequence);
      
      // Analyze spinal alignment
      const spinalAlignment = this.analyzeSpinalAlignment(poseSequence);
      
      // Analyze balance
      const balanceAnalysis = this.analyzeBalance(poseSequence);
      
      // Calculate movement pattern
      const movementPattern = this.trackMovementPattern(poseSequence);
      
      // Calculate timing
      const timing = this.calculateMovementTiming(phases);
      
      // Identify form errors
      const criticalErrors = this.identifySquatFormErrors(
        poseSequence,
        depth,
        kneeAlignment,
        spinalAlignment,
        phases
      );
      
      // Generate improvement suggestions
      const improvements = this.generateSquatImprovements(
        depth,
        kneeAlignment,
        spinalAlignment,
        balanceAnalysis,
        timing
      );
      
      // Calculate overall score
      const overallScore = this.calculateSquatScore(
        depth,
        kneeAlignment,
        spinalAlignment,
        balanceAnalysis,
        timing,
        criticalErrors
      );

      return {
        overallScore,
        criticalErrors,
        improvements,
        keyPhases: phases,
        timing,
        jointAngles: jointAnglesSequence,
        movementPattern,
        confidenceScore: 0.85, // Mock confidence
        
        // Squat-specific metrics
        depth,
        kneeAlignment,
        spinalAlignment,
        balanceAnalysis,
        phases: phases.map(phase => ({
          ...phase,
          hipAngle: this.calculateHipAngle(poseSequence[phase.startFrame]?.landmarks || []),
          kneeAngle: this.calculateKneeAngle(poseSequence[phase.startFrame]?.landmarks || []),
          ankleAngle: this.calculateAnkleAngle(poseSequence[phase.startFrame]?.landmarks || [])
        }))
      };
    } catch (error) {
      console.error('Squat analysis failed:', error);
      throw new Error(`Squat analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate mock pose landmarks for development/testing
   */
  private generateMockPoseLandmarks(timestamp: number): Landmark[] {
    const landmarks: Landmark[] = [];
    
    // Generate 33 landmarks with realistic positions and confidence
    for (let i = 0; i < 33; i++) {
      // Add some variation based on timestamp to simulate movement
      const timeVariation = Math.sin(timestamp / 1000) * 0.1;
      const randomVariation = (Math.random() - 0.5) * 0.05;
      
      landmarks.push({
        x: 0.5 + timeVariation + randomVariation,
        y: 0.3 + (i / 33) * 0.4 + timeVariation + randomVariation,
        z: Math.random() * 0.1, // Experimental depth
        inFrameLikelihood: 0.7 + Math.random() * 0.3 // 70-100% confidence
      });
    }
    
    return landmarks;
  }

  /**
   * Calculate joint angles from pose landmarks
   */
  private calculateJointAngles(landmarks: Landmark[]): JointAngles {
    // In production: actual angle calculation using landmark positions
    return {
      leftKnee: this.calculateKneeAngle(landmarks, 'left'),
      rightKnee: this.calculateKneeAngle(landmarks, 'right'),
      leftHip: this.calculateHipAngle(landmarks, 'left'),
      rightHip: this.calculateHipAngle(landmarks, 'right'),
      leftShoulder: this.calculateShoulderAngle(landmarks, 'left'),
      rightShoulder: this.calculateShoulderAngle(landmarks, 'right'),
      leftElbow: this.calculateElbowAngle(landmarks, 'left'),
      rightElbow: this.calculateElbowAngle(landmarks, 'right'),
      spinalAlignment: this.calculateSpinalAngle(landmarks)
    };
  }

  // Helper methods for angle calculations (simplified mock implementations)
  private calculateKneeAngle(landmarks: Landmark[], side?: 'left' | 'right'): number {
    // Mock calculation - in production would use actual landmark positions
    return 90 + (Math.random() - 0.5) * 30; // 75-105 degrees
  }

  private calculateHipAngle(landmarks: Landmark[], side?: 'left' | 'right'): number {
    return 120 + (Math.random() - 0.5) * 40; // 100-140 degrees
  }

  private calculateShoulderAngle(landmarks: Landmark[], side?: 'left' | 'right'): number {
    return 160 + (Math.random() - 0.5) * 20; // 150-170 degrees
  }

  private calculateElbowAngle(landmarks: Landmark[], side?: 'left' | 'right'): number {
    return 180 + (Math.random() - 0.5) * 40; // 160-200 degrees
  }

  private calculateSpinalAngle(landmarks: Landmark[]): number {
    return 5 + (Math.random() - 0.5) * 10; // -5 to 15 degrees from vertical
  }

  private calculateAnkleAngle(landmarks: Landmark[]): number {
    return 90 + (Math.random() - 0.5) * 20; // 80-100 degrees
  }

  /**
   * Utility methods
   */
  private async checkMLKitAvailability(): Promise<boolean> {
    // In production: check if ML Kit is available on device
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  private async validateVideoFile(videoUri: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      
      if (!fileInfo.exists) {
        return { valid: false, error: 'Video file does not exist' };
      }

      if (fileInfo.size && fileInfo.size > this.performanceConfig.maxFileSize) {
        return { valid: false, error: 'Video file too large' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: `File validation failed: ${error.message}` };
    }
  }

  private async getVideoDuration(videoUri: string): Promise<number> {
    // In production: get actual video duration
    // Mock: return random duration between 5-30 seconds
    return 5000 + Math.random() * 25000;
  }

  private generateCacheKey(videoUri: string, exerciseType: string): string {
    const hash = Buffer.from(`${videoUri}:${exerciseType}`).toString('base64');
    return hash.substring(0, 16);
  }

  private calculateConfidenceMetrics(poseSequence: PoseSequence, totalFrames: number): ConfidenceMetrics {
    const confidenceScores = poseSequence.flatMap(pose => 
      pose.landmarks.map(landmark => landmark.inFrameLikelihood)
    );

    return {
      averageLandmarkConfidence: confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length,
      framesCoverage: poseSequence.length / totalFrames,
      analysisReliability: 0.8 + Math.random() * 0.2, // Mock
      qualityIndicators: {
        lighting: 'good',
        visibility: 'clear',
        stability: 'stable'
      }
    };
  }

  private createEmptyConfidenceMetrics(): ConfidenceMetrics {
    return {
      averageLandmarkConfidence: 0,
      framesCoverage: 0,
      analysisReliability: 0,
      qualityIndicators: {
        lighting: 'poor',
        visibility: 'occluded', 
        stability: 'very_shaky'
      }
    };
  }

  private generateWarnings(confidenceMetrics: ConfidenceMetrics, analysis: FormAnalysis): string[] {
    const warnings: string[] = [];
    
    if (confidenceMetrics.averageLandmarkConfidence < 0.8) {
      warnings.push('Low pose detection confidence - results may be less accurate');
    }
    
    if (confidenceMetrics.framesCoverage < 0.9) {
      warnings.push('Some frames could not be analyzed - consider better lighting or camera angle');
    }
    
    return warnings;
  }

  private async saveToHistory(videoUri: string, exerciseType: string, result: AnalysisResult, videoMetadata?: any): Promise<void> {
    try {
      // Save to local AsyncStorage history (legacy support)
      const historyKey = ANALYSIS_HISTORY_KEY;
      const existingHistory = await AsyncStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      
      const historyEntry = {
        id: Date.now().toString(),
        videoUri,
        exerciseType,
        result,
        timestamp: new Date().toISOString()
      };
      
      history.push(historyEntry);
      
      // Keep only last 50 analyses in local storage
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }
      
      await AsyncStorage.setItem(historyKey, JSON.stringify(history));

      // Save to new progress tracking system
      try {
        // Dynamic import to avoid circular dependencies
        const { default: poseProgressService } = await import('../poseProgressService');
        
        // Prepare analysis data for progress tracking
        const analysisData = {
          id: historyEntry.id,
          exerciseType: exerciseType,
          analysis: result.analysis,
          confidenceMetrics: result.confidenceMetrics,
          processingTime: result.processingTime,
          framesProcessed: result.framesProcessed,
          warnings: result.warnings,
          errors: result.errors
        };

        // Record the session in progress tracking
        await poseProgressService.recordAnalysisSession(analysisData, {
          uri: videoUri,
          ...videoMetadata
        });
        
        console.log('✅ Analysis session recorded in progress tracking system');
      } catch (progressError) {
        console.warn('⚠️ Failed to record in progress tracking system:', progressError);
        // Don't throw - allow analysis to complete even if progress tracking fails
      }
    } catch (error) {
      console.error('Failed to save analysis to history:', error);
    }
  }

  // Mock analysis methods - in production these would contain actual analysis algorithms
  private detectSquatPhases(poseSequence: PoseSequence): MovementPhase[] {
    // Mock phase detection
    return [
      { type: 'descent', startFrame: 0, endFrame: 15, duration: 1500 },
      { type: 'bottom', startFrame: 15, endFrame: 20, duration: 500 },
      { type: 'ascent', startFrame: 20, endFrame: 35, duration: 1500 }
    ];
  }

  private analyzeSquatDepth(poseSequence: PoseSequence, phases: MovementPhase[]): any {
    return {
      maxDepth: 85, // degrees
      reachedParallel: true,
      belowParallel: true,
      depthScore: 85,
      consistency: 0.9
    };
  }

  private analyzeKneeAlignment(poseSequence: PoseSequence): any {
    return {
      kneeTrackingScore: 80,
      valgusCollapse: false,
      maxInwardDeviation: 8,
      consistencyScore: 0.85
    };
  }

  private analyzeSpinalAlignment(poseSequence: PoseSequence): any {
    return {
      neutralSpine: true,
      forwardLean: 15,
      lateralDeviation: 2,
      alignmentScore: 90
    };
  }

  private analyzeBalance(poseSequence: PoseSequence): any {
    return {
      weightDistribution: 'centered',
      stabilityScore: 85,
      sway: 5
    };
  }

  private trackMovementPattern(poseSequence: PoseSequence): MovementPattern {
    return {
      phases: this.detectSquatPhases(poseSequence),
      tempo: {
        descendDuration: 1500,
        ascentDuration: 1500,
        totalDuration: 3500
      },
      consistency: 0.85,
      smoothness: 0.9
    };
  }

  private calculateMovementTiming(phases: MovementPhase[]): any {
    return {
      totalDuration: 3500,
      phaseTimings: {
        descent: 1500,
        bottom: 500,
        ascent: 1500
      },
      tempoScore: 85,
      rhythmConsistency: 0.85
    };
  }

  private identifySquatFormErrors(
    poseSequence: PoseSequence,
    depth: any,
    kneeAlignment: any,
    spinalAlignment: any,
    phases: MovementPhase[]
  ): FormError[] {
    const errors: FormError[] = [];
    
    if (!depth.reachedParallel) {
      errors.push({
        type: 'shallow_depth',
        severity: 'medium',
        timeRange: [phases[1].startFrame * 33, phases[1].endFrame! * 33],
        description: 'Squat depth insufficient - hip crease did not reach below knee level',
        correction: 'Focus on sitting back and down, engage glutes to reach proper depth',
        affectedLandmarks: [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP]
      });
    }
    
    return errors;
  }

  private generateSquatImprovements(
    depth: any,
    kneeAlignment: any,
    spinalAlignment: any,
    balance: any,
    timing: any
  ): FormSuggestion[] {
    const improvements: FormSuggestion[] = [];
    
    if (depth.depthScore < 90) {
      improvements.push({
        category: 'depth',
        priority: 'high',
        suggestion: 'Work on ankle and hip mobility to achieve greater squat depth',
        expectedImprovement: 'Better muscle activation and improved strength development'
      });
    }
    
    return improvements;
  }

  private calculateSquatScore(
    depth: any,
    kneeAlignment: any,
    spinalAlignment: any,
    balance: any,
    timing: any,
    errors: FormError[]
  ): number {
    const weights = SCORING_WEIGHTS.SQUAT;
    let score = 0;
    
    score += depth.depthScore * weights.DEPTH;
    score += kneeAlignment.kneeTrackingScore * weights.KNEE_ALIGNMENT;
    score += spinalAlignment.alignmentScore * weights.SPINAL_ALIGNMENT;
    score += balance.stabilityScore * weights.BALANCE;
    score += timing.tempoScore * weights.TEMPO;
    score += (balance.stabilityScore * 0.85) * weights.CONSISTENCY; // Mock consistency score
    
    // Deduct points for critical errors
    const errorPenalty = errors.reduce((penalty, error) => {
      switch (error.severity) {
        case 'high': return penalty - 15;
        case 'medium': return penalty - 10;
        case 'low': return penalty - 5;
        default: return penalty;
      }
    }, 0);
    
    return Math.max(0, Math.min(100, Math.round(score + errorPenalty)));
  }

  // Placeholder methods for other exercises (to be implemented)
  private async analyzeDeadlift(poseSequence: PoseSequence): Promise<FormAnalysis> {
    throw new Error('Deadlift analysis not yet implemented');
  }

  private async analyzePushUp(poseSequence: PoseSequence): Promise<FormAnalysis> {
    throw new Error('Push-up analysis not yet implemented');
  }

  private async analyzeBenchPress(poseSequence: PoseSequence): Promise<FormAnalysis> {
    throw new Error('Bench press analysis not yet implemented');
  }

  private async analyzeOverheadPress(poseSequence: PoseSequence): Promise<FormAnalysis> {
    throw new Error('Overhead press analysis not yet implemented');
  }

  private async analyzeBaseballPitch(poseSequence: PoseSequence): Promise<FormAnalysis> {
    throw new Error('Baseball pitch analysis not yet implemented');
  }

  private async analyzeTennisServe(poseSequence: PoseSequence): Promise<FormAnalysis> {
    throw new Error('Tennis serve analysis not yet implemented');
  }

  private async analyzeGolfSwing(poseSequence: PoseSequence): Promise<FormAnalysis> {
    throw new Error('Golf swing analysis not yet implemented');
  }

  private async analyzeBasketballShot(poseSequence: PoseSequence): Promise<FormAnalysis> {
    throw new Error('Basketball shot analysis not yet implemented');
  }

  /**
   * Public utility methods
   */

  /**
   * Get analysis history for a user
   */
  async getAnalysisHistory(limit: number = 20): Promise<any[]> {
    try {
      const historyKey = ANALYSIS_HISTORY_KEY;
      const history = await AsyncStorage.getItem(historyKey);
      const analyses = history ? JSON.parse(history) : [];
      return analyses.slice(-limit).reverse(); // Most recent first
    } catch (error) {
      console.error('Failed to get analysis history:', error);
      return [];
    }
  }

  /**
   * Clear analysis cache
   */
  async clearCache(): Promise<void> {
    try {
      this.analysisCache.clear();
      await AsyncStorage.removeItem(POSE_ANALYSIS_CACHE_KEY);
      console.log('Analysis cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Update service configuration
   */
  async updateConfig(newConfig: Partial<PoseDetectionConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...newConfig };
      await AsyncStorage.setItem(POSE_SETTINGS_KEY, JSON.stringify(this.config));
      console.log('Pose analysis config updated:', newConfig);
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    initialized: boolean;
    config: PoseDetectionConfig;
    cacheSize: number;
    processingQueueSize: number;
  } {
    return {
      initialized: this.isInitialized,
      config: this.config,
      cacheSize: this.analysisCache.size,
      processingQueueSize: this.processingQueue.size
    };
  }

  /**
   * Validate video file with subscription tier limits
   */
  private async validateVideoWithSubscription(videoUri: string, subscription: any): Promise<{
    valid: boolean;
    error?: string;
    details?: any;
    fileSize?: number;
    duration?: number;
  }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      
      if (!fileInfo.exists) {
        return { valid: false, error: 'Video file does not exist' };
      }

      const fileSize = fileInfo.size || 0;
      const duration = await this.getVideoDuration(videoUri).catch(() => 0);
      
      // Get subscription limits
      const limits = subscription?.limits || subscription?.tierConfig?.limits;
      if (!limits) {
        return { valid: false, error: 'Unable to determine subscription limits' };
      }

      // Check file size limit
      if (fileSize > limits.maxVideoSize) {
        const maxSizeMB = Math.round(limits.maxVideoSize / (1024 * 1024));
        const actualSizeMB = Math.round(fileSize / (1024 * 1024));
        return {
          valid: false,
          error: `Video file too large. Maximum ${maxSizeMB}MB allowed for your plan, but file is ${actualSizeMB}MB.`,
          details: {
            maxSize: limits.maxVideoSize,
            actualSize: fileSize,
            subscriptionTier: subscription.poseAnalysisTier
          }
        };
      }

      // Check duration limit
      if (duration > limits.maxVideoDuration * 1000) { // Convert seconds to milliseconds
        const maxDurationMin = Math.round(limits.maxVideoDuration / 60);
        const actualDurationMin = Math.round(duration / 60000);
        return {
          valid: false,
          error: `Video too long. Maximum ${maxDurationMin} minutes allowed for your plan, but video is ${actualDurationMin} minutes.`,
          details: {
            maxDuration: limits.maxVideoDuration * 1000,
            actualDuration: duration,
            subscriptionTier: subscription.poseAnalysisTier
          }
        };
      }

      return { 
        valid: true, 
        fileSize,
        duration 
      };
    } catch (error) {
      return { 
        valid: false, 
        error: `File validation failed: ${error.message}`,
        details: { error: error.toString() }
      };
    }
  }

  /**
   * Get current subscription status for analysis
   */
  async getSubscriptionStatus(): Promise<any> {
    try {
      return await poseSubscriptionService.getSubscriptionStatus();
    } catch (error) {
      console.error('Error getting subscription status:', error);
      // Return free tier as fallback
      return {
        poseAnalysisTier: 'free',
        tierConfig: { limits: { maxVideoSize: 50 * 1024 * 1024, maxVideoDuration: 60 } },
        isActive: true
      };
    }
  }

  /**
   * Check if analysis can be performed (quota and limits)
   */
  async canPerformAnalysis(): Promise<{
    canAnalyze: boolean;
    reason?: string;
    message?: string;
    quotaInfo?: any;
  }> {
    try {
      return await usageTrackingService.checkAnalysisPermission();
    } catch (error) {
      console.error('Error checking analysis permission:', error);
      return {
        canAnalyze: false,
        reason: 'error',
        message: 'Unable to check analysis permission'
      };
    }
  }

  /**
   * Get usage status for current user
   */
  async getUsageStatus(): Promise<any> {
    try {
      return await usageTrackingService.getUsageStatus();
    } catch (error) {
      console.error('Error getting usage status:', error);
      return {
        subscription: { tier: 'free', isActive: false },
        quotas: { monthly: { limit: 0, used: 0, remaining: 0 } },
        billingPeriod: { daysRemaining: 0 }
      };
    }
  }

  /**
   * Generate form context for AI coaching
   */
  async generateFormContextForCoaching(
    analysisResult: AnalysisResult,
    exerciseType: ExerciseType | SportType,
    options?: {
      contextType?: 'minimal' | 'focused' | 'comprehensive';
      includeHistory?: boolean;
      targetTokens?: number;
    }
  ): Promise<any> {
    try {
      const { default: formContextService } = await import('../../formContextService');
      await formContextService.initialize();
      
      const context = await formContextService.buildAICoachingContext(
        analysisResult,
        exerciseType,
        {
          contextType: options?.contextType || 'comprehensive',
          includeHistory: options?.includeHistory !== false,
          targetTokens: options?.targetTokens || 2000
        }
      );
      
      return context;
    } catch (error) {
      console.error('Failed to generate form context:', error);
      throw error;
    }
  }

  /**
   * Get form competency level for user
   */
  async getFormCompetency(exerciseType: ExerciseType | SportType): Promise<any> {
    try {
      const { default: formContextService } = await import('../../formContextService');
      await formContextService.initialize();
      
      return await formContextService.getFormCompetency(exerciseType);
    } catch (error) {
      console.error('Failed to get form competency:', error);
      return {
        level: 'beginner',
        score: 0,
        confidence: 0,
        sessionCount: 0,
        strengths: [],
        weaknesses: [],
        trend: 'stable'
      };
    }
  }

  /**
   * Generate AI coaching prompt with analysis context
   */
  async generateAICoachingPrompt(
    analysisResult: AnalysisResult,
    exerciseType: ExerciseType | SportType,
    customPrompt?: string
  ): Promise<any> {
    try {
      const { default: formContextService } = await import('../../formContextService');
      await formContextService.initialize();
      
      return await formContextService.generateCoachingPrompt(
        analysisResult,
        exerciseType,
        {
          includeHistory: true,
          customPrompt,
          contextType: 'comprehensive'
        }
      );
    } catch (error) {
      console.error('Failed to generate AI coaching prompt:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.analysisCache.clear();
    this.processingQueue.clear();
    this.isInitialized = false;
    console.log('PoseAnalysisService destroyed');
  }
}

// Export singleton instance
const poseAnalysisService = new PoseAnalysisService();
export default poseAnalysisService;

// Export class for custom instances
export { PoseAnalysisService };