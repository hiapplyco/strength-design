/**
 * PoseAnalysisService Test Suite
 * Comprehensive tests for core pose analysis functionality
 */

import PoseAnalysisService from '../PoseAnalysisService';
import {
  createMockVideoUri,
  createMockLandmarks,
  createMockLandmarkSequence,
  createMockAnalysisResult,
  createMockProgressCallback,
  createMockFileInfo,
  waitFor
} from './testHelpers';

// Mock dependencies
jest.mock('expo-file-system');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../usageTrackingService');
jest.mock('../../poseSubscriptionService');

describe('PoseAnalysisService', () => {
  let service: PoseAnalysisService;

  beforeEach(() => {
    service = new PoseAnalysisService();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('initializes successfully on supported platforms', async () => {
      const result = await service.initialize();

      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully');
    });

    test('rejects initialization on unsupported platforms', async () => {
      // Mock web platform
      jest.spyOn(require('react-native'), 'Platform', 'get').mockReturnValue({ OS: 'web' });

      const result = await service.initialize();

      expect(result.success).toBe(false);
      expect(result.message).toContain('only supported on iOS and Android');
    });

    test('loads saved settings on initialization', async () => {
      const mockSettings = { minConfidence: 0.8, targetFrameRate: 15 };
      require('@react-native-async-storage/async-storage').getItem.mockResolvedValue(
        JSON.stringify(mockSettings)
      );

      await service.initialize();

      // Settings should be applied
      expect(require('@react-native-async-storage/async-storage').getItem).toHaveBeenCalled();
    });
  });

  describe('Video Analysis', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('successfully analyzes valid squat video', async () => {
      const videoUri = createMockVideoUri(60);
      const { callback } = createMockProgressCallback();

      // Mock file exists
      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(60));

      const result = await service.analyzeVideo(videoUri, 'squat', {
        onProgress: callback
      });

      expect(result.success).toBe(true);
      expect(result.exerciseType).toBe('squat');
      expect(result.analysisScore).toBeGreaterThan(0);
      expect(result.feedback).toBeDefined();
      expect(result.feedback.length).toBeGreaterThan(0);
      expect(callback).toHaveBeenCalled();
    });

    test('handles invalid video URI', async () => {
      const invalidUri = 'not-a-video.txt';

      await expect(
        service.analyzeVideo(invalidUri, 'squat')
      ).rejects.toThrow('Invalid video');
    });

    test('handles non-existent video file', async () => {
      const videoUri = createMockVideoUri(60);

      // Mock file doesn't exist
      require('expo-file-system').getInfoAsync.mockResolvedValue({ exists: false });

      await expect(
        service.analyzeVideo(videoUri, 'squat')
      ).rejects.toThrow();
    });

    test('handles video that is too short', async () => {
      const videoUri = createMockVideoUri(2); // 2 seconds

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(2));

      await expect(
        service.analyzeVideo(videoUri, 'squat')
      ).rejects.toThrow('too short');
    });

    test('handles video that is too long', async () => {
      const videoUri = createMockVideoUri(300); // 5 minutes

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(300));

      await expect(
        service.analyzeVideo(videoUri, 'squat')
      ).rejects.toThrow('too long');
    });

    test('reports progress during analysis', async () => {
      const videoUri = createMockVideoUri(60);
      const { callback, calls } = createMockProgressCallback();

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(60));

      await service.analyzeVideo(videoUri, 'squat', {
        onProgress: callback
      });

      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0].percentage).toBeGreaterThanOrEqual(0);
      expect(calls[calls.length - 1].percentage).toBeLessThanOrEqual(100);

      // Progress should increase over time
      for (let i = 1; i < calls.length; i++) {
        expect(calls[i].percentage).toBeGreaterThanOrEqual(calls[i - 1].percentage);
      }
    });

    test('completes within performance threshold for 60s video', async () => {
      const videoUri = createMockVideoUri(60);

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(60));

      const startTime = Date.now();
      const result = await service.analyzeVideo(videoUri, 'squat');
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(30000); // 30 seconds target
      expect(result.processingTimeMs).toBeLessThan(30000);
    });

    test('handles analysis cancellation', async () => {
      const videoUri = createMockVideoUri(60);

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(60));

      // Start analysis
      const analysisPromise = service.analyzeVideo(videoUri, 'squat');

      // Cancel after 1 second
      await waitFor(1000);
      service.cancelAnalysis(videoUri);

      await expect(analysisPromise).rejects.toThrow('cancelled');
    });

    test('supports different exercise types', async () => {
      const videoUri = createMockVideoUri(60);

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(60));

      const exerciseTypes = ['squat', 'deadlift', 'push_up'];

      for (const exerciseType of exerciseTypes) {
        const result = await service.analyzeVideo(videoUri, exerciseType as any);

        expect(result.success).toBe(true);
        expect(result.exerciseType).toBe(exerciseType);
      }
    });

    test('caches analysis results', async () => {
      const videoUri = createMockVideoUri(60);

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(60));

      // First analysis
      const result1 = await service.analyzeVideo(videoUri, 'squat');

      // Second analysis of same video
      const result2 = await service.analyzeVideo(videoUri, 'squat', { useCache: true });

      expect(result1.id).toBe(result2.id);
      expect(result2.metadata?.cached).toBe(true);
    });

    test('bypasses cache when requested', async () => {
      const videoUri = createMockVideoUri(60);

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(60));

      // First analysis
      const result1 = await service.analyzeVideo(videoUri, 'squat');

      // Second analysis with cache disabled
      const result2 = await service.analyzeVideo(videoUri, 'squat', { useCache: false });

      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('Frame Extraction', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('extracts correct number of frames based on duration', async () => {
      const videoUri = createMockVideoUri(60);

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(60));

      const frames = await service.extractFrames(videoUri, { targetFrameRate: 10 });

      // 60 seconds * 10 fps = ~600 frames
      expect(frames.length).toBeGreaterThan(500);
      expect(frames.length).toBeLessThan(700);
    });

    test('respects custom frame rate setting', async () => {
      const videoUri = createMockVideoUri(30);

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(30));

      const frames5fps = await service.extractFrames(videoUri, { targetFrameRate: 5 });
      const frames15fps = await service.extractFrames(videoUri, { targetFrameRate: 15 });

      expect(frames15fps.length).toBeGreaterThan(frames5fps.length);
    });

    test('handles frame extraction errors gracefully', async () => {
      const videoUri = createMockVideoUri(60);

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(60));

      // Mock frame extraction failure
      jest.spyOn(service as any, 'extractVideoFrames').mockRejectedValue(
        new Error('Frame extraction failed')
      );

      await expect(
        service.extractFrames(videoUri)
      ).rejects.toThrow('Frame extraction failed');
    });
  });

  describe('Landmark Detection', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('detects landmarks from valid frame', async () => {
      const mockFrame = {
        uri: 'file:///mock/frame.jpg',
        timestamp: 1000,
        frameNumber: 30,
        width: 1920,
        height: 1080
      };

      const landmarks = await service.detectLandmarks(mockFrame);

      expect(landmarks).toBeDefined();
      expect(landmarks.landmarks).toHaveLength(33); // ML Kit provides 33 landmarks
      expect(landmarks.confidence).toBeGreaterThan(0);
      expect(landmarks.confidence).toBeLessThanOrEqual(1);
    });

    test('handles low confidence detection', async () => {
      const mockFrame = {
        uri: 'file:///mock/poor-quality-frame.jpg',
        timestamp: 1000,
        frameNumber: 30,
        width: 1920,
        height: 1080
      };

      // Mock low confidence
      jest.spyOn(service as any, 'runMLKitDetection').mockResolvedValue(
        createMockLandmarks({ quality: 'poor' })
      );

      const landmarks = await service.detectLandmarks(mockFrame);

      expect(landmarks.confidence).toBeLessThan(0.7);
    });

    test('rejects frame with no person detected', async () => {
      const mockFrame = {
        uri: 'file:///mock/empty-frame.jpg',
        timestamp: 1000,
        frameNumber: 30,
        width: 1920,
        height: 1080
      };

      // Mock no detection
      jest.spyOn(service as any, 'runMLKitDetection').mockResolvedValue(null);

      await expect(
        service.detectLandmarks(mockFrame)
      ).rejects.toThrow('No person detected');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('handles network errors during upload', async () => {
      const videoUri = createMockVideoUri(60);

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(60));

      // Mock network error
      jest.spyOn(service as any, 'uploadVideoForProcessing').mockRejectedValue(
        new Error('Network request failed')
      );

      await expect(
        service.analyzeVideo(videoUri, 'squat')
      ).rejects.toThrow('Network');
    });

    test('handles out of memory errors', async () => {
      const videoUri = createMockVideoUri(60);

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(60));

      // Mock OOM error
      jest.spyOn(service as any, 'processFrames').mockRejectedValue(
        new Error('JavaScript heap out of memory')
      );

      await expect(
        service.analyzeVideo(videoUri, 'squat')
      ).rejects.toThrow('memory');
    });

    test('provides actionable error messages', async () => {
      const videoUri = 'invalid-uri';

      try {
        await service.analyzeVideo(videoUri, 'squat');
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);
        // Error should be user-friendly
        expect(error.message).not.toContain('undefined');
        expect(error.message).not.toContain('null');
      }
    });
  });

  describe('Subscription Integration', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('checks usage limits before analysis', async () => {
      const videoUri = createMockVideoUri(60);

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(60));

      const mockSubscriptionService = require('../../poseSubscriptionService');
      mockSubscriptionService.checkUsageLimit = jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 3
      });

      await service.analyzeVideo(videoUri, 'squat');

      expect(mockSubscriptionService.checkUsageLimit).toHaveBeenCalled();
    });

    test('rejects analysis when usage limit exceeded', async () => {
      const videoUri = createMockVideoUri(60);

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(60));

      const mockSubscriptionService = require('../../poseSubscriptionService');
      mockSubscriptionService.checkUsageLimit = jest.fn().mockResolvedValue({
        allowed: false,
        remaining: 0
      });

      await expect(
        service.analyzeVideo(videoUri, 'squat')
      ).rejects.toThrow('usage limit');
    });

    test('tracks usage after successful analysis', async () => {
      const videoUri = createMockVideoUri(60);

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(60));

      const mockUsageTracking = require('../../usageTrackingService');
      mockUsageTracking.trackAnalysis = jest.fn();

      await service.analyzeVideo(videoUri, 'squat');

      expect(mockUsageTracking.trackAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          exerciseType: 'squat',
          success: true
        })
      );
    });
  });

  describe('Performance Optimization', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('adapts frame rate based on device tier', async () => {
      const videoUri = createMockVideoUri(60);

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(60));

      // Mock low-end device
      jest.spyOn(service as any, 'getDeviceTier').mockReturnValue('low');

      const result = await service.analyzeVideo(videoUri, 'squat');

      // Low-end device should use lower frame rate
      expect(result.metadata?.deviceTier).toBe('low');
      expect(result.metadata?.framesAnalyzed).toBeLessThan(400); // Less than 10fps for 60s
    });

    test('uses higher frame rate on high-end devices', async () => {
      const videoUri = createMockVideoUri(60);

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(60));

      // Mock high-end device
      jest.spyOn(service as any, 'getDeviceTier').mockReturnValue('high');

      const result = await service.analyzeVideo(videoUri, 'squat');

      expect(result.metadata?.deviceTier).toBe('high');
      expect(result.metadata?.framesAnalyzed).toBeGreaterThan(600); // More than 10fps
    });

    test('processes frames in batches for memory efficiency', async () => {
      const videoUri = createMockVideoUri(60);

      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(60));

      const processBatchSpy = jest.spyOn(service as any, 'processFrameBatch');

      await service.analyzeVideo(videoUri, 'squat');

      // Should have called batch processing multiple times
      expect(processBatchSpy).toHaveBeenCalled();
      expect(processBatchSpy.mock.calls.length).toBeGreaterThan(1);
    });
  });
});
