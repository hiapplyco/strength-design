/**
 * Frame Optimizer Service Test Suite
 * Tests for adaptive frame sampling and optimization
 */

import FrameOptimizer from '../frameOptimizer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// Mock video metadata
const mockVideoMetadata = {
  uri: 'file:///video.mp4',
  duration: 60000, // 60 seconds
  width: 1920,
  height: 1080,
  frameCount: 1800, // 30 fps
  fileSize: 50 * 1024 * 1024 // 50MB
};

// Mock frames
const createMockFrame = (frameNumber, timestamp, quality = 0.9) => ({
  frameNumber,
  timestamp,
  uri: `file:///frame-${frameNumber}.jpg`,
  width: 1920,
  height: 1080,
  quality,
  motionScore: Math.random() * 0.5
});

describe('FrameOptimizer', () => {
  let optimizer;

  beforeEach(() => {
    optimizer = new FrameOptimizer();
    jest.clearAllMocks();

    // Mock FileSystem
    FileSystem.getInfoAsync.mockResolvedValue({
      exists: true,
      size: mockVideoMetadata.fileSize,
      uri: mockVideoMetadata.uri
    });
  });

  describe('Initialization', () => {
    test('initializes with default settings', async () => {
      const result = await optimizer.initialize();

      expect(result.success).toBe(true);
      expect(result.settings).toBeDefined();
      expect(result.settings.targetFrameRate).toBe(10);
    });

    test('loads saved settings from storage', async () => {
      const savedSettings = {
        targetFrameRate: 12,
        motionThreshold: 0.15,
        qualityThreshold: 0.7
      };

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedSettings));

      await optimizer.initialize();

      expect(optimizer.settings.targetFrameRate).toBe(12);
      expect(optimizer.settings.motionThreshold).toBe(0.15);
      expect(optimizer.settings.qualityThreshold).toBe(0.7);
    });

    test('merges custom settings with defaults', async () => {
      const customSettings = { targetFrameRate: 8 };

      const result = await optimizer.initialize(customSettings);

      expect(result.settings.targetFrameRate).toBe(8);
      expect(result.settings.minFrameRate).toBe(5); // Default preserved
    });

    test('clears old cache on initialization', async () => {
      const clearCacheSpy = jest.spyOn(optimizer, 'clearCache').mockResolvedValue();

      await optimizer.initialize();

      expect(clearCacheSpy).toHaveBeenCalled();
    });

    test('handles initialization errors gracefully', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await optimizer.initialize();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Device Tier Adaptation', () => {
    test('adjusts settings for low-end devices', () => {
      optimizer.adjustSettingsForDevice('low');

      expect(optimizer.settings.targetFrameRate).toBeLessThanOrEqual(5);
      expect(optimizer.settings.resolutionScale).toBeLessThanOrEqual(0.5);
    });

    test('adjusts settings for high-end devices', () => {
      optimizer.adjustSettingsForDevice('high');

      expect(optimizer.settings.targetFrameRate).toBeGreaterThanOrEqual(12);
      expect(optimizer.settings.resolutionScale).toBeGreaterThan(0.5);
    });

    test('maintains medium settings for mid-tier devices', () => {
      const initialFrameRate = optimizer.settings.targetFrameRate;

      optimizer.adjustSettingsForDevice('medium');

      expect(optimizer.settings.targetFrameRate).toBe(initialFrameRate);
    });
  });

  describe('Frame Extraction Strategy', () => {
    beforeEach(async () => {
      await optimizer.initialize();
    });

    test('calculates extraction strategy for squat analysis', () => {
      const strategy = optimizer.calculateExtractionStrategy(
        mockVideoMetadata,
        'squat'
      );

      expect(strategy).toHaveProperty('samplingRate');
      expect(strategy).toHaveProperty('focusRegion');
      expect(strategy.focusRegion).toBe('LOWER_BODY');
    });

    test('calculates extraction strategy for push-up analysis', () => {
      const strategy = optimizer.calculateExtractionStrategy(
        mockVideoMetadata,
        'push-up'
      );

      expect(strategy.focusRegion).toBe('FULL_BODY');
    });

    test('adjusts sampling rate based on video duration', () => {
      const shortVideo = { ...mockVideoMetadata, duration: 10000 }; // 10 seconds
      const longVideo = { ...mockVideoMetadata, duration: 120000 }; // 2 minutes

      const shortStrategy = optimizer.calculateExtractionStrategy(shortVideo, 'squat');
      const longStrategy = optimizer.calculateExtractionStrategy(longVideo, 'squat');

      // Shorter videos should have higher sampling rate
      expect(shortStrategy.samplingRate).toBeGreaterThan(longStrategy.samplingRate);
    });

    test('considers device tier in strategy calculation', () => {
      optimizer.adjustSettingsForDevice('low');
      const lowStrategy = optimizer.calculateExtractionStrategy(
        mockVideoMetadata,
        'squat'
      );

      optimizer.adjustSettingsForDevice('high');
      const highStrategy = optimizer.calculateExtractionStrategy(
        mockVideoMetadata,
        'squat'
      );

      expect(highStrategy.samplingRate).toBeGreaterThan(lowStrategy.samplingRate);
    });
  });

  describe('Frame Extraction', () => {
    beforeEach(async () => {
      await optimizer.initialize();
    });

    test('extracts frames with progress callbacks', async () => {
      const onProgress = jest.fn();
      const mockFrames = Array.from({ length: 10 }, (_, i) =>
        createMockFrame(i, i * 1000)
      );

      jest.spyOn(optimizer, 'extractFramesWithStrategy').mockResolvedValue(mockFrames);
      jest.spyOn(optimizer, 'postProcessFrames').mockResolvedValue(mockFrames);

      await optimizer.extractOptimizedFrames(mockVideoMetadata.uri, {
        duration: 60,
        exerciseType: 'squat',
        deviceTier: 'medium',
        onProgress
      });

      expect(onProgress).toHaveBeenCalled();
    });

    test('returns metadata about extraction process', async () => {
      const mockFrames = Array.from({ length: 10 }, (_, i) =>
        createMockFrame(i, i * 1000)
      );

      jest.spyOn(optimizer, 'extractFramesWithStrategy').mockResolvedValue(mockFrames);
      jest.spyOn(optimizer, 'postProcessFrames').mockResolvedValue(mockFrames);
      jest.spyOn(optimizer, 'getVideoMetadata').mockResolvedValue(mockVideoMetadata);

      const result = await optimizer.extractOptimizedFrames(mockVideoMetadata.uri);

      expect(result.success).toBe(true);
      expect(result.metadata).toHaveProperty('originalFrameCount');
      expect(result.metadata).toHaveProperty('extractedFrameCount');
      expect(result.metadata).toHaveProperty('samplingRate');
      expect(result.metadata).toHaveProperty('compressionRatio');
    });

    test('handles extraction errors gracefully', async () => {
      jest.spyOn(optimizer, 'getVideoMetadata').mockRejectedValue(
        new Error('Failed to load video')
      );

      const result = await optimizer.extractOptimizedFrames('invalid-uri');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('respects maximum frame rate limit', async () => {
      optimizer.settings.maxFrameRate = 10;

      const mockFrames = Array.from({ length: 100 }, (_, i) =>
        createMockFrame(i, i * 100)
      );

      jest.spyOn(optimizer, 'extractFramesWithStrategy').mockResolvedValue(mockFrames);
      jest.spyOn(optimizer, 'postProcessFrames').mockResolvedValue(mockFrames);
      jest.spyOn(optimizer, 'getVideoMetadata').mockResolvedValue({
        ...mockVideoMetadata,
        duration: 10000 // 10 seconds
      });

      const result = await optimizer.extractOptimizedFrames(mockVideoMetadata.uri);

      // Should not exceed maxFrameRate * duration
      expect(result.frames.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Motion Detection', () => {
    beforeEach(async () => {
      await optimizer.initialize();
    });

    test('detects motion between consecutive frames', () => {
      const frame1 = createMockFrame(0, 0, 0.9);
      const frame2 = createMockFrame(1, 1000, 0.9);

      frame1.pixels = Array(100).fill(128);
      frame2.pixels = Array(100).fill(150); // Different pixels = motion

      const motion = optimizer.detectMotion(frame1, frame2);

      expect(motion).toBeGreaterThan(0);
      expect(motion).toBeLessThanOrEqual(1);
    });

    test('returns low motion score for similar frames', () => {
      const frame1 = createMockFrame(0, 0, 0.9);
      const frame2 = createMockFrame(1, 1000, 0.9);

      frame1.pixels = Array(100).fill(128);
      frame2.pixels = Array(100).fill(128); // Same pixels = no motion

      const motion = optimizer.detectMotion(frame1, frame2);

      expect(motion).toBeLessThan(optimizer.settings.motionThreshold);
    });

    test('prioritizes frames with higher motion', () => {
      const frames = [
        { ...createMockFrame(0, 0), motionScore: 0.1 },
        { ...createMockFrame(1, 1000), motionScore: 0.5 }, // High motion
        { ...createMockFrame(2, 2000), motionScore: 0.2 },
        { ...createMockFrame(3, 3000), motionScore: 0.6 }  // High motion
      ];

      const prioritized = optimizer.prioritizeFramesByMotion(frames, 2);

      expect(prioritized).toHaveLength(2);
      expect(prioritized[0].motionScore).toBeGreaterThanOrEqual(0.5);
      expect(prioritized[1].motionScore).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('Frame Quality Assessment', () => {
    beforeEach(async () => {
      await optimizer.initialize();
    });

    test('assesses frame quality based on multiple factors', () => {
      const frame = createMockFrame(0, 0, 0.9);
      frame.blurScore = 0.1; // Low blur (good)
      frame.brightness = 0.5; // Good brightness
      frame.contrast = 0.4; // Good contrast

      const quality = optimizer.assessFrameQuality(frame);

      expect(quality).toBeGreaterThan(optimizer.settings.qualityThreshold);
    });

    test('rejects blurry frames', () => {
      const frame = createMockFrame(0, 0, 0.5);
      frame.blurScore = 0.8; // High blur (bad)

      const quality = optimizer.assessFrameQuality(frame);

      expect(quality).toBeLessThan(optimizer.settings.qualityThreshold);
    });

    test('filters frames below quality threshold', () => {
      const frames = [
        { ...createMockFrame(0, 0), quality: 0.9 },
        { ...createMockFrame(1, 1000), quality: 0.4 }, // Below threshold
        { ...createMockFrame(2, 2000), quality: 0.8 },
        { ...createMockFrame(3, 3000), quality: 0.3 }  // Below threshold
      ];

      optimizer.settings.qualityThreshold = 0.6;

      const filtered = optimizer.filterByQuality(frames);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(f => f.quality >= 0.6)).toBe(true);
    });
  });

  describe('Key Frame Identification', () => {
    beforeEach(async () => {
      await optimizer.initialize();
    });

    test('identifies key frames at regular intervals', () => {
      const frames = Array.from({ length: 50 }, (_, i) =>
        createMockFrame(i, i * 1000)
      );

      optimizer.settings.keyFrameInterval = 10;

      const keyFrames = optimizer.identifyKeyFrames(frames);

      expect(keyFrames.length).toBeGreaterThan(0);
      expect(keyFrames.length).toBeLessThanOrEqual(Math.ceil(frames.length / 10));
    });

    test('ensures first and last frames are key frames', () => {
      const frames = Array.from({ length: 20 }, (_, i) =>
        createMockFrame(i, i * 1000)
      );

      const keyFrames = optimizer.identifyKeyFrames(frames);

      expect(keyFrames[0].frameNumber).toBe(0);
      expect(keyFrames[keyFrames.length - 1].frameNumber).toBe(19);
    });

    test('identifies frames with significant motion as key frames', () => {
      const frames = Array.from({ length: 10 }, (_, i) => ({
        ...createMockFrame(i, i * 1000),
        motionScore: i === 5 ? 0.9 : 0.1 // Frame 5 has high motion
      }));

      const keyFrames = optimizer.identifyKeyFrames(frames);

      const frameNumbers = keyFrames.map(f => f.frameNumber);
      expect(frameNumbers).toContain(5);
    });
  });

  describe('Adaptive Sampling', () => {
    beforeEach(async () => {
      await optimizer.initialize();
      optimizer.settings.adaptiveSampling = true;
    });

    test('increases sampling rate during high motion periods', () => {
      optimizer.motionHistory = [0.8, 0.7, 0.9]; // High motion

      optimizer.adjustSamplingRate();

      expect(optimizer.currentSamplingRate).toBeGreaterThan(
        optimizer.settings.targetFrameRate
      );
    });

    test('decreases sampling rate during low motion periods', () => {
      optimizer.motionHistory = [0.1, 0.05, 0.08]; // Low motion

      optimizer.adjustSamplingRate();

      expect(optimizer.currentSamplingRate).toBeLessThan(
        optimizer.settings.targetFrameRate
      );
    });

    test('respects minimum and maximum frame rate bounds', () => {
      optimizer.settings.minFrameRate = 5;
      optimizer.settings.maxFrameRate = 15;

      // Test minimum bound
      optimizer.motionHistory = [0.01, 0.01, 0.01]; // Very low motion
      optimizer.adjustSamplingRate();
      expect(optimizer.currentSamplingRate).toBeGreaterThanOrEqual(5);

      // Test maximum bound
      optimizer.motionHistory = [1.0, 1.0, 1.0]; // Very high motion
      optimizer.adjustSamplingRate();
      expect(optimizer.currentSamplingRate).toBeLessThanOrEqual(15);
    });
  });

  describe('Frame Caching', () => {
    beforeEach(async () => {
      await optimizer.initialize();
      optimizer.settings.cacheEnabled = true;
    });

    test('caches extracted frames', () => {
      const frame = createMockFrame(0, 0);

      optimizer.cacheFrame('frame-0', frame);

      expect(optimizer.frameCache.has('frame-0')).toBe(true);
      expect(optimizer.frameCache.get('frame-0')).toEqual(frame);
    });

    test('tracks cache size', () => {
      const frame = createMockFrame(0, 0);
      frame.size = 1024 * 100; // 100KB

      optimizer.cacheFrame('frame-0', frame);

      expect(optimizer.cacheSize).toBeGreaterThan(0);
    });

    test('evicts oldest frames when cache limit exceeded', () => {
      optimizer.settings.maxCacheSize = 1024 * 200; // 200KB limit

      const frame1 = { ...createMockFrame(0, 0), size: 1024 * 100 };
      const frame2 = { ...createMockFrame(1, 1000), size: 1024 * 100 };
      const frame3 = { ...createMockFrame(2, 2000), size: 1024 * 100 };

      optimizer.cacheFrame('frame-0', frame1);
      optimizer.cacheFrame('frame-1', frame2);
      optimizer.cacheFrame('frame-2', frame3); // Should trigger eviction

      expect(optimizer.frameCache.has('frame-0')).toBe(false); // Evicted
      expect(optimizer.frameCache.has('frame-1')).toBe(true);
      expect(optimizer.frameCache.has('frame-2')).toBe(true);
    });

    test('retrieves cached frames', () => {
      const frame = createMockFrame(0, 0);
      optimizer.cacheFrame('frame-0', frame);

      const retrieved = optimizer.getCachedFrame('frame-0');

      expect(retrieved).toEqual(frame);
    });

    test('clears cache', async () => {
      optimizer.cacheFrame('frame-0', createMockFrame(0, 0));
      optimizer.cacheFrame('frame-1', createMockFrame(1, 1000));

      await optimizer.clearCache();

      expect(optimizer.frameCache.size).toBe(0);
      expect(optimizer.cacheSize).toBe(0);
    });
  });

  describe('Post-Processing', () => {
    beforeEach(async () => {
      await optimizer.initialize();
    });

    test('applies exercise-specific optimization', async () => {
      const frames = Array.from({ length: 20 }, (_, i) =>
        createMockFrame(i, i * 1000)
      );

      const optimized = await optimizer.postProcessFrames(frames, 'squat');

      expect(optimized.length).toBeLessThanOrEqual(frames.length);
      expect(optimized.length).toBeGreaterThan(0);
    });

    test('removes duplicate or similar frames', async () => {
      const frames = [
        createMockFrame(0, 0, 0.9),
        createMockFrame(1, 100, 0.9), // Very similar to frame 0
        createMockFrame(2, 2000, 0.9)
      ];

      // Mock similarity detection
      jest.spyOn(optimizer, 'calculateFrameSimilarity').mockImplementation(
        (f1, f2) => f2.frameNumber === 1 ? 0.95 : 0.3
      );

      const optimized = await optimizer.postProcessFrames(frames, 'general');

      expect(optimized.length).toBe(2); // Frame 1 should be removed
    });

    test('maintains temporal order', async () => {
      const frames = Array.from({ length: 10 }, (_, i) =>
        createMockFrame(i, i * 1000)
      );

      const optimized = await optimizer.postProcessFrames(frames, 'squat');

      for (let i = 1; i < optimized.length; i++) {
        expect(optimized[i].timestamp).toBeGreaterThan(optimized[i - 1].timestamp);
      }
    });
  });

  describe('Performance Optimization', () => {
    beforeEach(async () => {
      await optimizer.initialize();
    });

    test('reduces processing time with caching', async () => {
      const frame = createMockFrame(0, 0);
      const cacheKey = 'test-frame';

      // First access - not cached
      jest.spyOn(optimizer, 'processFrame').mockResolvedValue(frame);
      const start1 = Date.now();
      await optimizer.getOrProcessFrame(cacheKey, () => optimizer.processFrame(frame));
      const time1 = Date.now() - start1;

      // Second access - cached
      const start2 = Date.now();
      await optimizer.getOrProcessFrame(cacheKey, () => optimizer.processFrame(frame));
      const time2 = Date.now() - start2;

      expect(time2).toBeLessThan(time1); // Cached access should be faster
    });

    test('processes frames in parallel when possible', async () => {
      const frames = Array.from({ length: 10 }, (_, i) =>
        createMockFrame(i, i * 1000)
      );

      const processSpy = jest.spyOn(optimizer, 'processFrameBatch');

      await optimizer.processFramesInParallel(frames, 5); // Batch size 5

      expect(processSpy).toHaveBeenCalledTimes(2); // 10 frames / 5 per batch
    });
  });

  describe('Error Handling', () => {
    test('handles corrupt video file gracefully', async () => {
      jest.spyOn(optimizer, 'getVideoMetadata').mockRejectedValue(
        new Error('Video file is corrupt')
      );

      const result = await optimizer.extractOptimizedFrames('corrupt-video.mp4');

      expect(result.success).toBe(false);
      expect(result.error).toContain('corrupt');
    });

    test('recovers from frame extraction failures', async () => {
      const frames = Array.from({ length: 10 }, (_, i) =>
        createMockFrame(i, i * 1000)
      );

      jest.spyOn(optimizer, 'extractSingleFrame').mockImplementation((index) => {
        if (index === 5) throw new Error('Frame extraction failed');
        return Promise.resolve(frames[index]);
      });

      const result = await optimizer.extractFramesRobustly('video.mp4', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

      // Should extract all frames except the failed one
      expect(result.length).toBe(9);
    });
  });
});
