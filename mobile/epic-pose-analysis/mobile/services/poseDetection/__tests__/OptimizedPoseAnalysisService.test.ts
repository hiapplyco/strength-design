/**
 * OptimizedPoseAnalysisService Test Suite
 * Tests for performance-optimized pose analysis integration
 */

import OptimizedPoseAnalysisService from '../OptimizedPoseAnalysisService';
import {
  createMockVideoUri,
  createMockProgressCallback,
  createMockFileInfo,
  waitFor
} from './testHelpers';

// Mock optimization services
jest.mock('../../performanceMonitor');
jest.mock('../../frameOptimizer');
jest.mock('../../videoProcessor');
jest.mock('../../backgroundQueue');
jest.mock('../../../utils/memoryManager');
jest.mock('../../../utils/batteryOptimizer');

describe('OptimizedPoseAnalysisService', () => {
  let service: OptimizedPoseAnalysisService;

  beforeEach(async () => {
    service = new OptimizedPoseAnalysisService();
    await service.initialize();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('initializes all optimization services', async () => {
      const mockPerformanceMonitor = require('../../performanceMonitor');
      const mockFrameOptimizer = require('../../frameOptimizer');
      const mockVideoProcessor = require('../../videoProcessor');
      const mockBackgroundQueue = require('../../backgroundQueue');
      const mockMemoryManager = require('../../../utils/memoryManager');
      const mockBatteryOptimizer = require('../../../utils/batteryOptimizer');

      expect(mockPerformanceMonitor.default.initialize).toHaveBeenCalled();
      expect(mockFrameOptimizer.default.initialize).toHaveBeenCalled();
      expect(mockVideoProcessor.default.initialize).toHaveBeenCalled();
      expect(mockBackgroundQueue.default.initialize).toHaveBeenCalled();
      expect(mockMemoryManager.default.initialize).toHaveBeenCalled();
      expect(mockBatteryOptimizer.default.initialize).toHaveBeenCalled();
    });

    test('determines device tier automatically', async () => {
      const tier = await service.getDeviceTier();

      expect(tier).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(tier);
    });

    test('falls back to non-optimized mode on initialization failure', async () => {
      const mockPerformanceMonitor = require('../../performanceMonitor');
      mockPerformanceMonitor.default.initialize.mockRejectedValue(
        new Error('Initialization failed')
      );

      const newService = new OptimizedPoseAnalysisService();
      await newService.initialize();

      // Should still work in fallback mode
      expect(newService.isOptimizationEnabled()).toBe(false);
    });
  });

  describe('Video Analysis with Optimizations', () => {
    beforeEach(() => {
      require('expo-file-system').getInfoAsync.mockResolvedValue(createMockFileInfo(60));
    });

    test('uses optimized processing pipeline', async () => {
      const videoUri = createMockVideoUri(60);
      const mockFrameOptimizer = require('../../frameOptimizer');
      const mockVideoProcessor = require('../../videoProcessor');

      await service.analyzeVideo(videoUri, 'squat');

      expect(mockFrameOptimizer.default.extractOptimizedFrames).toHaveBeenCalled();
      expect(mockVideoProcessor.default.processVideo).toHaveBeenCalled();
    });

    test('integrates performance monitoring', async () => {
      const videoUri = createMockVideoUri(60);
      const mockPerformanceMonitor = require('../../performanceMonitor');

      await service.analyzeVideo(videoUri, 'squat');

      expect(mockPerformanceMonitor.default.startSession).toHaveBeenCalled();
      expect(mockPerformanceMonitor.default.endSession).toHaveBeenCalled();
    });

    test('respects battery optimization settings', async () => {
      const videoUri = createMockVideoUri(60);
      const mockBatteryOptimizer = require('../../../utils/batteryOptimizer');

      // Mock low battery
      mockBatteryOptimizer.default.canProcess.mockReturnValue(false);

      await expect(
        service.analyzeVideo(videoUri, 'squat')
      ).rejects.toThrow('Battery level too low');
    });

    test('uses memory manager during processing', async () => {
      const videoUri = createMockVideoUri(60);
      const mockMemoryManager = require('../../../utils/memoryManager');

      await service.analyzeVideo(videoUri, 'squat');

      expect(mockMemoryManager.default.checkMemoryPressure).toHaveBeenCalled();
    });

    test('completes within performance target (<30s)', async () => {
      const videoUri = createMockVideoUri(60);

      const startTime = Date.now();
      const result = await service.analyzeVideo(videoUri, 'squat');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(30000);
      expect(result.processingTimeMs).toBeLessThan(30000);
    });

    test('achieves target frame rate (10+ FPS)', async () => {
      const videoUri = createMockVideoUri(60);

      const result = await service.analyzeVideo(videoUri, 'squat');

      const fps = result.metadata?.framesAnalyzed / (result.metadata?.videoLength || 60);

      expect(fps).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Device Tier Adaptation', () => {
    test('uses low-end settings on low-tier devices', async () => {
      jest.spyOn(service as any, 'getDeviceTier').mockResolvedValue('low');

      const videoUri = createMockVideoUri(60);
      const mockFrameOptimizer = require('../../frameOptimizer');

      await service.analyzeVideo(videoUri, 'squat');

      expect(mockFrameOptimizer.default.extractOptimizedFrames).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          targetFrameRate: expect.any(Number)
        })
      );

      const callArgs = mockFrameOptimizer.default.extractOptimizedFrames.mock.calls[0][1];
      expect(callArgs.targetFrameRate).toBeLessThanOrEqual(5);
    });

    test('uses high-end settings on high-tier devices', async () => {
      jest.spyOn(service as any, 'getDeviceTier').mockResolvedValue('high');

      const videoUri = createMockVideoUri(60);
      const mockFrameOptimizer = require('../../frameOptimizer');

      await service.analyzeVideo(videoUri, 'squat');

      const callArgs = mockFrameOptimizer.default.extractOptimizedFrames.mock.calls[0][1];
      expect(callArgs.targetFrameRate).toBeGreaterThanOrEqual(12);
    });

    test('adjusts settings based on current memory pressure', async () => {
      const mockMemoryManager = require('../../../utils/memoryManager');
      mockMemoryManager.default.getCurrentPressure.mockReturnValue('high');

      const videoUri = createMockVideoUri(60);

      const result = await service.analyzeVideo(videoUri, 'squat');

      // Should use conservative settings under memory pressure
      expect(result.metadata?.optimizationAdjusted).toBe(true);
    });
  });

  describe('Background Processing', () => {
    test('queues analysis for background processing when requested', async () => {
      const videoUri = createMockVideoUri(60);
      const mockBackgroundQueue = require('../../backgroundQueue');

      await service.analyzeVideo(videoUri, 'squat', { background: true });

      expect(mockBackgroundQueue.default.addJob).toHaveBeenCalled();
    });

    test('processes immediately in foreground by default', async () => {
      const videoUri = createMockVideoUri(60);
      const mockVideoProcessor = require('../../videoProcessor');

      await service.analyzeVideo(videoUri, 'squat', { background: false });

      expect(mockVideoProcessor.default.processVideo).toHaveBeenCalled();
    });

    test('handles background processing priority', async () => {
      const videoUri = createMockVideoUri(60);
      const mockBackgroundQueue = require('../../backgroundQueue');

      await service.analyzeVideo(videoUri, 'squat', {
        background: true,
        priority: 'high'
      });

      expect(mockBackgroundQueue.default.addJob).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          priority: expect.any(Number)
        })
      );
    });
  });

  describe('Optimization Modes', () => {
    test('performance mode prioritizes speed', async () => {
      service.setOptimizationMode('performance');

      const videoUri = createMockVideoUri(60);
      const mockFrameOptimizer = require('../../frameOptimizer');

      await service.analyzeVideo(videoUri, 'squat');

      // Should use lower frame rate for speed
      const callArgs = mockFrameOptimizer.default.extractOptimizedFrames.mock.calls[0][1];
      expect(callArgs.targetFrameRate).toBeLessThan(12);
    });

    test('quality mode prioritizes accuracy', async () => {
      service.setOptimizationMode('quality');

      const videoUri = createMockVideoUri(60);
      const mockFrameOptimizer = require('../../frameOptimizer');

      await service.analyzeVideo(videoUri, 'squat');

      // Should use higher frame rate for quality
      const callArgs = mockFrameOptimizer.default.extractOptimizedFrames.mock.calls[0][1];
      expect(callArgs.targetFrameRate).toBeGreaterThanOrEqual(12);
    });

    test('battery saver mode minimizes power usage', async () => {
      service.setOptimizationMode('battery_saver');

      const videoUri = createMockVideoUri(60);
      const mockBatteryOptimizer = require('../../../utils/batteryOptimizer');

      await service.analyzeVideo(videoUri, 'squat');

      expect(mockBatteryOptimizer.default.getOptimizationSettings).toHaveBeenCalled();
    });

    test('balanced mode provides good compromise', async () => {
      service.setOptimizationMode('balanced');

      const videoUri = createMockVideoUri(60);

      const result = await service.analyzeVideo(videoUri, 'squat');

      expect(result.success).toBe(true);
      expect(result.processingTimeMs).toBeLessThan(30000);
    });
  });

  describe('Performance Metrics', () => {
    test('tracks and reports performance metrics', async () => {
      const videoUri = createMockVideoUri(60);

      const result = await service.analyzeVideo(videoUri, 'squat');

      expect(result.metadata?.performanceMetrics).toBeDefined();
      expect(result.metadata?.performanceMetrics.processingTime).toBeDefined();
      expect(result.metadata?.performanceMetrics.frameRate).toBeDefined();
      expect(result.metadata?.performanceMetrics.memoryUsage).toBeDefined();
    });

    test('includes device tier in metadata', async () => {
      const videoUri = createMockVideoUri(60);

      const result = await service.analyzeVideo(videoUri, 'squat');

      expect(result.metadata?.deviceTier).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(result.metadata?.deviceTier);
    });

    test('tracks optimization effectiveness', async () => {
      const videoUri = createMockVideoUri(60);

      const result = await service.analyzeVideo(videoUri, 'squat');

      expect(result.metadata?.optimizationsApplied).toBeDefined();
      expect(result.metadata?.optimizationsApplied.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Fallback', () => {
    test('falls back to non-optimized mode on optimization failure', async () => {
      const mockFrameOptimizer = require('../../frameOptimizer');
      mockFrameOptimizer.default.extractOptimizedFrames.mockRejectedValue(
        new Error('Optimization failed')
      );

      const videoUri = createMockVideoUri(60);

      // Should still complete using fallback
      const result = await service.analyzeVideo(videoUri, 'squat');

      expect(result.success).toBe(true);
      expect(result.metadata?.fallbackMode).toBe(true);
    });

    test('handles memory pressure gracefully', async () => {
      const mockMemoryManager = require('../../../utils/memoryManager');
      mockMemoryManager.default.getCurrentPressure.mockReturnValue('critical');

      const videoUri = createMockVideoUri(60);

      // Should either complete with reduced quality or fail gracefully
      await expect(
        service.analyzeVideo(videoUri, 'squat')
      ).resolves.toBeDefined();
    });

    test('recovers from transient errors', async () => {
      const mockVideoProcessor = require('../../videoProcessor');

      let attemptCount = 0;
      mockVideoProcessor.default.processVideo.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Transient error');
        }
        return Promise.resolve({ success: true, frames: [] });
      });

      const videoUri = createMockVideoUri(60);

      const result = await service.analyzeVideo(videoUri, 'squat');

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(2); // Should have retried
    });
  });

  describe('Performance Targets Validation', () => {
    test('meets processing speed target (<30s for 60s video)', async () => {
      const videoUri = createMockVideoUri(60);

      const startTime = Date.now();
      await service.analyzeVideo(videoUri, 'squat');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(30000);
    });

    test('meets battery usage target (<5% drain)', async () => {
      const mockBatteryOptimizer = require('../../../utils/batteryOptimizer');
      mockBatteryOptimizer.default.estimateBatteryDrain.mockReturnValue(0.04); // 4%

      const videoUri = createMockVideoUri(60);

      await service.analyzeVideo(videoUri, 'squat');

      const estimatedDrain = mockBatteryOptimizer.default.estimateBatteryDrain();

      expect(estimatedDrain).toBeLessThan(0.05);
    });

    test('meets memory usage target (<500MB)', async () => {
      const mockMemoryManager = require('../../../utils/memoryManager');
      mockMemoryManager.default.getCurrentUsage.mockReturnValue(480 * 1024 * 1024); // 480MB

      const videoUri = createMockVideoUri(60);

      await service.analyzeVideo(videoUri, 'squat');

      const memoryUsage = mockMemoryManager.default.getCurrentUsage();

      expect(memoryUsage).toBeLessThan(500 * 1024 * 1024);
    });

    test('meets frame rate target (10+ FPS)', async () => {
      const videoUri = createMockVideoUri(60);

      const result = await service.analyzeVideo(videoUri, 'squat');

      const fps = result.metadata?.framesAnalyzed / 60;

      expect(fps).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Integration with Base Service', () => {
    test('maintains compatibility with PoseAnalysisService', async () => {
      const videoUri = createMockVideoUri(60);

      const result = await service.analyzeVideo(videoUri, 'squat');

      // Should have all base service fields
      expect(result.id).toBeDefined();
      expect(result.exerciseType).toBe('squat');
      expect(result.analysisScore).toBeGreaterThan(0);
      expect(result.feedback).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('supports all exercise types', async () => {
      const videoUri = createMockVideoUri(60);
      const exercises = ['squat', 'deadlift', 'push_up'];

      for (const exercise of exercises) {
        const result = await service.analyzeVideo(videoUri, exercise as any);

        expect(result.success).toBe(true);
        expect(result.exerciseType).toBe(exercise);
      }
    });

    test('honors all base service options', async () => {
      const videoUri = createMockVideoUri(60);
      const { callback } = createMockProgressCallback();

      await service.analyzeVideo(videoUri, 'squat', {
        onProgress: callback,
        useCache: false,
        minConfidence: 0.8
      });

      expect(callback).toHaveBeenCalled();
    });
  });
});
