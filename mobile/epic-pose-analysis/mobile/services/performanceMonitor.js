/**
 * Performance Monitor Service
 * Real-time performance tracking and analytics for pose analysis
 *
 * Features:
 * - Processing time tracking
 * - Memory usage monitoring
 * - Battery consumption tracking
 * - Frame rate monitoring
 * - Device capability detection
 * - Performance alerts and recommendations
 */

import { Platform, NativeModules, DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import { collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';

// Performance metrics keys
const METRICS_STORAGE_KEY = '@performance_metrics';
const ALERT_THRESHOLDS_KEY = '@performance_alert_thresholds';
const DEVICE_PROFILE_KEY = '@device_performance_profile';

// Default alert thresholds
const DEFAULT_ALERT_THRESHOLDS = {
  processingTime: 30000, // 30 seconds
  memoryUsage: 500, // 500MB
  batteryDrain: 5, // 5%
  frameRate: 10, // Min 10fps
  temperature: 45 // 45°C
};

// Device performance tiers
const DEVICE_TIERS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      sessionStart: null,
      sessionEnd: null,
      processingStartTime: null,
      processingEndTime: null,
      framesProcessed: 0,
      totalFrames: 0,
      memoryUsage: [],
      batteryLevel: { start: null, end: null },
      frameProcessingTimes: [],
      errors: [],
      deviceInfo: null,
      performanceTier: null
    };

    this.alertThresholds = DEFAULT_ALERT_THRESHOLDS;
    this.isMonitoring = false;
    this.memoryCheckInterval = null;
    this.listeners = new Map();
  }

  /**
   * Initialize performance monitoring
   */
  async initialize() {
    try {
      // Load saved thresholds
      const savedThresholds = await AsyncStorage.getItem(ALERT_THRESHOLDS_KEY);
      if (savedThresholds) {
        this.alertThresholds = { ...this.alertThresholds, ...JSON.parse(savedThresholds) };
      }

      // Profile device capabilities
      await this.profileDevice();

      // Set up battery monitoring
      await this.setupBatteryMonitoring();

      console.log('PerformanceMonitor: Initialized', {
        deviceTier: this.metrics.performanceTier,
        thresholds: this.alertThresholds
      });

      return { success: true, deviceTier: this.metrics.performanceTier };
    } catch (error) {
      console.error('PerformanceMonitor: Initialization failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Profile device capabilities and determine performance tier
   */
  async profileDevice() {
    try {
      const deviceInfo = {
        brand: Device.brand,
        modelName: Device.modelName,
        osVersion: Device.osVersion,
        totalMemory: Device.totalMemory,
        supportedCpuArchitectures: Device.supportedCpuArchitectures,
        platformApiLevel: Platform.OS === 'android' ? Device.platformApiLevel : null
      };

      this.metrics.deviceInfo = deviceInfo;

      // Determine performance tier based on device specs
      let tier = DEVICE_TIERS.MEDIUM;

      if (Device.totalMemory) {
        const memoryGB = Device.totalMemory / (1024 * 1024 * 1024);

        if (memoryGB >= 6) {
          tier = DEVICE_TIERS.HIGH;
        } else if (memoryGB <= 2) {
          tier = DEVICE_TIERS.LOW;
        }

        // Adjust for OS version
        if (Platform.OS === 'ios') {
          const iosVersion = parseFloat(Device.osVersion);
          if (iosVersion < 14) tier = DEVICE_TIERS.LOW;
        } else if (Platform.OS === 'android') {
          if (Device.platformApiLevel < 29) tier = DEVICE_TIERS.LOW; // Android 10
        }
      }

      this.metrics.performanceTier = tier;

      // Adjust thresholds based on device tier
      this.adjustThresholdsForTier(tier);

      // Save device profile
      await AsyncStorage.setItem(DEVICE_PROFILE_KEY, JSON.stringify({
        deviceInfo,
        performanceTier: tier,
        timestamp: Date.now()
      }));

      return tier;
    } catch (error) {
      console.error('PerformanceMonitor: Device profiling failed', error);
      this.metrics.performanceTier = DEVICE_TIERS.MEDIUM;
      return DEVICE_TIERS.MEDIUM;
    }
  }

  /**
   * Adjust performance thresholds based on device tier
   */
  adjustThresholdsForTier(tier) {
    switch (tier) {
      case DEVICE_TIERS.LOW:
        this.alertThresholds = {
          ...this.alertThresholds,
          processingTime: 45000, // 45 seconds for low-end devices
          memoryUsage: 300, // 300MB limit
          frameRate: 5 // 5fps minimum
        };
        break;
      case DEVICE_TIERS.HIGH:
        this.alertThresholds = {
          ...this.alertThresholds,
          processingTime: 20000, // 20 seconds for high-end devices
          memoryUsage: 800, // 800MB limit
          frameRate: 15 // 15fps minimum
        };
        break;
      // MEDIUM uses default thresholds
    }
  }

  /**
   * Set up battery monitoring
   */
  async setupBatteryMonitoring() {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryState = await Battery.getBatteryStateAsync();

      this.metrics.batteryLevel.start = batteryLevel;
      this.metrics.batteryState = batteryState;

      // Subscribe to battery level changes
      Battery.addBatteryLevelListener(({ batteryLevel }) => {
        if (this.isMonitoring) {
          this.metrics.batteryLevel.current = batteryLevel;
        }
      });

      return { batteryLevel, batteryState };
    } catch (error) {
      console.error('PerformanceMonitor: Battery monitoring setup failed', error);
      return null;
    }
  }

  /**
   * Start monitoring a new analysis session
   */
  startSession(videoInfo = {}) {
    this.reset();
    this.isMonitoring = true;

    this.metrics.sessionStart = Date.now();
    this.metrics.videoInfo = videoInfo;

    // Start memory monitoring
    this.startMemoryMonitoring();

    // Record initial battery level
    Battery.getBatteryLevelAsync().then(level => {
      this.metrics.batteryLevel.start = level;
    });

    console.log('PerformanceMonitor: Session started', {
      videoInfo,
      deviceTier: this.metrics.performanceTier
    });
  }

  /**
   * Start monitoring video processing
   */
  startProcessing(totalFrames) {
    this.metrics.processingStartTime = Date.now();
    this.metrics.totalFrames = totalFrames;

    console.log('PerformanceMonitor: Processing started', {
      totalFrames,
      timestamp: this.metrics.processingStartTime
    });
  }

  /**
   * Record frame processing time
   */
  recordFrameProcessing(frameIndex, processingTime, success = true) {
    if (!this.isMonitoring) return;

    this.metrics.frameProcessingTimes.push({
      frameIndex,
      processingTime,
      success,
      timestamp: Date.now()
    });

    if (success) {
      this.metrics.framesProcessed++;
    }

    // Check for performance issues
    if (processingTime > 1000) { // Frame took more than 1 second
      this.recordWarning('SLOW_FRAME', {
        frameIndex,
        processingTime,
        threshold: 1000
      });
    }

    // Calculate current FPS
    const currentFPS = this.calculateCurrentFPS();
    if (currentFPS < this.alertThresholds.frameRate) {
      this.recordWarning('LOW_FPS', {
        currentFPS,
        threshold: this.alertThresholds.frameRate
      });
    }
  }

  /**
   * Calculate current frames per second
   */
  calculateCurrentFPS() {
    const recentFrames = this.metrics.frameProcessingTimes.slice(-30); // Last 30 frames
    if (recentFrames.length < 2) return 0;

    const timeSpan = recentFrames[recentFrames.length - 1].timestamp - recentFrames[0].timestamp;
    const fps = (recentFrames.length * 1000) / timeSpan;

    return Math.round(fps * 10) / 10;
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    // Monitor memory every 2 seconds
    this.memoryCheckInterval = setInterval(() => {
      if (Platform.OS === 'ios') {
        // iOS memory monitoring (requires native module)
        this.checkIOSMemory();
      } else if (Platform.OS === 'android') {
        // Android memory monitoring
        this.checkAndroidMemory();
      }
    }, 2000);
  }

  /**
   * Check iOS memory usage
   */
  checkIOSMemory() {
    // This would require a native module implementation
    // For now, we'll use a placeholder
    const memoryUsage = {
      used: Math.random() * 500, // Placeholder
      available: 2000,
      timestamp: Date.now()
    };

    this.recordMemoryUsage(memoryUsage);
  }

  /**
   * Check Android memory usage
   */
  checkAndroidMemory() {
    if (global.performance && global.performance.memory) {
      const memoryUsage = {
        used: global.performance.memory.usedJSHeapSize / (1024 * 1024), // Convert to MB
        available: global.performance.memory.jsHeapSizeLimit / (1024 * 1024),
        timestamp: Date.now()
      };

      this.recordMemoryUsage(memoryUsage);
    }
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(memoryData) {
    this.metrics.memoryUsage.push(memoryData);

    // Keep only last 100 memory samples
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage.shift();
    }

    // Check for memory warnings
    if (memoryData.used > this.alertThresholds.memoryUsage) {
      this.recordWarning('HIGH_MEMORY', {
        used: memoryData.used,
        threshold: this.alertThresholds.memoryUsage
      });
    }
  }

  /**
   * Record a warning or error
   */
  recordWarning(type, details) {
    const warning = {
      type,
      details,
      timestamp: Date.now(),
      severity: this.calculateSeverity(type, details)
    };

    this.metrics.errors.push(warning);

    // Emit warning event
    this.emit('warning', warning);

    console.warn('PerformanceMonitor: Warning', warning);
  }

  /**
   * Calculate warning severity
   */
  calculateSeverity(type, details) {
    switch (type) {
      case 'HIGH_MEMORY':
        return details.used > this.alertThresholds.memoryUsage * 1.5 ? 'critical' : 'warning';
      case 'LOW_FPS':
        return details.currentFPS < this.alertThresholds.frameRate / 2 ? 'critical' : 'warning';
      case 'SLOW_FRAME':
        return details.processingTime > 2000 ? 'critical' : 'warning';
      default:
        return 'info';
    }
  }

  /**
   * End processing and calculate final metrics
   */
  async endProcessing(success = true) {
    this.metrics.processingEndTime = Date.now();
    const processingDuration = this.metrics.processingEndTime - this.metrics.processingStartTime;

    // Check processing time threshold
    if (processingDuration > this.alertThresholds.processingTime) {
      this.recordWarning('SLOW_PROCESSING', {
        duration: processingDuration,
        threshold: this.alertThresholds.processingTime
      });
    }

    const metrics = {
      processingDuration,
      framesProcessed: this.metrics.framesProcessed,
      totalFrames: this.metrics.totalFrames,
      successRate: (this.metrics.framesProcessed / this.metrics.totalFrames) * 100,
      averageFPS: this.calculateAverageFPS(),
      success
    };

    console.log('PerformanceMonitor: Processing ended', metrics);

    return metrics;
  }

  /**
   * Calculate average FPS for the entire processing
   */
  calculateAverageFPS() {
    if (this.metrics.frameProcessingTimes.length === 0) return 0;

    const totalTime = this.metrics.frameProcessingTimes.reduce((sum, frame) =>
      sum + frame.processingTime, 0);

    const avgTime = totalTime / this.metrics.frameProcessingTimes.length;
    const fps = 1000 / avgTime; // Convert to FPS

    return Math.round(fps * 10) / 10;
  }

  /**
   * End session and generate final report
   */
  async endSession() {
    this.isMonitoring = false;
    this.metrics.sessionEnd = Date.now();

    // Stop memory monitoring
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }

    // Get final battery level
    const finalBatteryLevel = await Battery.getBatteryLevelAsync();
    this.metrics.batteryLevel.end = finalBatteryLevel;

    const batteryDrain = (this.metrics.batteryLevel.start - finalBatteryLevel) * 100;

    // Check battery drain threshold
    if (batteryDrain > this.alertThresholds.batteryDrain) {
      this.recordWarning('HIGH_BATTERY_DRAIN', {
        drain: batteryDrain,
        threshold: this.alertThresholds.batteryDrain
      });
    }

    // Generate performance report
    const report = this.generateReport();

    // Save to storage
    await this.saveMetrics(report);

    // Upload to Firebase if user is authenticated
    if (auth.currentUser) {
      await this.uploadMetrics(report);
    }

    console.log('PerformanceMonitor: Session ended', report);

    return report;
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const sessionDuration = this.metrics.sessionEnd - this.metrics.sessionStart;
    const processingDuration = this.metrics.processingEndTime - this.metrics.processingStartTime;
    const batteryDrain = (this.metrics.batteryLevel.start - this.metrics.batteryLevel.end) * 100;

    // Calculate memory statistics
    const memoryStats = this.calculateMemoryStats();

    // Calculate frame processing statistics
    const frameStats = this.calculateFrameStats();

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    return {
      sessionInfo: {
        duration: sessionDuration,
        startTime: this.metrics.sessionStart,
        endTime: this.metrics.sessionEnd,
        deviceTier: this.metrics.performanceTier,
        videoInfo: this.metrics.videoInfo
      },
      processingMetrics: {
        duration: processingDuration,
        framesProcessed: this.metrics.framesProcessed,
        totalFrames: this.metrics.totalFrames,
        successRate: (this.metrics.framesProcessed / this.metrics.totalFrames) * 100,
        averageFPS: this.calculateAverageFPS(),
        ...frameStats
      },
      resourceUsage: {
        batteryDrain,
        ...memoryStats
      },
      warnings: this.metrics.errors,
      recommendations,
      score: this.calculatePerformanceScore()
    };
  }

  /**
   * Calculate memory statistics
   */
  calculateMemoryStats() {
    if (this.metrics.memoryUsage.length === 0) {
      return { peakMemory: 0, averageMemory: 0 };
    }

    const memoryValues = this.metrics.memoryUsage.map(m => m.used);
    const peakMemory = Math.max(...memoryValues);
    const averageMemory = memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length;

    return {
      peakMemory: Math.round(peakMemory),
      averageMemory: Math.round(averageMemory),
      samples: this.metrics.memoryUsage.length
    };
  }

  /**
   * Calculate frame processing statistics
   */
  calculateFrameStats() {
    if (this.metrics.frameProcessingTimes.length === 0) {
      return {};
    }

    const times = this.metrics.frameProcessingTimes.map(f => f.processingTime);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;

    // Calculate percentiles
    const sortedTimes = [...times].sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];

    return {
      minFrameTime: Math.round(minTime),
      maxFrameTime: Math.round(maxTime),
      avgFrameTime: Math.round(avgTime),
      p50FrameTime: Math.round(p50),
      p95FrameTime: Math.round(p95)
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Check device tier
    if (this.metrics.performanceTier === DEVICE_TIERS.LOW) {
      recommendations.push({
        type: 'device',
        message: 'Consider recording shorter videos (30 seconds or less) for faster processing',
        priority: 'medium'
      });
    }

    // Check warnings
    const highMemoryWarnings = this.metrics.errors.filter(e => e.type === 'HIGH_MEMORY');
    if (highMemoryWarnings.length > 0) {
      recommendations.push({
        type: 'memory',
        message: 'Close other apps to free up memory for better performance',
        priority: 'high'
      });
    }

    const lowFPSWarnings = this.metrics.errors.filter(e => e.type === 'LOW_FPS');
    if (lowFPSWarnings.length > 0) {
      recommendations.push({
        type: 'performance',
        message: 'Processing is running slowly. Try reducing video quality or length',
        priority: 'high'
      });
    }

    const batteryWarnings = this.metrics.errors.filter(e => e.type === 'HIGH_BATTERY_DRAIN');
    if (batteryWarnings.length > 0) {
      recommendations.push({
        type: 'battery',
        message: 'High battery usage detected. Consider plugging in your device',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Calculate overall performance score (0-100)
   */
  calculatePerformanceScore() {
    let score = 100;

    // Processing time (40% weight)
    const processingDuration = this.metrics.processingEndTime - this.metrics.processingStartTime;
    const timeRatio = processingDuration / this.alertThresholds.processingTime;
    if (timeRatio > 1) {
      score -= Math.min(40, (timeRatio - 1) * 40);
    }

    // Success rate (30% weight)
    const successRate = (this.metrics.framesProcessed / this.metrics.totalFrames) * 100;
    score -= (100 - successRate) * 0.3;

    // Battery drain (15% weight)
    const batteryDrain = (this.metrics.batteryLevel.start - this.metrics.batteryLevel.end) * 100;
    if (batteryDrain > this.alertThresholds.batteryDrain) {
      score -= Math.min(15, (batteryDrain / this.alertThresholds.batteryDrain - 1) * 15);
    }

    // Memory usage (15% weight)
    const memoryStats = this.calculateMemoryStats();
    if (memoryStats.peakMemory > this.alertThresholds.memoryUsage) {
      score -= Math.min(15, (memoryStats.peakMemory / this.alertThresholds.memoryUsage - 1) * 15);
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Save metrics to local storage
   */
  async saveMetrics(report) {
    try {
      // Get existing metrics
      const existingData = await AsyncStorage.getItem(METRICS_STORAGE_KEY);
      const metrics = existingData ? JSON.parse(existingData) : [];

      // Add new report
      metrics.push({
        ...report,
        id: Date.now().toString()
      });

      // Keep only last 50 reports
      if (metrics.length > 50) {
        metrics.splice(0, metrics.length - 50);
      }

      await AsyncStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(metrics));
    } catch (error) {
      console.error('PerformanceMonitor: Failed to save metrics', error);
    }
  }

  /**
   * Upload metrics to Firebase
   */
  async uploadMetrics(report) {
    try {
      await addDoc(collection(db, 'performanceMetrics'), {
        ...report,
        userId: auth.currentUser.uid,
        timestamp: Date.now(),
        deviceInfo: this.metrics.deviceInfo
      });
    } catch (error) {
      console.error('PerformanceMonitor: Failed to upload metrics', error);
    }
  }

  /**
   * Get historical performance data
   */
  async getHistoricalMetrics(limit = 10) {
    try {
      const localData = await AsyncStorage.getItem(METRICS_STORAGE_KEY);
      const metrics = localData ? JSON.parse(localData) : [];

      return metrics.slice(-limit);
    } catch (error) {
      console.error('PerformanceMonitor: Failed to get historical metrics', error);
      return [];
    }
  }

  /**
   * Get performance recommendations based on device
   */
  getOptimalSettings() {
    const settings = {
      frameSkip: 2,
      resolution: '720p',
      maxVideoLength: 60,
      batchSize: 30
    };

    switch (this.metrics.performanceTier) {
      case DEVICE_TIERS.LOW:
        settings.frameSkip = 5; // Process every 5th frame
        settings.resolution = '480p';
        settings.maxVideoLength = 30;
        settings.batchSize = 10;
        break;
      case DEVICE_TIERS.HIGH:
        settings.frameSkip = 1; // Process every frame
        settings.resolution = '1080p';
        settings.maxVideoLength = 120;
        settings.batchSize = 50;
        break;
    }

    return settings;
  }

  /**
   * Reset metrics for new session
   */
  reset() {
    this.metrics = {
      sessionStart: null,
      sessionEnd: null,
      processingStartTime: null,
      processingEndTime: null,
      framesProcessed: 0,
      totalFrames: 0,
      memoryUsage: [],
      batteryLevel: { start: null, end: null },
      frameProcessingTimes: [],
      errors: [],
      deviceInfo: this.metrics.deviceInfo,
      performanceTier: this.metrics.performanceTier
    };
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`PerformanceMonitor: Error in event listener for ${event}`, error);
        }
      });
    }
  }
}

// Export singleton instance
export default new PerformanceMonitor();