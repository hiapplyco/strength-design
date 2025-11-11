/**
 * Video Processor Service Test Suite
 * Tests for chunked video processing and parallel frame processing
 */

import VideoProcessor from '../videoProcessor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import frameOptimizer from '../frameOptimizer';
import performanceMonitor from '../performanceMonitor';

// Mock video URI
const mockVideoUri = 'file:///video.mp4';

// Mock frames
const createMockFrames = (count) =>
  Array.from({ length: count }, (_, i) => ({
    frameNumber: i,
    timestamp: i * 1000,
    uri: `file:///frame-${i}.jpg`,
    width: 1920,
    height: 1080,
    data: Buffer.alloc(1024) // 1KB frame
  }));

describe('VideoProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new VideoProcessor();
    jest.clearAllMocks();

    // Mock dependencies
    frameOptimizer.initialize = jest.fn().mockResolvedValue({ success: true });
    performanceMonitor.startProcessing = jest.fn();
    performanceMonitor.recordFrameProcessing = jest.fn();
  });

  describe('Initialization', () => {
    test('initializes successfully', async () => {
      const result = await processor.initialize();

      expect(result.success).toBe(true);
      expect(processor.state).toBe('idle');
    });

    test('initializes frame object pool', async () => {
      await processor.initialize();

      expect(processor.framePool.length).toBeGreaterThan(0);
      expect(processor.framePool.every(f => !f.inUse)).toBe(true);
    });

    test('initializes frame optimizer dependency', async () => {
      await processor.initialize();

      expect(frameOptimizer.initialize).toHaveBeenCalled();
    });

    test('restores previous processing state if exists', async () => {
      const savedState = {
        videoUri: mockVideoUri,
        processedFrames: 50,
        totalFrames: 100
      };

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedState));

      await processor.initialize();

      expect(processor.currentJob).toBeDefined();
    });

    test('handles initialization errors gracefully', async () => {
      frameOptimizer.initialize.mockRejectedValue(new Error('Init failed'));

      const result = await processor.initialize();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Frame Pool Management', () => {
    beforeEach(async () => {
      await processor.initialize();
    });

    test('gets available frame from pool', () => {
      const frame = processor.getFrameFromPool();

      expect(frame).toBeDefined();
      expect(frame.inUse).toBe(true);
    });

    test('returns null when no frames available', () => {
      // Mark all frames as in use
      processor.framePool.forEach(f => f.inUse = true);

      const frame = processor.getFrameFromPool();

      expect(frame).toBeNull();
    });

    test('returns frame to pool and clears data', () => {
      const frame = processor.getFrameFromPool();
      frame.uri = 'file:///frame.jpg';
      frame.data = Buffer.alloc(1024);

      processor.returnFrameToPool(frame);

      expect(frame.inUse).toBe(false);
      expect(frame.uri).toBeNull();
      expect(frame.data).toBeNull();
    });

    test('reuses pooled frames efficiently', () => {
      const frame1 = processor.getFrameFromPool();
      const id1 = frame1.id;

      processor.returnFrameToPool(frame1);

      const frame2 = processor.getFrameFromPool();
      const id2 = frame2.id;

      expect(id2).toBe(id1); // Should reuse same frame object
    });
  });

  describe('Video Processing Pipeline', () => {
    beforeEach(async () => {
      await processor.initialize();
    });

    test('processes video with progress callbacks', async () => {
      const onProgress = jest.fn();
      const mockFrames = createMockFrames(30);

      jest.spyOn(processor, 'extractAndProcessFrames').mockResolvedValue(mockFrames);

      await processor.processVideo(mockVideoUri, {
        onProgress,
        exerciseType: 'squat',
        deviceTier: 'medium'
      });

      expect(onProgress).toHaveBeenCalled();
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          current: expect.any(Number),
          total: expect.any(Number),
          percentage: expect.any(Number)
        })
      );
    });

    test('prevents concurrent video processing', async () => {
      processor.state = 'processing';

      await expect(
        processor.processVideo(mockVideoUri)
      ).rejects.toThrow('Already processing');
    });

    test('transitions through processing states', async () => {
      const states = [];
      const stateTracker = () => states.push(processor.state);

      jest.spyOn(processor, 'extractAndProcessFrames').mockImplementation(async () => {
        stateTracker();
        return createMockFrames(10);
      });

      await processor.processVideo(mockVideoUri);

      expect(states).toContain('processing');
      expect(processor.state).toBe('completed');
    });

    test('calls completion callback with results', async () => {
      const onComplete = jest.fn();
      const mockFrames = createMockFrames(10);

      jest.spyOn(processor, 'extractAndProcessFrames').mockResolvedValue(mockFrames);

      await processor.processVideo(mockVideoUri, { onComplete });

      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          frames: expect.any(Array)
        })
      );
    });

    test('calls error callback on failure', async () => {
      const onError = jest.fn();

      jest.spyOn(processor, 'extractAndProcessFrames').mockRejectedValue(
        new Error('Processing failed')
      );

      await processor.processVideo(mockVideoUri, { onError });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(processor.state).toBe('failed');
    });
  });

  describe('Chunked Processing', () => {
    beforeEach(async () => {
      await processor.initialize();
    });

    test('processes frames in chunks', async () => {
      const frames = createMockFrames(35);
      const chunkSize = 10;

      const processChunkSpy = jest.spyOn(processor, 'processChunk')
        .mockResolvedValue({ success: true });

      await processor.processFramesInChunks(frames, chunkSize);

      // 35 frames / 10 per chunk = 4 chunks
      expect(processChunkSpy).toHaveBeenCalledTimes(4);
    });

    test('maintains processing order across chunks', async () => {
      const frames = createMockFrames(25);
      const processedOrder = [];

      jest.spyOn(processor, 'processFrame').mockImplementation(async (frame) => {
        processedOrder.push(frame.frameNumber);
        return frame;
      });

      await processor.processFramesInChunks(frames, 10);

      // Check that frame numbers are in ascending order
      for (let i = 1; i < processedOrder.length; i++) {
        expect(processedOrder[i]).toBeGreaterThan(processedOrder[i - 1]);
      }
    });

    test('respects processing timeout per chunk', async () => {
      jest.useFakeTimers();

      jest.spyOn(processor, 'processChunk').mockImplementation(() =>
        new Promise((resolve) => setTimeout(resolve, 35000)) // Exceeds timeout
      );

      const promise = processor.processFramesInChunks(createMockFrames(10), 10);

      jest.advanceTimersByTime(30000); // Process timeout

      await expect(promise).rejects.toThrow('timeout');

      jest.useRealTimers();
    });

    test('tracks chunk processing times', async () => {
      const frames = createMockFrames(20);

      jest.spyOn(processor, 'processChunk').mockResolvedValue({ success: true });

      await processor.processFramesInChunks(frames, 10);

      expect(processor.chunkProcessingTimes.length).toBeGreaterThan(0);
      expect(processor.chunkProcessingTimes.every(t => t > 0)).toBe(true);
    });
  });

  describe('Parallel Processing', () => {
    beforeEach(async () => {
      await processor.initialize();
    });

    test('processes frames in parallel up to worker limit', async () => {
      const frames = createMockFrames(10);

      let maxConcurrent = 0;
      jest.spyOn(processor, 'processFrame').mockImplementation(async () => {
        processor.activeWorkers++;
        maxConcurrent = Math.max(maxConcurrent, processor.activeWorkers);

        await new Promise(resolve => setTimeout(resolve, 10));

        processor.activeWorkers--;
        return {};
      });

      await processor.processFramesInParallel(frames, 3);

      expect(maxConcurrent).toBeLessThanOrEqual(3);
    });

    test('waits for all workers to complete', async () => {
      const frames = createMockFrames(5);
      const completed = [];

      jest.spyOn(processor, 'processFrame').mockImplementation(async (frame) => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        completed.push(frame.frameNumber);
        return frame;
      });

      await processor.processFramesInParallel(frames, 3);

      expect(completed.length).toBe(5); // All frames completed
    });

    test('handles worker failures gracefully', async () => {
      const frames = createMockFrames(5);

      jest.spyOn(processor, 'processFrame').mockImplementation(async (frame) => {
        if (frame.frameNumber === 2) {
          throw new Error('Worker failed');
        }
        return frame;
      });

      const results = await processor.processFramesInParallel(frames, 3);

      // Should complete other frames despite one failure
      expect(results.successful.length).toBe(4);
      expect(results.failed.length).toBe(1);
    });
  });

  describe('Progress Tracking', () => {
    beforeEach(async () => {
      await processor.initialize();
    });

    test('updates progress during processing', async () => {
      processor.progress.total = 100;

      processor.updateProgress(25);

      expect(processor.progress.current).toBe(25);
      expect(processor.progress.percentage).toBe(25);
    });

    test('calculates estimated time remaining', async () => {
      processor.startTime = Date.now() - 10000; // Started 10 seconds ago
      processor.progress.total = 100;

      processor.updateProgress(50); // 50% complete

      expect(processor.progress.estimatedTimeRemaining).toBeGreaterThan(0);
      expect(processor.progress.estimatedTimeRemaining).toBeLessThan(15000); // ~10 seconds left
    });

    test('handles completion (100%)', async () => {
      processor.progress.total = 100;

      processor.updateProgress(100);

      expect(processor.progress.percentage).toBe(100);
      expect(processor.progress.estimatedTimeRemaining).toBe(0);
    });
  });

  describe('State Persistence', () => {
    beforeEach(async () => {
      await processor.initialize();
    });

    test('saves processing state during operation', async () => {
      processor.currentJob = {
        videoUri: mockVideoUri,
        processedFrames: 50,
        totalFrames: 100
      };

      await processor.saveProcessingState();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@video_processing_state',
        expect.stringContaining(mockVideoUri)
      );
    });

    test('restores saved processing state', async () => {
      const savedState = {
        videoUri: mockVideoUri,
        processedFrames: 50,
        totalFrames: 100,
        timestamp: Date.now()
      };

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedState));

      await processor.restoreProcessingState();

      expect(processor.currentJob).toEqual(expect.objectContaining({
        videoUri: mockVideoUri,
        processedFrames: 50
      }));
    });

    test('resumes processing from saved state', async () => {
      const savedState = {
        videoUri: mockVideoUri,
        processedFrames: 50,
        totalFrames: 100
      };

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedState));

      const resumeSpy = jest.spyOn(processor, 'resumeProcessing')
        .mockResolvedValue({ success: true });

      await processor.initialize();

      expect(resumeSpy).toHaveBeenCalled();
    });

    test('clears state after successful completion', async () => {
      processor.currentJob = { videoUri: mockVideoUri };

      await processor.clearProcessingState();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        '@video_processing_state'
      );
    });
  });

  describe('Cancellation', () => {
    beforeEach(async () => {
      await processor.initialize();
    });

    test('cancels ongoing processing', async () => {
      jest.spyOn(processor, 'extractAndProcessFrames').mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 5000))
      );

      const promise = processor.processVideo(mockVideoUri);

      // Cancel after 100ms
      setTimeout(() => processor.cancel(), 100);

      await expect(promise).rejects.toThrow('cancelled');
      expect(processor.state).toBe('cancelled');
    });

    test('stops all active workers on cancellation', async () => {
      processor.activeWorkers = 3;

      processor.cancel();

      expect(processor.cancelToken).toBe(true);
      expect(processor.state).toBe('cancelled');
    });

    test('cleans up resources on cancellation', async () => {
      processor.processedFrames = createMockFrames(20);

      processor.cancel();

      await processor.cleanup();

      expect(processor.processedFrames).toHaveLength(0);
      expect(processor.activeWorkers).toBe(0);
    });
  });

  describe('Pause and Resume', () => {
    beforeEach(async () => {
      await processor.initialize();
    });

    test('pauses processing', () => {
      processor.state = 'processing';

      processor.pause();

      expect(processor.state).toBe('paused');
    });

    test('resumes paused processing', async () => {
      processor.state = 'paused';
      processor.currentJob = {
        videoUri: mockVideoUri,
        processedFrames: 50,
        totalFrames: 100
      };

      jest.spyOn(processor, 'extractAndProcessFrames')
        .mockResolvedValue(createMockFrames(50));

      await processor.resume();

      expect(processor.state).toBe('completed');
    });

    test('saves state when pausing', async () => {
      processor.state = 'processing';
      processor.currentJob = { videoUri: mockVideoUri };

      const saveSpy = jest.spyOn(processor, 'saveProcessingState');

      processor.pause();

      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('Memory Management', () => {
    beforeEach(async () => {
      await processor.initialize();
    });

    test('releases frames after processing', async () => {
      const frame = processor.getFrameFromPool();

      await processor.processAndReleaseFrame(frame);

      expect(frame.inUse).toBe(false);
    });

    test('limits concurrent frame allocation', () => {
      const maxFrames = processor.framePool.length;

      // Try to allocate more frames than available
      const frames = [];
      for (let i = 0; i < maxFrames + 10; i++) {
        const frame = processor.getFrameFromPool();
        if (frame) frames.push(frame);
      }

      expect(frames.length).toBeLessThanOrEqual(maxFrames);
    });

    test('detects memory pressure and adapts', async () => {
      // Simulate high memory usage
      jest.spyOn(processor, 'checkMemoryPressure').mockReturnValue(true);

      const adaptSpy = jest.spyOn(processor, 'adaptToMemoryPressure');

      await processor.processVideo(mockVideoUri);

      expect(adaptSpy).toHaveBeenCalled();
    });
  });

  describe('Resolution Optimization', () => {
    beforeEach(async () => {
      await processor.initialize();
    });

    test('uses low resolution for low-tier devices', () => {
      const resolution = processor.getOptimalResolution('low');

      expect(resolution.width).toBeLessThanOrEqual(480);
      expect(resolution.height).toBeLessThanOrEqual(270);
    });

    test('uses high resolution for high-tier devices', () => {
      const resolution = processor.getOptimalResolution('high');

      expect(resolution.width).toBeGreaterThanOrEqual(1280);
      expect(resolution.height).toBeGreaterThanOrEqual(720);
    });

    test('maintains aspect ratio when resizing', () => {
      const original = { width: 1920, height: 1080 }; // 16:9
      const resized = processor.resizeToOptimalResolution(original, 'medium');

      const aspectRatio = resized.width / resized.height;
      expect(aspectRatio).toBeCloseTo(16 / 9, 2);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await processor.initialize();
    });

    test('handles video load failures', async () => {
      jest.spyOn(processor, 'loadVideo').mockRejectedValue(
        new Error('Video file not found')
      );

      await expect(
        processor.processVideo('invalid-uri')
      ).rejects.toThrow('Video file not found');

      expect(processor.state).toBe('failed');
    });

    test('recovers from frame extraction errors', async () => {
      jest.spyOn(processor, 'extractFrame').mockImplementation((index) => {
        if (index === 5) throw new Error('Extraction failed');
        return Promise.resolve(createMockFrames(1)[0]);
      });

      const result = await processor.extractFramesRobustly([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

      // Should extract all except frame 5
      expect(result.length).toBe(9);
      expect(result.every(f => f.frameNumber !== 5)).toBe(true);
    });

    test('cleans up on error', async () => {
      processor.processedFrames = createMockFrames(20);

      jest.spyOn(processor, 'extractAndProcessFrames').mockRejectedValue(
        new Error('Processing error')
      );

      try {
        await processor.processVideo(mockVideoUri);
      } catch (error) {
        // Expected error
      }

      expect(processor.state).toBe('failed');
      expect(processor.activeWorkers).toBe(0);
    });
  });

  describe('Performance Integration', () => {
    beforeEach(async () => {
      await processor.initialize();
    });

    test('reports processing metrics to performance monitor', async () => {
      const mockFrames = createMockFrames(10);

      jest.spyOn(processor, 'extractAndProcessFrames').mockResolvedValue(mockFrames);

      await processor.processVideo(mockVideoUri);

      expect(performanceMonitor.startProcessing).toHaveBeenCalled();
      expect(performanceMonitor.recordFrameProcessing).toHaveBeenCalled();
    });

    test('adapts to device tier recommendations', async () => {
      const lowTierSettings = processor.getProcessingSettings('low');
      const highTierSettings = processor.getProcessingSettings('high');

      expect(lowTierSettings.chunkSize).toBeLessThan(highTierSettings.chunkSize);
      expect(lowTierSettings.maxParallel).toBeLessThan(highTierSettings.maxParallel);
    });
  });
});
