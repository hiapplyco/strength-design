/**
 * Video Processor Service
 * Optimized video processing pipeline for pose analysis
 *
 * Features:
 * - Chunked video processing for memory efficiency
 * - Parallel frame processing with worker threads
 * - Progressive loading and streaming
 * - Frame caching and recycling
 * - Resolution optimization
 * - Format conversion and compression
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Video } from 'expo-av';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import frameOptimizer from './frameOptimizer';
import performanceMonitor from './performanceMonitor';

// Processing constants
const CHUNK_SIZE = 10; // Process 10 frames at a time
const MAX_PARALLEL_PROCESSING = 3; // Maximum parallel processing threads
const FRAME_POOL_SIZE = 30; // Frame object pool size
const PROCESSING_TIMEOUT = 30000; // 30 second timeout per chunk

// Storage keys
const PROCESSING_STATE_KEY = '@video_processing_state';
const PROCESSING_CACHE_KEY = '@video_processing_cache';

// Video processing states
const ProcessingState = {
  IDLE: 'idle',
  LOADING: 'loading',
  PROCESSING: 'processing',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// Resolution presets for different device tiers
const ResolutionPresets = {
  low: { width: 480, height: 270 },    // 480p 16:9
  medium: { width: 640, height: 360 },  // 360p 16:9
  high: { width: 1280, height: 720 }    // 720p 16:9
};

class VideoProcessor {
  constructor() {
    this.state = ProcessingState.IDLE;
    this.currentJob = null;
    this.framePool = [];
    this.processingQueue = [];
    this.activeWorkers = 0;
    this.processedFrames = [];
    this.cancelToken = null;
    this.progress = {
      current: 0,
      total: 0,
      percentage: 0,
      estimatedTimeRemaining: 0
    };
    this.startTime = null;
    this.chunkProcessingTimes = [];
  }

  /**
   * Initialize video processor
   */
  async initialize() {
    try {
      // Initialize frame pool
      this.initializeFramePool();

      // Restore processing state if exists
      await this.restoreProcessingState();

      // Initialize frame optimizer
      await frameOptimizer.initialize();

      console.log('VideoProcessor: Initialized');
      return { success: true };
    } catch (error) {
      console.error('VideoProcessor: Initialization failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize frame object pool for memory efficiency
   */
  initializeFramePool() {
    for (let i = 0; i < FRAME_POOL_SIZE; i++) {
      this.framePool.push({
        id: i,
        uri: null,
        data: null,
        timestamp: null,
        index: null,
        inUse: false
      });
    }
  }

  /**
   * Get frame from pool
   */
  getFrameFromPool() {
    const frame = this.framePool.find(f => !f.inUse);
    if (frame) {
      frame.inUse = true;
      return frame;
    }
    // If no frames available, wait and retry
    return null;
  }

  /**
   * Return frame to pool
   */
  returnFrameToPool(frame) {
    if (frame) {
      frame.uri = null;
      frame.data = null;
      frame.timestamp = null;
      frame.index = null;
      frame.inUse = false;
    }
  }

  /**
   * Process video with optimized pipeline
   */
  async processVideo(videoUri, options = {}) {
    try {
      const {
        exerciseType = 'general',
        deviceTier = 'medium',
        onProgress = () => {},
        onFrame = () => {},
        onComplete = () => {},
        onError = () => {}
      } = options;

      // Check if already processing
      if (this.state === ProcessingState.PROCESSING) {
        throw new Error('Already processing a video');
      }

      this.state = ProcessingState.LOADING;
      this.startTime = Date.now();
      this.cancelToken = { cancelled: false };

      // Start performance monitoring
      performanceMonitor.startSession({ videoUri, exerciseType });

      // Get video metadata
      const videoInfo = await this.getVideoInfo(videoUri);

      // Calculate processing strategy
      const strategy = this.calculateProcessingStrategy(videoInfo, deviceTier);

      // Update progress
      this.progress.total = strategy.totalFrames;
      this.currentJob = {
        videoUri,
        videoInfo,
        strategy,
        exerciseType,
        callbacks: { onProgress, onFrame, onComplete, onError }
      };

      // Save processing state for recovery
      await this.saveProcessingState();

      // Extract optimized frames
      const extractedFrames = await frameOptimizer.extractOptimizedFrames(
        videoUri,
        {
          duration: videoInfo.duration,
          exerciseType,
          deviceTier,
          onProgress: (extractProgress) => {
            this.updateProgress(extractProgress.extractedCount, extractProgress.total);
            onProgress(this.progress);
          }
        }
      );

      if (!extractedFrames.success) {
        throw new Error(extractedFrames.error || 'Frame extraction failed');
      }

      this.state = ProcessingState.PROCESSING;

      // Start performance tracking for processing
      performanceMonitor.startProcessing(extractedFrames.frames.length);

      // Process frames in chunks
      const processedFrames = await this.processFramesInChunks(
        extractedFrames.frames,
        strategy,
        { onFrame, onProgress }
      );

      // Check if cancelled
      if (this.cancelToken.cancelled) {
        this.state = ProcessingState.CANCELLED;
        throw new Error('Processing cancelled');
      }

      this.state = ProcessingState.COMPLETED;

      // End performance monitoring
      const performanceMetrics = await performanceMonitor.endProcessing(true);

      // Generate processing report
      const report = {
        success: true,
        frames: processedFrames,
        metadata: {
          ...extractedFrames.metadata,
          processingTime: Date.now() - this.startTime,
          averageChunkTime: this.calculateAverageChunkTime(),
          performanceMetrics
        }
      };

      // Clear processing state
      await this.clearProcessingState();

      // Callback
      onComplete(report);

      console.log('VideoProcessor: Processing completed', report.metadata);

      return report;

    } catch (error) {
      this.state = ProcessingState.FAILED;

      // End performance monitoring with failure
      await performanceMonitor.endProcessing(false);

      // Clear processing state
      await this.clearProcessingState();

      console.error('VideoProcessor: Processing failed', error);

      // Error callback
      if (options.onError) {
        options.onError(error);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get video information
   */
  async getVideoInfo(videoUri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(videoUri);

      // Get video metadata using expo-av
      const video = await Video.createAsync(
        { uri: videoUri },
        { shouldPlay: false }
      );

      const status = await video.getStatusAsync();

      // Calculate frame count (estimate based on 30fps)
      const duration = status.durationMillis / 1000;
      const fps = 30;
      const frameCount = Math.floor(duration * fps);

      // Unload video
      await video.unloadAsync();

      return {
        uri: videoUri,
        duration,
        width: status.naturalSize?.width || 1920,
        height: status.naturalSize?.height || 1080,
        fps,
        frameCount,
        fileSize: fileInfo.size,
        orientation: status.naturalSize?.orientation || 0
      };
    } catch (error) {
      console.error('VideoProcessor: Failed to get video info', error);
      // Return default values
      return {
        uri: videoUri,
        duration: 60,
        width: 1920,
        height: 1080,
        fps: 30,
        frameCount: 1800,
        fileSize: 0,
        orientation: 0
      };
    }
  }

  /**
   * Calculate processing strategy based on video and device
   */
  calculateProcessingStrategy(videoInfo, deviceTier) {
    const resolution = ResolutionPresets[deviceTier] || ResolutionPresets.medium;

    // Calculate scale factor
    const scaleX = resolution.width / videoInfo.width;
    const scaleY = resolution.height / videoInfo.height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't upscale

    // Adjust chunk size based on device tier
    let chunkSize = CHUNK_SIZE;
    let parallelWorkers = MAX_PARALLEL_PROCESSING;

    switch (deviceTier) {
      case 'low':
        chunkSize = 5;
        parallelWorkers = 1;
        break;
      case 'high':
        chunkSize = 20;
        parallelWorkers = 5;
        break;
    }

    // Calculate total frames to process (after optimization)
    const samplingRate = deviceTier === 'low' ? 5 : (deviceTier === 'high' ? 15 : 10);
    const totalFrames = Math.floor(videoInfo.duration * samplingRate);

    return {
      resolution: {
        width: Math.floor(videoInfo.width * scale),
        height: Math.floor(videoInfo.height * scale)
      },
      scale,
      chunkSize,
      parallelWorkers,
      totalFrames,
      compressionQuality: deviceTier === 'low' ? 0.6 : (deviceTier === 'high' ? 0.9 : 0.8),
      timeout: PROCESSING_TIMEOUT
    };
  }

  /**
   * Process frames in chunks for memory efficiency
   */
  async processFramesInChunks(frames, strategy, callbacks) {
    const { chunkSize, parallelWorkers } = strategy;
    const processedFrames = [];
    const totalChunks = Math.ceil(frames.length / chunkSize);

    console.log(`VideoProcessor: Processing ${frames.length} frames in ${totalChunks} chunks`);

    for (let i = 0; i < frames.length; i += chunkSize) {
      // Check if cancelled
      if (this.cancelToken?.cancelled) {
        break;
      }

      const chunkIndex = Math.floor(i / chunkSize);
      const chunk = frames.slice(i, Math.min(i + chunkSize, frames.length));

      const chunkStartTime = Date.now();

      // Process chunk with parallel workers
      const processedChunk = await this.processChunkParallel(
        chunk,
        strategy,
        chunkIndex,
        totalChunks,
        callbacks
      );

      const chunkTime = Date.now() - chunkStartTime;
      this.chunkProcessingTimes.push(chunkTime);

      processedFrames.push(...processedChunk);

      // Update progress
      this.updateProgress(processedFrames.length, frames.length);
      if (callbacks.onProgress) {
        callbacks.onProgress(this.progress);
      }

      // Memory cleanup after each chunk
      await this.cleanupMemory();

      // Add small delay between chunks to prevent overheating
      if (chunkIndex < totalChunks - 1) {
        await this.delay(100);
      }
    }

    return processedFrames;
  }

  /**
   * Process chunk with parallel workers
   */
  async processChunkParallel(chunk, strategy, chunkIndex, totalChunks, callbacks) {
    const { parallelWorkers, resolution, compressionQuality, timeout } = strategy;

    console.log(`VideoProcessor: Processing chunk ${chunkIndex + 1}/${totalChunks}`);

    const processedFrames = [];
    const processingPromises = [];

    // Limit parallel processing
    const batchSize = Math.min(parallelWorkers, chunk.length);

    for (let i = 0; i < chunk.length; i += batchSize) {
      const batch = chunk.slice(i, Math.min(i + batchSize, chunk.length));

      const batchPromises = batch.map(async (frame) => {
        try {
          // Get frame from pool
          let pooledFrame = this.getFrameFromPool();
          if (!pooledFrame) {
            // If no pooled frame available, process directly
            pooledFrame = { ...frame };
          }

          // Process individual frame
          const processed = await this.processFrame(
            frame,
            resolution,
            compressionQuality
          );

          // Track performance
          performanceMonitor.recordFrameProcessing(
            frame.frameIndex,
            Date.now() - frame.processingStart,
            true
          );

          // Return frame to pool
          this.returnFrameToPool(pooledFrame);

          // Callback for each processed frame
          if (callbacks.onFrame) {
            callbacks.onFrame(processed);
          }

          return processed;
        } catch (error) {
          console.error(`VideoProcessor: Failed to process frame ${frame.frameIndex}`, error);

          // Track failed frame
          performanceMonitor.recordFrameProcessing(
            frame.frameIndex,
            Date.now() - frame.processingStart,
            false
          );

          return null;
        }
      });

      // Add timeout to batch processing
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Chunk processing timeout')), timeout)
      );

      try {
        const batchResults = await Promise.race([
          Promise.all(batchPromises),
          timeoutPromise
        ]);

        processedFrames.push(...batchResults.filter(f => f !== null));
      } catch (error) {
        console.error(`VideoProcessor: Chunk ${chunkIndex} batch failed`, error);
      }
    }

    return processedFrames;
  }

  /**
   * Process individual frame
   */
  async processFrame(frame, resolution, compressionQuality) {
    const processingStart = Date.now();

    try {
      // Skip if frame doesn't have URI
      if (!frame.uri) {
        return {
          ...frame,
          processed: false,
          processingTime: 0
        };
      }

      // Optimize frame resolution and quality
      const optimized = await manipulateAsync(
        frame.uri,
        [
          {
            resize: {
              width: resolution.width,
              height: resolution.height
            }
          }
        ],
        {
          compress: compressionQuality,
          format: SaveFormat.JPEG
        }
      );

      // Clean up original frame file
      if (frame.uri !== optimized.uri) {
        await FileSystem.deleteAsync(frame.uri, { idempotent: true });
      }

      const processingTime = Date.now() - processingStart;

      return {
        ...frame,
        uri: optimized.uri,
        width: resolution.width,
        height: resolution.height,
        processed: true,
        processingTime,
        compressionQuality
      };
    } catch (error) {
      console.error('VideoProcessor: Frame processing failed', error);
      return {
        ...frame,
        processed: false,
        processingTime: Date.now() - processingStart,
        error: error.message
      };
    }
  }

  /**
   * Update processing progress
   */
  updateProgress(current, total) {
    this.progress.current = current;
    this.progress.total = total;
    this.progress.percentage = Math.round((current / total) * 100);

    // Calculate estimated time remaining
    if (this.startTime && current > 0) {
      const elapsedTime = Date.now() - this.startTime;
      const avgTimePerFrame = elapsedTime / current;
      const remainingFrames = total - current;
      this.progress.estimatedTimeRemaining = Math.round(avgTimePerFrame * remainingFrames);
    }
  }

  /**
   * Calculate average chunk processing time
   */
  calculateAverageChunkTime() {
    if (this.chunkProcessingTimes.length === 0) return 0;

    const total = this.chunkProcessingTimes.reduce((sum, time) => sum + time, 0);
    return Math.round(total / this.chunkProcessingTimes.length);
  }

  /**
   * Clean up memory after chunk processing
   */
  async cleanupMemory() {
    // Clear processed frames from memory
    this.processedFrames = [];

    // Reset frame pool
    this.framePool.forEach(frame => {
      this.returnFrameToPool(frame);
    });

    // Trigger garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Pause video processing
   */
  pauseProcessing() {
    if (this.state === ProcessingState.PROCESSING) {
      this.state = ProcessingState.PAUSED;
      console.log('VideoProcessor: Processing paused');
      return true;
    }
    return false;
  }

  /**
   * Resume video processing
   */
  resumeProcessing() {
    if (this.state === ProcessingState.PAUSED) {
      this.state = ProcessingState.PROCESSING;
      console.log('VideoProcessor: Processing resumed');
      return true;
    }
    return false;
  }

  /**
   * Cancel video processing
   */
  cancelProcessing() {
    if (this.cancelToken) {
      this.cancelToken.cancelled = true;
    }
    this.state = ProcessingState.CANCELLED;
    console.log('VideoProcessor: Processing cancelled');

    // Clean up
    this.cleanupMemory();
    this.clearProcessingState();

    return true;
  }

  /**
   * Save processing state for recovery
   */
  async saveProcessingState() {
    try {
      const state = {
        currentJob: this.currentJob,
        progress: this.progress,
        processedFrames: this.processedFrames.length,
        timestamp: Date.now()
      };

      await AsyncStorage.setItem(PROCESSING_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('VideoProcessor: Failed to save processing state', error);
    }
  }

  /**
   * Restore processing state after app restart
   */
  async restoreProcessingState() {
    try {
      const savedState = await AsyncStorage.getItem(PROCESSING_STATE_KEY);

      if (savedState) {
        const state = JSON.parse(savedState);

        // Check if state is recent (within last hour)
        const isRecent = (Date.now() - state.timestamp) < 3600000;

        if (isRecent && state.currentJob) {
          console.log('VideoProcessor: Restored processing state', state);
          return state;
        }
      }
    } catch (error) {
      console.error('VideoProcessor: Failed to restore processing state', error);
    }

    return null;
  }

  /**
   * Clear processing state
   */
  async clearProcessingState() {
    try {
      await AsyncStorage.removeItem(PROCESSING_STATE_KEY);
      this.currentJob = null;
      this.progress = {
        current: 0,
        total: 0,
        percentage: 0,
        estimatedTimeRemaining: 0
      };
      this.chunkProcessingTimes = [];
    } catch (error) {
      console.error('VideoProcessor: Failed to clear processing state', error);
    }
  }

  /**
   * Utility: Delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current processing status
   */
  getStatus() {
    return {
      state: this.state,
      progress: this.progress,
      currentJob: this.currentJob ? {
        videoUri: this.currentJob.videoUri,
        exerciseType: this.currentJob.exerciseType
      } : null,
      activeWorkers: this.activeWorkers,
      averageChunkTime: this.calculateAverageChunkTime()
    };
  }
}

// Export singleton instance
export default new VideoProcessor();