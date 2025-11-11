/**
 * Frame Optimizer Service
 * Smart frame sampling and optimization for efficient pose analysis
 *
 * Features:
 * - Adaptive frame sampling based on motion detection
 * - Key frame identification
 * - Frame quality assessment
 * - Motion-based frame prioritization
 * - Dynamic sampling rate adjustment
 * - Frame caching and recycling
 */

import { Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Video } from 'expo-av';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Frame optimization constants
const FRAME_CACHE_KEY = '@frame_cache';
const OPTIMIZATION_SETTINGS_KEY = '@frame_optimization_settings';

// Default optimization settings
const DEFAULT_SETTINGS = {
  minFrameRate: 5,     // Minimum 5 fps
  maxFrameRate: 15,    // Maximum 15 fps
  targetFrameRate: 10, // Target 10 fps
  motionThreshold: 0.1, // 10% change to detect motion
  qualityThreshold: 0.6, // Minimum quality score
  keyFrameInterval: 10, // Force key frame every 10 frames
  adaptiveSampling: true,
  cacheEnabled: true,
  maxCacheSize: 50 * 1024 * 1024, // 50MB cache
  resolutionScale: 0.5, // Scale down to 50% for analysis
  compressionQuality: 0.8
};

// Motion detection regions (for focused analysis)
const MOTION_REGIONS = {
  FULL_BODY: { x: 0, y: 0, width: 1, height: 1 },
  UPPER_BODY: { x: 0.2, y: 0, width: 0.6, height: 0.5 },
  LOWER_BODY: { x: 0.2, y: 0.5, width: 0.6, height: 0.5 },
  CENTER: { x: 0.3, y: 0.3, width: 0.4, height: 0.4 }
};

class FrameOptimizer {
  constructor() {
    this.settings = DEFAULT_SETTINGS;
    this.frameCache = new Map();
    this.frameMetadata = new Map();
    this.cacheSize = 0;
    this.lastFrame = null;
    this.motionHistory = [];
    this.currentSamplingRate = DEFAULT_SETTINGS.targetFrameRate;
    this.isInitialized = false;
  }

