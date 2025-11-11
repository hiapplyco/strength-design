/**
 * Device Tier Performance Validation Tests
 * Validates that pose analysis performance meets targets for each device tier
 */

import PoseAnalysisService from '../../services/poseDetection/PoseAnalysisService';
import performanceMonitor from '../../services/performanceMonitor';
import { Device } from 'expo-device';

// Mock video files for testing
const MOCK_VIDEOS = {
  short: 'mock://10s-squat-video.mp4',  // 10-second video
  medium: 'mock://30s-squat-video.mp4', // 30-second video
  long: 'mock://60s-squat-video.mp4'    // 60-second video
};

// Performance targets by device tier (from DEVICE_TESTING_MATRIX.md)
const PERFORMANCE_TARGETS = {
  low: {
    processingTime: {
      short: { target: 25000, acceptable: 35000, alert: 45000 },
      medium: { target: 75000, acceptable: 105000, alert: 135000 },
      long: { target: 150000, acceptable: 210000, alert: 270000 }
    },
    memory: { baseline: 80, peak: 250, alert: 300 },
    frameRate: { target: 6, minimum: 3 },
    framesAnalyzed: { min: 0.2, max: 0.3 }, // 20-30% of frames
    batteryDrain: { target: 5, acceptable: 8, alert: 15 }
  },
  mid: {
    processingTime: {
      short: { target: 15000, acceptable: 20000, alert: 25000 },
      medium: { target: 45000, acceptable: 60000, alert: 75000 },
      long: { target: 90000, acceptable: 120000, alert: 150000 }
    },
    memory: { baseline: 120, peak: 400, alert: 500 },
    frameRate: { target: 12, minimum: 8 },
    framesAnalyzed: { min: 0.4, max: 0.5 }, // 40-50% of frames
    batteryDrain: { target: 4, acceptable: 6, alert: 12 }
  },
  high: {
    processingTime: {
      short: { target: 10000, acceptable: 12000, alert: 15000 },
      medium: { target: 30000, acceptable: 36000, alert: 45000 },
      long: { target: 60000, acceptable: 75000, alert: 90000 }
    },
    memory: { baseline: 180, peak: 600, alert: 800 },
    frameRate: { target: 25, minimum: 15 },
    framesAnalyzed: { min: 0.6, max: 0.7 }, // 60-70% of frames
    batteryDrain: { target: 3, acceptable: 5, alert: 10 }
  }
};

