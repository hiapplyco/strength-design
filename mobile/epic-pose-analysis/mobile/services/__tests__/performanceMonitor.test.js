/**
 * Performance Monitor Service Test Suite
 * Tests for real-time performance tracking and device profiling
 */

import PerformanceMonitor from '../performanceMonitor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';

// Mock data
const mockDeviceInfo = {
  brand: 'Apple',
  modelName: 'iPhone 13',
  osVersion: '17.0',
  totalMemory: 4294967296, // 4GB
  supportedCpuArchitectures: ['arm64'],
  platformApiLevel: null
};

const mockLowEndDevice = {
  ...mockDeviceInfo,
  totalMemory: 2147483648, // 2GB
  modelName: 'iPhone 8'
};

const mockHighEndDevice = {
  ...mockDeviceInfo,
  totalMemory: 8589934592, // 8GB
  modelName: 'iPhone 15 Pro'
};

describe('PerformanceMonitor', () => {
  let monitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    jest.clearAllMocks();

    // Mock Device properties
    Device.brand = mockDeviceInfo.brand;
    Device.modelName = mockDeviceInfo.modelName;
    Device.osVersion = mockDeviceInfo.osVersion;
    Device.totalMemory = mockDeviceInfo.totalMemory;
    Device.supportedCpuArchitectures = mockDeviceInfo.supportedCpuArchitectures;

    // Mock Battery functions
    Battery.getBatteryLevelAsync.mockResolvedValue(0.8);
    Battery.getBatteryStateAsync.mockResolvedValue(2); // CHARGING
  });

  describe('Initialization', () => {
    test('initializes successfully with default configuration', async () => {
      const result = await monitor.initialize();

      expect(result.success).toBe(true);
      expect(result.deviceTier).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(result.deviceTier);
    });

    test('loads saved alert thresholds from storage', async () => {
      const customThresholds = {
        processingTime: 25000,
        memoryUsage: 400,
        batteryDrain: 4
      };

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(customThresholds));

      await monitor.initialize();

      expect(monitor.alertThresholds.processingTime).toBe(25000);
      expect(monitor.alertThresholds.memoryUsage).toBe(400);
      expect(monitor.alertThresholds.batteryDrain).toBe(4);
    });

    test('handles initialization failure gracefully', async () => {
      AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await monitor.initialize();

      expect(result.success).toBe(true); // Should still succeed with defaults
      expect(result.deviceTier).toBeDefined();
    });

    test('sets up battery monitoring during initialization', async () => {
      await monitor.initialize();

      expect(Battery.getBatteryLevelAsync).toHaveBeenCalled();
      expect(Battery.getBatteryStateAsync).toHaveBeenCalled();
    });
  });

  describe('Device Profiling', () => {
    test('correctly identifies high-end device', async () => {
      Device.totalMemory = mockHighEndDevice.totalMemory;

      const tier = await monitor.profileDevice();

      expect(tier).toBe('high');
      expect(monitor.metrics.performanceTier).toBe('high');
    });

    test('correctly identifies medium-end device', async () => {
      Device.totalMemory = mockDeviceInfo.totalMemory; // 4GB

      const tier = await monitor.profileDevice();

      expect(tier).toBe('medium');
      expect(monitor.metrics.performanceTier).toBe('medium');
    });

    test('correctly identifies low-end device', async () => {
      Device.totalMemory = mockLowEndDevice.totalMemory; // 2GB

      const tier = await monitor.profileDevice();

      expect(tier).toBe('low');
      expect(monitor.metrics.performanceTier).toBe('low');
    });

    test('adjusts to low tier for old iOS versions', async () => {
      Device.totalMemory = mockDeviceInfo.totalMemory; // Would be medium
      Device.osVersion = '13.0'; // Old iOS version

      const tier = await monitor.profileDevice();

      expect(tier).toBe('low');
    });

    test('saves device profile to storage', async () => {
      await monitor.profileDevice();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@device_performance_profile',
        expect.stringContaining('"performanceTier"')
      );
    });

    test('falls back to medium tier on profiling error', async () => {
      Device.totalMemory = undefined;

      const tier = await monitor.profileDevice();

      expect(tier).toBe('medium');
      expect(monitor.metrics.performanceTier).toBe('medium');
    });
  });

  describe('Alert Thresholds', () => {
    test('adjusts thresholds for low-end devices', async () => {
      monitor.adjustThresholdsForTier('low');

      expect(monitor.alertThresholds.processingTime).toBe(45000); // 45s
      expect(monitor.alertThresholds.memoryUsage).toBe(300); // 300MB
      expect(monitor.alertThresholds.frameRate).toBe(5); // 5fps
    });

    test('adjusts thresholds for high-end devices', async () => {
      monitor.adjustThresholdsForTier('high');

      expect(monitor.alertThresholds.processingTime).toBe(20000); // 20s
      expect(monitor.alertThresholds.memoryUsage).toBe(800); // 800MB
      expect(monitor.alertThresholds.frameRate).toBe(15); // 15fps
    });

    test('keeps default thresholds for medium-end devices', async () => {
      const defaultProcessingTime = monitor.alertThresholds.processingTime;

      monitor.adjustThresholdsForTier('medium');

      expect(monitor.alertThresholds.processingTime).toBe(defaultProcessingTime);
    });
  });

  describe('Session Monitoring', () => {
    test('starts monitoring session with video info', () => {
      const videoInfo = { uri: 'file:///video.mp4', duration: 60 };

      monitor.startSession(videoInfo);

      expect(monitor.isMonitoring).toBe(true);
      expect(monitor.metrics.sessionStart).toBeDefined();
      expect(monitor.metrics.videoInfo).toEqual(videoInfo);
    });

    test('resets metrics when starting new session', () => {
      monitor.metrics.framesProcessed = 100;
      monitor.metrics.errors = ['error1', 'error2'];

      monitor.startSession();

      expect(monitor.metrics.framesProcessed).toBe(0);
      expect(monitor.metrics.errors).toHaveLength(0);
    });

    test('starts processing tracking with total frames', () => {
      monitor.startProcessing(300);

      expect(monitor.metrics.processingStartTime).toBeDefined();
      expect(monitor.metrics.totalFrames).toBe(300);
    });

    test('ends processing and calculates duration', () => {
      monitor.startProcessing(300);
      const startTime = monitor.metrics.processingStartTime;

      // Simulate 5 seconds of processing
      jest.advanceTimersByTime(5000);

      monitor.endProcessing();

      expect(monitor.metrics.processingEndTime).toBeGreaterThan(startTime);
    });
  });

  describe('Frame Processing Tracking', () => {
    beforeEach(() => {
      monitor.startSession();
      monitor.startProcessing(100);
    });

    test('records successful frame processing', () => {
      monitor.recordFrameProcessing(0, 150, true);

      expect(monitor.metrics.frameProcessingTimes).toHaveLength(1);
      expect(monitor.metrics.framesProcessed).toBe(1);
    });

    test('records failed frame processing', () => {
      monitor.recordFrameProcessing(0, 150, false);

      expect(monitor.metrics.frameProcessingTimes).toHaveLength(1);
      expect(monitor.metrics.framesProcessed).toBe(0); // Not incremented
    });

    test('detects slow frame processing', () => {
      const recordWarningSpy = jest.spyOn(monitor, 'recordWarning');

      monitor.recordFrameProcessing(0, 1500, true); // 1.5 seconds - slow

      expect(recordWarningSpy).toHaveBeenCalledWith(
        'SLOW_FRAME',
        expect.objectContaining({ processingTime: 1500 })
      );
    });

    test('calculates current FPS correctly', () => {
      // Record 10 frames over ~1 second
      const baseTime = Date.now();
      for (let i = 0; i < 10; i++) {
        jest.spyOn(Date, 'now').mockReturnValue(baseTime + i * 100);
        monitor.recordFrameProcessing(i, 100, true);
      }

      const fps = monitor.calculateCurrentFPS();

      expect(fps).toBeGreaterThan(9);
      expect(fps).toBeLessThan(11); // ~10 FPS
    });

    test('detects low FPS condition', () => {
      monitor.alertThresholds.frameRate = 10;
      const recordWarningSpy = jest.spyOn(monitor, 'recordWarning');

      // Record frames at low rate (2 FPS)
      const baseTime = Date.now();
      for (let i = 0; i < 5; i++) {
        jest.spyOn(Date, 'now').mockReturnValue(baseTime + i * 500);
        monitor.recordFrameProcessing(i, 100, true);
      }

      expect(recordWarningSpy).toHaveBeenCalledWith(
        'LOW_FPS',
        expect.objectContaining({ currentFPS: expect.any(Number) })
      );
    });
  });

  describe('Memory Monitoring', () => {
    beforeEach(() => {
      monitor.startSession();
    });

    test('starts memory monitoring interval', () => {
      jest.useFakeTimers();
      monitor.startMemoryMonitoring();

      expect(monitor.memoryCheckInterval).toBeDefined();

      jest.useRealTimers();
    });

    test('records memory usage within limits', () => {
      const memoryData = {
        used: 250, // 250MB
        available: 2000,
        timestamp: Date.now()
      };

      monitor.recordMemoryUsage(memoryData);

      expect(monitor.metrics.memoryUsage).toContainEqual(memoryData);
    });

    test('detects high memory usage', () => {
      const recordWarningSpy = jest.spyOn(monitor, 'recordWarning');
      monitor.alertThresholds.memoryUsage = 500;

      const memoryData = {
        used: 600, // 600MB - exceeds threshold
        available: 2000,
        timestamp: Date.now()
      };

      monitor.recordMemoryUsage(memoryData);

      expect(recordWarningSpy).toHaveBeenCalledWith(
        'HIGH_MEMORY',
        expect.objectContaining({ used: 600 })
      );
    });

    test('limits memory samples to last 100 entries', () => {
      // Add 150 memory samples
      for (let i = 0; i < 150; i++) {
        monitor.recordMemoryUsage({
          used: 200 + i,
          available: 2000,
          timestamp: Date.now()
        });
      }

      expect(monitor.metrics.memoryUsage).toHaveLength(100);
    });

    test('stops memory monitoring on cleanup', () => {
      jest.useFakeTimers();
      monitor.startMemoryMonitoring();

      const intervalId = monitor.memoryCheckInterval;
      monitor.stopMonitoring();

      expect(monitor.memoryCheckInterval).toBeNull();

      jest.useRealTimers();
    });
  });

  describe('Battery Monitoring', () => {
    test('records initial battery level', async () => {
      Battery.getBatteryLevelAsync.mockResolvedValue(0.85);

      await monitor.setupBatteryMonitoring();

      expect(monitor.metrics.batteryLevel.start).toBe(0.85);
    });

    test('calculates battery drain during session', async () => {
      await monitor.setupBatteryMonitoring();
      monitor.metrics.batteryLevel.start = 0.85;
      monitor.metrics.batteryLevel.end = 0.81;

      const drain = monitor.calculateBatteryDrain();

      expect(drain).toBeCloseTo(4.7, 1); // ~4.7% drain
    });

    test('detects excessive battery drain', () => {
      const recordWarningSpy = jest.spyOn(monitor, 'recordWarning');
      monitor.alertThresholds.batteryDrain = 5;

      monitor.metrics.batteryLevel.start = 0.85;
      monitor.metrics.batteryLevel.end = 0.78;

      monitor.checkBatteryDrain();

      expect(recordWarningSpy).toHaveBeenCalledWith(
        'HIGH_BATTERY_DRAIN',
        expect.objectContaining({ drain: expect.any(Number) })
      );
    });
  });

  describe('Performance Metrics', () => {
    test('generates comprehensive performance summary', () => {
      monitor.startSession({ uri: 'file:///video.mp4', duration: 60 });
      monitor.startProcessing(300);

      // Simulate processing
      for (let i = 0; i < 10; i++) {
        monitor.recordFrameProcessing(i, 150, true);
      }

      monitor.endProcessing();

      const summary = monitor.getPerformanceSummary();

      expect(summary).toHaveProperty('processingDuration');
      expect(summary).toHaveProperty('averageFrameTime');
      expect(summary).toHaveProperty('framesPerSecond');
      expect(summary).toHaveProperty('memoryStats');
      expect(summary).toHaveProperty('batteryDrain');
    });

    test('calculates average frame processing time', () => {
      monitor.metrics.frameProcessingTimes = [
        { processingTime: 100 },
        { processingTime: 150 },
        { processingTime: 200 }
      ];

      const avgTime = monitor.getAverageFrameTime();

      expect(avgTime).toBe(150);
    });

    test('identifies performance bottlenecks', () => {
      // Simulate slow processing
      for (let i = 0; i < 10; i++) {
        monitor.recordFrameProcessing(i, 1500, true); // Slow frames
      }

      // Simulate high memory
      monitor.recordMemoryUsage({ used: 600, available: 1000, timestamp: Date.now() });

      const bottlenecks = monitor.identifyBottlenecks();

      expect(bottlenecks).toContain('SLOW_PROCESSING');
      expect(bottlenecks).toContain('HIGH_MEMORY');
    });
  });

  describe('Error Handling', () => {
    test('handles battery API failures gracefully', async () => {
      Battery.getBatteryLevelAsync.mockRejectedValue(new Error('Battery API error'));

      const result = await monitor.setupBatteryMonitoring();

      expect(result).toBeNull();
      expect(monitor.metrics.batteryLevel.start).toBeNull();
    });

    test('continues monitoring after non-critical errors', () => {
      monitor.startSession();

      expect(() => {
        monitor.recordMemoryUsage(null); // Invalid data
      }).not.toThrow();

      expect(monitor.isMonitoring).toBe(true);
    });
  });

  describe('Cleanup', () => {
    test('stops all monitoring on cleanup', () => {
      monitor.startSession();
      monitor.startMemoryMonitoring();

      monitor.stopMonitoring();

      expect(monitor.isMonitoring).toBe(false);
      expect(monitor.memoryCheckInterval).toBeNull();
    });

    test('resets metrics on cleanup', () => {
      monitor.metrics.framesProcessed = 100;
      monitor.metrics.errors = ['error'];

      monitor.reset();

      expect(monitor.metrics.framesProcessed).toBe(0);
      expect(monitor.metrics.errors).toHaveLength(0);
    });
  });
});