  /**
   * Initialize frame optimizer
   */
  async initialize(customSettings = {}) {
    try {
      // Load saved settings
      const savedSettings = await AsyncStorage.getItem(OPTIMIZATION_SETTINGS_KEY);
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings), ...customSettings };
      } else {
        this.settings = { ...this.settings, ...customSettings };
      }

      // Clear old cache
      await this.clearCache();

      this.isInitialized = true;
      console.log('FrameOptimizer: Initialized', this.settings);

      return { success: true, settings: this.settings };
    } catch (error) {
      console.error('FrameOptimizer: Initialization failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract and optimize frames from video
   */
  async extractOptimizedFrames(videoUri, options = {}) {
    try {
      const {
        duration = 60,
        exerciseType = 'general',
        deviceTier = 'medium',
        onProgress = () => {}
      } = options;

      console.log('FrameOptimizer: Starting frame extraction', {
        videoUri,
        duration,
        exerciseType,
        deviceTier
      });

      // Adjust settings based on device tier
      this.adjustSettingsForDevice(deviceTier);

      // Get video metadata
      const videoInfo = await this.getVideoMetadata(videoUri);

      // Calculate optimal frame extraction strategy
      const strategy = this.calculateExtractionStrategy(videoInfo, exerciseType);

      // Extract frames using optimized strategy
      const frames = await this.extractFramesWithStrategy(videoUri, strategy, onProgress);

      // Post-process frames for quality and relevance
      const optimizedFrames = await this.postProcessFrames(frames, exerciseType);

      console.log('FrameOptimizer: Frame extraction complete', {
        totalFrames: optimizedFrames.length,
        strategy
      });

      return {
        success: true,
        frames: optimizedFrames,
        metadata: {
          originalFrameCount: videoInfo.frameCount,
          extractedFrameCount: frames.length,
          optimizedFrameCount: optimizedFrames.length,
          samplingRate: strategy.samplingRate,
          compressionRatio: optimizedFrames.length / videoInfo.frameCount
        }
      };
    } catch (error) {
      console.error('FrameOptimizer: Frame extraction failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get video metadata
   */
  async getVideoMetadata(videoUri) {
    try {
      // Get video file info
      const fileInfo = await FileSystem.getInfoAsync(videoUri);

      // Load video to get duration
      const { duration, width, height } = await new Promise((resolve, reject) => {
        Video.getStatusAsync(videoUri)
          .then(status => resolve(status))
          .catch(reject);
      });

      const fps = 30; // Assume 30fps if not available
      const frameCount = Math.floor((duration / 1000) * fps);

      return {
        duration: duration / 1000, // Convert to seconds
        width,
        height,
        fps,
        frameCount,
        fileSize: fileInfo.size
      };
    } catch (error) {
      console.error('FrameOptimizer: Failed to get video metadata', error);
      // Return defaults
      return {
        duration: 60,
        width: 1920,
        height: 1080,
        fps: 30,
        frameCount: 1800,
        fileSize: 100 * 1024 * 1024
      };
    }
  }

  /**
   * Calculate optimal frame extraction strategy
   */
  calculateExtractionStrategy(videoInfo, exerciseType) {
    const { duration, frameCount, fps } = videoInfo;

    // Base sampling rate on exercise type and duration
    let targetFrames = this.getTargetFrameCount(duration, exerciseType);
    let samplingInterval = Math.max(1, Math.floor(frameCount / targetFrames));
    let samplingRate = fps / samplingInterval;

    // Ensure sampling rate is within bounds
    samplingRate = Math.max(this.settings.minFrameRate,
                           Math.min(this.settings.maxFrameRate, samplingRate));

    // Calculate key frame positions for exercise phases
    const keyFramePositions = this.calculateKeyFramePositions(duration, exerciseType);

    return {
      samplingRate,
      samplingInterval,
      targetFrames,
      keyFramePositions,
      adaptiveSampling: this.settings.adaptiveSampling,
      priorityRegions: this.getPriorityRegions(exerciseType)
    };
  }

  /**
   * Get target frame count based on exercise and duration
   */
  getTargetFrameCount(duration, exerciseType) {
    // Base calculation: 10 fps for standard analysis
    let baseFrames = duration * this.settings.targetFrameRate;

    // Adjust for exercise type
    switch (exerciseType) {
      case 'squat':
      case 'deadlift':
        // Slower movements, fewer frames needed
        return Math.floor(baseFrames * 0.7);
      case 'push_up':
      case 'jumping_jack':
        // Faster movements, more frames needed
        return Math.floor(baseFrames * 1.3);
      default:
        return Math.floor(baseFrames);
    }
  }

  /**
   * Calculate key frame positions for important movement phases
   */
  calculateKeyFramePositions(duration, exerciseType) {
    const positions = [];

    // Add start and end
    positions.push(0, duration - 0.1);

    // Add exercise-specific key positions
    switch (exerciseType) {
      case 'squat':
        // Key positions: standing, parallel, bottom, standing
        const repDuration = 3; // Assume 3 seconds per rep
        const reps = Math.floor(duration / repDuration);
        for (let i = 0; i < reps; i++) {
          const repStart = i * repDuration;
          positions.push(
            repStart + 0.5,      // Start descent
            repStart + 1.5,      // Bottom position
            repStart + 2.5       // Back to top
          );
        }
        break;
      case 'push_up':
        // Key positions: up, down, up
        const pushupDuration = 2; // Assume 2 seconds per rep
        const pushupReps = Math.floor(duration / pushupDuration);
        for (let i = 0; i < pushupReps; i++) {
          const repStart = i * pushupDuration;
          positions.push(
            repStart + 0.3,      // Start descent
            repStart + 1,        // Bottom position
            repStart + 1.7       // Back to top
          );
        }
        break;
      default:
        // Add evenly spaced key frames
        const interval = duration / (this.settings.keyFrameInterval + 1);
        for (let i = 1; i <= this.settings.keyFrameInterval; i++) {
          positions.push(i * interval);
        }
    }

    return positions.sort((a, b) => a - b);
  }

  /**
   * Get priority regions for motion detection based on exercise
   */
  getPriorityRegions(exerciseType) {
    switch (exerciseType) {
      case 'squat':
      case 'deadlift':
        return [MOTION_REGIONS.LOWER_BODY, MOTION_REGIONS.CENTER];
      case 'push_up':
      case 'bench_press':
        return [MOTION_REGIONS.UPPER_BODY, MOTION_REGIONS.CENTER];
      default:
        return [MOTION_REGIONS.FULL_BODY];
    }
  }

  /**
   * Extract frames using optimized strategy
   */
  async extractFramesWithStrategy(videoUri, strategy, onProgress) {
    const frames = [];
    const { samplingInterval, keyFramePositions, adaptiveSampling } = strategy;

    let frameIndex = 0;
    let lastMotionScore = 0;
    let extractedCount = 0;

    // Mock frame extraction (in production, use native module)
    const totalFrames = strategy.targetFrames;

    for (let i = 0; i < totalFrames; i++) {
      const timestamp = (i / totalFrames) * 60; // Assuming 60 second video

      // Check if this is a key frame position
      const isKeyFrame = keyFramePositions.some(pos => Math.abs(pos - timestamp) < 0.1);

      // Calculate motion score if adaptive sampling is enabled
      let shouldExtract = isKeyFrame;

      if (adaptiveSampling && !isKeyFrame) {
        const motionScore = await this.calculateMotionScore(null, this.lastFrame);

        // Adjust sampling based on motion
        if (motionScore > this.settings.motionThreshold) {
          shouldExtract = true;
        } else if (motionScore < this.settings.motionThreshold * 0.5) {
          // Skip more frames if very little motion
          shouldExtract = i % (samplingInterval * 2) === 0;
        } else {
          shouldExtract = i % samplingInterval === 0;
        }

        lastMotionScore = motionScore;
      } else if (!isKeyFrame) {
        shouldExtract = i % samplingInterval === 0;
      }

      if (shouldExtract) {
        const frame = await this.extractSingleFrame(videoUri, timestamp, i);

        if (frame) {
          // Optimize frame resolution and quality
          const optimizedFrame = await this.optimizeFrame(frame);

          frames.push({
            ...optimizedFrame,
            timestamp,
            frameIndex: i,
            isKeyFrame,
            motionScore: lastMotionScore
          });

          this.lastFrame = optimizedFrame;
          extractedCount++;
        }
      }

      // Update progress
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: totalFrames,
          extractedCount,
          percentage: ((i + 1) / totalFrames) * 100
        });
      }

      frameIndex++;
    }

    return frames;
  }

  /**
   * Extract a single frame from video
   */
  async extractSingleFrame(videoUri, timestamp, frameIndex) {
    try {
      // In production, this would use a native module to extract actual frames
      // For now, return mock frame data
      const frameUri = `${FileSystem.cacheDirectory}frame_${frameIndex}_${timestamp}.jpg`;

      return {
        uri: frameUri,
        timestamp,
        frameIndex,
        width: 1920,
        height: 1080
      };
    } catch (error) {
      console.error('FrameOptimizer: Failed to extract frame', error);
      return null;
    }
  }

  /**
   * Optimize frame resolution and quality
   */
  async optimizeFrame(frame) {
    try {
      if (!frame.uri) return frame;

      // Check if frame is already cached
      const cacheKey = `${frame.frameIndex}_${frame.timestamp}`;
      if (this.frameCache.has(cacheKey)) {
        return this.frameCache.get(cacheKey);
      }

      // Optimize frame using image manipulator
      const optimized = await manipulateAsync(
        frame.uri,
        [
          {
            resize: {
              width: Math.floor(frame.width * this.settings.resolutionScale),
              height: Math.floor(frame.height * this.settings.resolutionScale)
            }
          }
        ],
        {
          compress: this.settings.compressionQuality,
          format: SaveFormat.JPEG
        }
      );

      const optimizedFrame = {
        ...frame,
        uri: optimized.uri,
        width: Math.floor(frame.width * this.settings.resolutionScale),
        height: Math.floor(frame.height * this.settings.resolutionScale),
        optimized: true
      };

      // Cache if enabled
      if (this.settings.cacheEnabled) {
        this.cacheFrame(cacheKey, optimizedFrame);
      }

      return optimizedFrame;
    } catch (error) {
      console.error('FrameOptimizer: Failed to optimize frame', error);
      return frame;
    }
  }

  /**
   * Calculate motion score between frames
   */
  async calculateMotionScore(currentFrame, previousFrame) {
    if (!currentFrame || !previousFrame) {
      return 1; // Assume high motion if we can't compare
    }

    try {
      // In production, this would use image processing to detect motion
      // For now, return a mock motion score
      return Math.random() * 0.3; // Random motion between 0-0.3
    } catch (error) {
      console.error('FrameOptimizer: Failed to calculate motion', error);
      return 0.1;
    }
  }

  /**
   * Post-process frames for quality and relevance
   */
  async postProcessFrames(frames, exerciseType) {
    const processedFrames = [];

    for (const frame of frames) {
      // Calculate frame quality score
      const qualityScore = await this.assessFrameQuality(frame);

      // Skip low quality frames unless they're key frames
      if (qualityScore < this.settings.qualityThreshold && !frame.isKeyFrame) {
        continue;
      }

      // Add quality metadata
      processedFrames.push({
        ...frame,
        qualityScore,
        relevanceScore: this.calculateRelevanceScore(frame, exerciseType)
      });
    }

    // Ensure minimum frame count
    const minFrames = Math.max(15, Math.floor(frames.length * 0.5));
    if (processedFrames.length < minFrames) {
      // Add back some rejected frames with highest quality scores
      const rejectedFrames = frames
        .filter(f => !processedFrames.some(pf => pf.frameIndex === f.frameIndex))
        .sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0))
        .slice(0, minFrames - processedFrames.length);

      processedFrames.push(...rejectedFrames);
    }

    // Sort by timestamp
    processedFrames.sort((a, b) => a.timestamp - b.timestamp);

    return processedFrames;
  }

  /**
   * Assess frame quality
   */
  async assessFrameQuality(frame) {
    // In production, this would analyze:
    // - Blur detection
    // - Exposure levels
    // - Person visibility
    // - Occlusion detection

    // Mock quality score based on frame metadata
    let quality = 1.0;

    // Reduce quality for non-key frames
    if (!frame.isKeyFrame) {
      quality *= 0.9;
    }

    // Reduce quality for low motion frames
    if (frame.motionScore < 0.05) {
      quality *= 0.8;
    }

    return quality;
  }

  /**
   * Calculate frame relevance for specific exercise
   */
  calculateRelevanceScore(frame, exerciseType) {
    // Score based on timestamp position in exercise phases
    let relevance = 0.5; // Base relevance

    // Key frames are always highly relevant
    if (frame.isKeyFrame) {
      relevance = 1.0;
    } else {
      // Calculate based on typical exercise phases
      const normalizedTime = frame.timestamp / 60; // Assume 60 second video

      switch (exerciseType) {
        case 'squat':
          // Higher relevance at bottom position (around 50% of rep)
          if (normalizedTime % 0.05 > 0.02 && normalizedTime % 0.05 < 0.03) {
            relevance = 0.9;
          }
          break;
        case 'push_up':
          // Higher relevance at bottom position
          if (normalizedTime % 0.033 > 0.015 && normalizedTime % 0.033 < 0.02) {
            relevance = 0.9;
          }
          break;
        default:
          // Even relevance distribution
          relevance = 0.7;
      }
    }

    // Boost relevance for high motion frames
    if (frame.motionScore > 0.2) {
      relevance = Math.min(1.0, relevance * 1.2);
    }

    return relevance;
  }

  /**
   * Cache frame data
   */
  cacheFrame(key, frame) {
    // Estimate frame size (rough estimate)
    const frameSize = JSON.stringify(frame).length;

    // Check cache size limit
    if (this.cacheSize + frameSize > this.settings.maxCacheSize) {
      this.evictOldestFrames();
    }

    this.frameCache.set(key, frame);
    this.frameMetadata.set(key, {
      size: frameSize,
      timestamp: Date.now()
    });
    this.cacheSize += frameSize;
  }

  /**
   * Evict oldest frames from cache
   */
  evictOldestFrames() {
    const entries = Array.from(this.frameMetadata.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest 20% of cache
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      const [key, metadata] = entries[i];
      this.frameCache.delete(key);
      this.frameMetadata.delete(key);
      this.cacheSize -= metadata.size;
    }
  }

  /**
   * Clear frame cache
   */
  async clearCache() {
    this.frameCache.clear();
    this.frameMetadata.clear();
    this.cacheSize = 0;

    // Clear file system cache
    try {
      const cacheDir = FileSystem.cacheDirectory;
      const files = await FileSystem.readDirectoryAsync(cacheDir);

      for (const file of files) {
        if (file.startsWith('frame_')) {
          await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
        }
      }
    } catch (error) {
      console.error('FrameOptimizer: Failed to clear file cache', error);
    }
  }

  /**
   * Adjust settings based on device tier
   */
  adjustSettingsForDevice(deviceTier) {
    switch (deviceTier) {
      case 'low':
        this.settings = {
          ...this.settings,
          minFrameRate: 3,
          maxFrameRate: 8,
          targetFrameRate: 5,
          resolutionScale: 0.3,
          compressionQuality: 0.6,
          adaptiveSampling: true
        };
        break;
      case 'high':
        this.settings = {
          ...this.settings,
          minFrameRate: 10,
          maxFrameRate: 30,
          targetFrameRate: 15,
          resolutionScale: 0.7,
          compressionQuality: 0.9,
          adaptiveSampling: true
        };
        break;
      // 'medium' uses default settings
    }
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats() {
    const totalFrames = Array.from(this.frameCache.values()).length;
    const avgMotion = this.motionHistory.length > 0
      ? this.motionHistory.reduce((a, b) => a + b, 0) / this.motionHistory.length
      : 0;

    return {
      cachedFrames: totalFrames,
      cacheSize: this.cacheSize,
      cacheSizeMB: Math.round(this.cacheSize / (1024 * 1024) * 10) / 10,
      averageMotion: avgMotion,
      currentSamplingRate: this.currentSamplingRate,
      settings: this.settings
    };
  }

  /**
   * Save settings
   */
  async saveSettings() {
    try {
      await AsyncStorage.setItem(OPTIMIZATION_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('FrameOptimizer: Failed to save settings', error);
    }
  }
}

// Export singleton instance
export default new FrameOptimizer();