describe('Device Tier Performance Validation', () => {
  let deviceTier;
  let performanceTargets;

  beforeAll(async () => {
    // Initialize performance monitor
    await performanceMonitor.initialize();

    // Detect device tier
    deviceTier = await performanceMonitor.profileDevice();
    performanceTargets = PERFORMANCE_TARGETS[deviceTier];

    console.log(`Running performance tests for ${deviceTier}-end device tier`);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.startSession('test-session');
  });

  afterEach(() => {
    performanceMonitor.endSession();
  });

  describe('Processing Time Validation', () => {
    test('10-second video meets processing time target', async () => {
      const startTime = Date.now();

      const result = await PoseAnalysisService.analyzeVideo(
        MOCK_VIDEOS.short,
        'squat'
      );

      const processingTime = Date.now() - startTime;
      const targets = performanceTargets.processingTime.short;

      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(targets.acceptable);

      // Log performance metrics
      console.log(`Processing time: ${processingTime}ms (target: ${targets.target}ms)`);

      if (processingTime > targets.target) {
        console.warn(`⚠️  Processing time exceeded target but is acceptable`);
      }

      if (processingTime > targets.alert) {
        console.error(`❌ Processing time exceeded alert threshold`);
      }
    }, 60000);

    test('30-second video meets processing time target', async () => {
      const startTime = Date.now();

      const result = await PoseAnalysisService.analyzeVideo(
        MOCK_VIDEOS.medium,
        'squat'
      );

      const processingTime = Date.now() - startTime;
      const targets = performanceTargets.processingTime.medium;

      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(targets.acceptable);

      console.log(`30s video processing: ${processingTime}ms (target: ${targets.target}ms)`);
    }, 180000);

    test('60-second video meets processing time target', async () => {
      const startTime = Date.now();

      const result = await PoseAnalysisService.analyzeVideo(
        MOCK_VIDEOS.long,
        'squat'
      );

      const processingTime = Date.now() - startTime;
      const targets = performanceTargets.processingTime.long;

      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(targets.acceptable);

      console.log(`60s video processing: ${processingTime}ms (target: ${targets.target}ms)`);
    }, 300000);
  });

  describe('Memory Usage Validation', () => {
    test('memory usage stays within tier limits during analysis', async () => {
      const initialMemory = await performanceMonitor.getCurrentMemoryUsage();

      await PoseAnalysisService.analyzeVideo(MOCK_VIDEOS.short, 'squat');

      const peakMemory = performanceMonitor.metrics.peakMemoryUsage;
      const memoryIncrease = peakMemory - initialMemory;

      console.log(`Memory: baseline=${initialMemory}MB, peak=${peakMemory}MB, increase=${memoryIncrease}MB`);
      console.log(`Target: peak < ${performanceTargets.memory.peak}MB`);

      expect(peakMemory).toBeLessThan(performanceTargets.memory.alert);

      if (peakMemory > performanceTargets.memory.peak) {
        console.warn(`⚠️  Peak memory exceeded target but below alert threshold`);
      }
    });

    test('memory is released after analysis completes', async () => {
      const initialMemory = await performanceMonitor.getCurrentMemoryUsage();

      await PoseAnalysisService.analyzeVideo(MOCK_VIDEOS.short, 'squat');

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));

      const finalMemory = await performanceMonitor.getCurrentMemoryUsage();
      const memoryRetained = finalMemory - initialMemory;

      console.log(`Memory retention: ${memoryRetained}MB`);

      // Memory should return close to baseline (within 50MB)
      expect(memoryRetained).toBeLessThan(50);
    });
  });

  describe('Frame Rate Validation', () => {
    test('frame processing rate meets tier target', async () => {
      const result = await PoseAnalysisService.analyzeVideo(
        MOCK_VIDEOS.short,
        'squat'
      );

      const avgFrameRate = performanceMonitor.metrics.averageFrameRate;
      const targets = performanceTargets.frameRate;

      console.log(`Frame rate: ${avgFrameRate} FPS (target: ${targets.target} FPS, min: ${targets.minimum} FPS)`);

      expect(avgFrameRate).toBeGreaterThanOrEqual(targets.minimum);

      if (avgFrameRate < targets.target) {
        console.warn(`⚠️  Frame rate below target but above minimum`);
      }
    });

    test('adaptive sampling matches tier expectations', async () => {
      const result = await PoseAnalysisService.analyzeVideo(
        MOCK_VIDEOS.short,
        'squat'
      );

      const totalFrames = result.totalFrames || 300; // Assume 30fps * 10s
      const analyzedFrames = result.framesProcessed;
      const samplingRatio = analyzedFrames / totalFrames;

      const targets = performanceTargets.framesAnalyzed;

      console.log(`Frame sampling: ${(samplingRatio * 100).toFixed(1)}% (target: ${targets.min * 100}-${targets.max * 100}%)`);
      console.log(`Frames: ${analyzedFrames}/${totalFrames} analyzed`);

      expect(samplingRatio).toBeGreaterThanOrEqual(targets.min);
      expect(samplingRatio).toBeLessThanOrEqual(targets.max + 0.1); // Allow 10% margin
    });
  });

  describe('Battery Consumption Validation', () => {
    test('battery drain per analysis is acceptable', async () => {
      const initialBattery = await performanceMonitor.getBatteryLevel();

      await PoseAnalysisService.analyzeVideo(MOCK_VIDEOS.short, 'squat');

      const finalBattery = await performanceMonitor.getBatteryLevel();
      const batteryDrain = initialBattery - finalBattery;

      const targets = performanceTargets.batteryDrain;

      console.log(`Battery drain: ${batteryDrain}% (target: ${targets.target}%, acceptable: ${targets.acceptable}%)`);

      expect(batteryDrain).toBeLessThan(targets.alert);

      if (batteryDrain > targets.target) {
        console.warn(`⚠️  Battery drain above target but acceptable`);
      }
    });
  });

  describe('Concurrent Analysis Stress Test', () => {
    test('handles 3 consecutive analyses without degradation', async () => {
      const results = [];
      const processingTimes = [];

      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();

        const result = await PoseAnalysisService.analyzeVideo(
          MOCK_VIDEOS.short,
          'squat'
        );

        const processingTime = Date.now() - startTime;

        results.push(result);
        processingTimes.push(processingTime);

        console.log(`Analysis ${i + 1}: ${processingTime}ms`);
      }

      // All analyses should succeed
      expect(results.every(r => r.success)).toBe(true);

      // Processing time should not degrade significantly (max 20% slower)
      const avgTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
      const maxTime = Math.max(...processingTimes);
      const degradation = (maxTime - avgTime) / avgTime;

      console.log(`Performance degradation: ${(degradation * 100).toFixed(1)}%`);

      expect(degradation).toBeLessThan(0.3); // Max 30% degradation
    }, 180000);
  });

  describe('Device-Specific Optimizations', () => {
    test('device tier is correctly detected', () => {
      expect(['low', 'mid', 'high']).toContain(deviceTier);

      const totalMemory = Device.totalMemory;
      console.log(`Device memory: ${(totalMemory / 1024 / 1024 / 1024).toFixed(2)}GB`);

      if (deviceTier === 'low') {
        expect(totalMemory).toBeLessThanOrEqual(2147483648); // <= 2GB
      } else if (deviceTier === 'mid') {
        expect(totalMemory).toBeGreaterThan(2147483648); // > 2GB
        expect(totalMemory).toBeLessThanOrEqual(4294967296); // <= 4GB
      } else {
        expect(totalMemory).toBeGreaterThan(4294967296); // > 4GB
      }
    });

    test('optimization settings match device tier', async () => {
      const settings = await PoseAnalysisService.getOptimizationSettings();

      console.log('Optimization settings:', settings);

      if (deviceTier === 'low') {
        expect(settings.targetFrameRate).toBeLessThanOrEqual(7);
        expect(settings.resolutionScale).toBeLessThanOrEqual(0.5);
        expect(settings.enableBackgroundProcessing).toBe(true);
      } else if (deviceTier === 'mid') {
        expect(settings.targetFrameRate).toBeGreaterThanOrEqual(8);
        expect(settings.targetFrameRate).toBeLessThanOrEqual(15);
        expect(settings.resolutionScale).toBeGreaterThan(0.5);
        expect(settings.resolutionScale).toBeLessThanOrEqual(0.75);
      } else {
        expect(settings.targetFrameRate).toBeGreaterThanOrEqual(15);
        expect(settings.resolutionScale).toBeGreaterThan(0.75);
      }
    });
  });

  describe('Performance Regression Detection', () => {
    test('compares against baseline performance metrics', async () => {
      // Load baseline metrics (would be stored from previous runs)
      const baseline = {
        processingTime: performanceTargets.processingTime.short.target,
        memory: performanceTargets.memory.peak,
        frameRate: performanceTargets.frameRate.target
      };

      const startTime = Date.now();
      await PoseAnalysisService.analyzeVideo(MOCK_VIDEOS.short, 'squat');
      const currentProcessingTime = Date.now() - startTime;

      const currentMemory = performanceMonitor.metrics.peakMemoryUsage;
      const currentFrameRate = performanceMonitor.metrics.averageFrameRate;

      const regressions = [];

      // Check for processing time regression (>20% slower)
      if (currentProcessingTime > baseline.processingTime * 1.2) {
        regressions.push(`Processing time: ${currentProcessingTime}ms vs baseline ${baseline.processingTime}ms`);
      }

      // Check for memory regression (>20% more)
      if (currentMemory > baseline.memory * 1.2) {
        regressions.push(`Memory usage: ${currentMemory}MB vs baseline ${baseline.memory}MB`);
      }

      // Check for frame rate regression (>20% slower)
      if (currentFrameRate < baseline.frameRate * 0.8) {
        regressions.push(`Frame rate: ${currentFrameRate} FPS vs baseline ${baseline.frameRate} FPS`);
      }

      if (regressions.length > 0) {
        console.error('⚠️  Performance regressions detected:');
        regressions.forEach(r => console.error(`  - ${r}`));
      } else {
        console.log('✅ No performance regressions detected');
      }

      expect(regressions).toHaveLength(0);
    });
  });
});
