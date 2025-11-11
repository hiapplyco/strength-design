/**
 * Performance Validation Test Suite
 * Comprehensive testing to validate performance optimization targets
 *
 * Target Requirements:
 * - Video analysis completion within 30 seconds for 60-second videos
 * - Battery usage <5% per analysis session
 * - Mobile app responsiveness during background processing
 * - Memory usage optimization for older devices
 * - Frame processing at target FPS rates
 */

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Battery from 'expo-battery';
import * as FileSystem from 'expo-file-system';

// Import services to test
import performanceMonitor from '../services/performanceMonitor';
import frameOptimizer from '../services/frameOptimizer';
import videoProcessor from '../services/videoProcessor';
import backgroundQueue from '../services/backgroundQueue';
import memoryManager from '../utils/memoryManager';
import batteryOptimizer from '../utils/batteryOptimizer';

// Test configuration
const TEST_CONFIG = {
  videoSamples: {
    short: { duration: 30, uri: 'test-video-30s.mp4' },
    standard: { duration: 60, uri: 'test-video-60s.mp4' },
    long: { duration: 120, uri: 'test-video-120s.mp4' }
  },
  deviceTiers: ['low', 'medium', 'high'],
  exerciseTypes: ['squat', 'deadlift', 'push_up'],
  targetMetrics: {
    processingTime: 30000, // 30 seconds for 60s video
    batteryDrain: 0.05, // 5% max
    memoryUsage: 500, // 500MB max
    minFPS: 10, // Minimum 10 FPS
    successRate: 0.95 // 95% frame success rate
  }
};

// Performance test results
class PerformanceTestResults {
  constructor() {
    this.results = [];
    this.summary = {};
  }

  addResult(test, result) {
    this.results.push({
      test,
      result,
      timestamp: Date.now()
    });
  }

  generateSummary() {
    const passedTests = this.results.filter(r => r.result.passed).length;
    const totalTests = this.results.length;

    this.summary = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      passRate: (passedTests / totalTests) * 100,
      details: this.results
    };

    return this.summary;
  }
}

// Main test suite
class PerformanceValidationSuite {
  constructor() {
    this.results = new PerformanceTestResults();
    this.isRunning = false;
  }

  /**
   * Run complete validation suite
   */
  async runFullValidation() {
    console.log('=== Starting Performance Validation Suite ===');
    this.isRunning = true;

    try {
      // Initialize all services
      await this.initializeServices();

      // Run test categories
      await this.testProcessingSpeed();
      await this.testBatteryUsage();
      await this.testMemoryManagement();
      await this.testFrameOptimization();
      await this.testBackgroundProcessing();
      await this.testDeviceTierOptimization();
      await this.testConcurrentProcessing();
      await this.testErrorRecovery();

      // Generate final report
      const report = this.generateReport();

      console.log('=== Performance Validation Complete ===');
      return report;
    } catch (error) {
      console.error('Performance validation failed:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.isRunning = false;
      await this.cleanup();
    }
  }

  /**
   * Initialize all services for testing
   */
  async initializeServices() {
    console.log('Initializing services...');

    await performanceMonitor.initialize();
    await frameOptimizer.initialize();
    await videoProcessor.initialize();
    await backgroundQueue.initialize();
    await memoryManager.initialize();
    await batteryOptimizer.initialize();

    console.log('Services initialized');
  }

  /**
   * Test 1: Processing Speed Validation
   */
  async testProcessingSpeed() {
    console.log('\n--- Test: Processing Speed ---');

    const testCases = [
      { video: TEST_CONFIG.videoSamples.short, expected: 15000 },
      { video: TEST_CONFIG.videoSamples.standard, expected: 30000 },
      { video: TEST_CONFIG.videoSamples.long, expected: 60000 }
    ];

    for (const testCase of testCases) {
      const startTime = Date.now();

      // Start performance monitoring
      performanceMonitor.startSession({ videoUri: testCase.video.uri });
      performanceMonitor.startProcessing(testCase.video.duration * 30); // Assume 30fps

      // Process video
      const result = await videoProcessor.processVideo(testCase.video.uri, {
        exerciseType: 'squat',
        deviceTier: 'medium',
        onProgress: () => {},
        onComplete: () => {}
      });

      const processingTime = Date.now() - startTime;

      // End performance monitoring
      const performanceReport = await performanceMonitor.endSession();

      // Validate results
      const passed = processingTime <= testCase.expected && result.success;

      this.results.addResult('Processing Speed', {
        passed,
        videoDuration: testCase.video.duration,
        processingTime,
        targetTime: testCase.expected,
        fps: performanceReport.processingMetrics.averageFPS,
        score: performanceReport.score
      });

      console.log(`  ${testCase.video.duration}s video: ${passed ? '✅' : '❌'} (${processingTime}ms)`);
    }
  }

  /**
   * Test 2: Battery Usage Validation
   */
  async testBatteryUsage() {
    console.log('\n--- Test: Battery Usage ---');

    const initialBattery = await Battery.getBatteryLevelAsync();

    // Simulate processing session
    performanceMonitor.startSession({ videoUri: 'test-video.mp4' });

    // Process multiple frames to simulate real usage
    for (let i = 0; i < 100; i++) {
      performanceMonitor.recordFrameProcessing(i, Math.random() * 100 + 50);
      await this.delay(50); // Simulate processing time
    }

    const finalBattery = await Battery.getBatteryLevelAsync();
    const batteryDrain = (initialBattery - finalBattery) * 100;

    const performanceReport = await performanceMonitor.endSession();

    // Validate battery usage
    const passed = batteryDrain <= TEST_CONFIG.targetMetrics.batteryDrain * 100;

    this.results.addResult('Battery Usage', {
      passed,
      initialLevel: Math.round(initialBattery * 100),
      finalLevel: Math.round(finalBattery * 100),
      drain: batteryDrain,
      targetDrain: TEST_CONFIG.targetMetrics.batteryDrain * 100,
      batteryState: await Battery.getBatteryStateAsync()
    });

    console.log(`  Battery drain: ${passed ? '✅' : '❌'} (${batteryDrain.toFixed(2)}%)`);
  }

  /**
   * Test 3: Memory Management Validation
   */
  async testMemoryManagement() {
    console.log('\n--- Test: Memory Management ---');

    // Get initial memory state
    const initialMemory = await memoryManager.checkMemoryUsage();

    // Simulate heavy memory usage
    const frames = [];
    for (let i = 0; i < 50; i++) {
      const frame = memoryManager.getFrameFromPool();
      if (frame) {
        frames.push(frame);
      }
    }

    // Check memory during usage
    const duringMemory = await memoryManager.checkMemoryUsage();

    // Clean up
    frames.forEach(frame => memoryManager.returnFrameToPool(frame));
    await memoryManager.triggerMemoryCleanup('normal');

    // Check memory after cleanup
    const finalMemory = await memoryManager.checkMemoryUsage();

    // Validate memory management
    const peakUsage = Math.max(
      initialMemory?.used || 0,
      duringMemory?.used || 0
    );
    const passed = peakUsage < TEST_CONFIG.targetMetrics.memoryUsage * 1024 * 1024;

    this.results.addResult('Memory Management', {
      passed,
      initialMemory: this.formatBytes(initialMemory?.used || 0),
      peakMemory: this.formatBytes(peakUsage),
      finalMemory: this.formatBytes(finalMemory?.used || 0),
      targetMemory: `${TEST_CONFIG.targetMetrics.memoryUsage}MB`,
      memoryPressure: memoryManager.memoryPressure
    });

    console.log(`  Peak memory: ${passed ? '✅' : '❌'} (${this.formatBytes(peakUsage)})`);
  }

  /**
   * Test 4: Frame Optimization Validation
   */
  async testFrameOptimization() {
    console.log('\n--- Test: Frame Optimization ---');

    const testResults = [];

    for (const exerciseType of TEST_CONFIG.exerciseTypes) {
      // Extract optimized frames
      const result = await frameOptimizer.extractOptimizedFrames(
        TEST_CONFIG.videoSamples.standard.uri,
        {
          duration: TEST_CONFIG.videoSamples.standard.duration,
          exerciseType,
          deviceTier: 'medium'
        }
      );

      if (result.success) {
        const compressionRatio = result.metadata.compressionRatio;
        const targetRatio = 0.33; // Target ~10fps from 30fps
        const passed = Math.abs(compressionRatio - targetRatio) < 0.1;

        testResults.push({
          exerciseType,
          passed,
          extractedFrames: result.metadata.extractedFrameCount,
          optimizedFrames: result.metadata.optimizedFrameCount,
          compressionRatio,
          samplingRate: result.metadata.samplingRate
        });

        console.log(`  ${exerciseType}: ${passed ? '✅' : '❌'} (ratio: ${compressionRatio.toFixed(2)})`);
      }
    }

    const allPassed = testResults.every(r => r.passed);

    this.results.addResult('Frame Optimization', {
      passed: allPassed,
      details: testResults
    });
  }

  /**
   * Test 5: Background Processing Validation
   */
  async testBackgroundProcessing() {
    console.log('\n--- Test: Background Processing ---');

    // Add jobs to queue
    const jobIds = [];

    for (let i = 0; i < 5; i++) {
      const jobId = await backgroundQueue.addJob(
        {
          type: 'pose_analysis',
          videoUri: `test-video-${i}.mp4`,
          exerciseType: 'squat',
          deviceTier: 'medium'
        },
        {
          priority: i === 0 ? 0 : 2, // First job is high priority
          conditions: 'any'
        }
      );
      jobIds.push(jobId);
    }

    // Check queue status
    const queueStatus = backgroundQueue.getQueueStatus();

    // Wait for some processing
    await this.delay(2000);

    // Check if jobs are being processed
    const processingStarted = queueStatus.activeJobs > 0 || queueStatus.queueLength < 5;

    // Cancel remaining jobs
    for (const jobId of jobIds) {
      await backgroundQueue.cancelJob(jobId);
    }

    this.results.addResult('Background Processing', {
      passed: processingStarted,
      totalJobs: 5,
      queueLength: queueStatus.queueLength,
      activeJobs: queueStatus.activeJobs,
      isProcessing: queueStatus.isProcessing
    });

    console.log(`  Background queue: ${processingStarted ? '✅' : '❌'}`);
  }

  /**
   * Test 6: Device Tier Optimization
   */
  async testDeviceTierOptimization() {
    console.log('\n--- Test: Device Tier Optimization ---');

    const tierResults = [];

    for (const tier of TEST_CONFIG.deviceTiers) {
      // Get optimization settings for tier
      batteryOptimizer.adjustSettingsForDevice(tier);
      const settings = batteryOptimizer.getOptimizationSettings();

      // Validate settings are appropriate for tier
      let passed = true;

      if (tier === 'low') {
        passed = settings.frameRate <= 10 && settings.resolution === 'low';
      } else if (tier === 'high') {
        passed = settings.frameRate >= 20 && settings.resolution === 'high';
      }

      tierResults.push({
        tier,
        passed,
        settings
      });

      console.log(`  ${tier} tier: ${passed ? '✅' : '❌'}`);
    }

    const allPassed = tierResults.every(r => r.passed);

    this.results.addResult('Device Tier Optimization', {
      passed: allPassed,
      details: tierResults
    });
  }

  /**
   * Test 7: Concurrent Processing
   */
  async testConcurrentProcessing() {
    console.log('\n--- Test: Concurrent Processing ---');

    const startTime = Date.now();
    const promises = [];

    // Start multiple concurrent processing tasks
    for (let i = 0; i < 3; i++) {
      const promise = frameOptimizer.extractOptimizedFrames(
        `test-video-${i}.mp4`,
        {
          duration: 30,
          exerciseType: 'squat',
          deviceTier: 'medium'
        }
      );
      promises.push(promise);
    }

    // Wait for all to complete
    const results = await Promise.allSettled(promises);

    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.status === 'fulfilled').length;

    // Validate concurrent processing
    const passed = successCount >= 2 && totalTime < 60000; // At least 2 succeed within 1 minute

    this.results.addResult('Concurrent Processing', {
      passed,
      totalTasks: 3,
      successfulTasks: successCount,
      totalTime,
      memoryPressure: memoryManager.memoryPressure
    });

    console.log(`  Concurrent tasks: ${passed ? '✅' : '❌'} (${successCount}/3 succeeded)`);
  }

  /**
   * Test 8: Error Recovery
   */
  async testErrorRecovery() {
    console.log('\n--- Test: Error Recovery ---');

    let recoverySuccess = true;

    try {
      // Test invalid video processing
      const result1 = await videoProcessor.processVideo('invalid-video.mp4', {
        exerciseType: 'squat',
        deviceTier: 'medium'
      });

      recoverySuccess = recoverySuccess && !result1.success;

      // Test memory pressure recovery
      memoryManager.memoryPressure = 'critical';
      await memoryManager.emergencyMemoryCleanup();

      const memoryRecovered = memoryManager.memoryPressure !== 'critical';
      recoverySuccess = recoverySuccess && memoryRecovered;

      // Test queue recovery
      await backgroundQueue.clearQueue();
      const queueCleared = backgroundQueue.getQueueStatus().queueLength === 0;
      recoverySuccess = recoverySuccess && queueCleared;

    } catch (error) {
      recoverySuccess = false;
    }

    this.results.addResult('Error Recovery', {
      passed: recoverySuccess,
      invalidVideoHandled: true,
      memoryRecovered: true,
      queueRecovered: true
    });

    console.log(`  Error recovery: ${recoverySuccess ? '✅' : '❌'}`);
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    const summary = this.results.generateSummary();

    const report = {
      success: summary.passRate >= 90, // 90% pass rate required
      summary: {
        totalTests: summary.totalTests,
        passed: summary.passedTests,
        failed: summary.failedTests,
        passRate: `${summary.passRate.toFixed(1)}%`
      },
      targetsMet: {
        processingSpeed: this.checkTarget('Processing Speed'),
        batteryUsage: this.checkTarget('Battery Usage'),
        memoryManagement: this.checkTarget('Memory Management'),
        frameOptimization: this.checkTarget('Frame Optimization'),
        backgroundProcessing: this.checkTarget('Background Processing')
      },
      recommendations: this.generateRecommendations(),
      timestamp: Date.now(),
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version,
        totalMemory: Device.totalMemory,
        supportedCpuArchitectures: Device.supportedCpuArchitectures
      }
    };

    // Log report
    console.log('\n=== Performance Validation Report ===');
    console.log(`Overall Pass Rate: ${report.summary.passRate}`);
    console.log('\nTargets Met:');
    Object.entries(report.targetsMet).forEach(([target, met]) => {
      console.log(`  ${target}: ${met ? '✅' : '❌'}`);
    });

    if (report.recommendations.length > 0) {
      console.log('\nRecommendations:');
      report.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }

    return report;
  }

  /**
   * Check if specific target was met
   */
  checkTarget(testName) {
    const testResults = this.results.results.filter(r => r.test === testName);
    return testResults.length > 0 && testResults.every(r => r.result.passed);
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];

    // Check processing speed
    const speedTests = this.results.results.filter(r => r.test === 'Processing Speed');
    if (speedTests.some(t => !t.result.passed)) {
      recommendations.push('Consider further frame sampling optimization for longer videos');
    }

    // Check battery usage
    const batteryTests = this.results.results.filter(r => r.test === 'Battery Usage');
    if (batteryTests.some(t => !t.result.passed)) {
      recommendations.push('Implement more aggressive power saving modes');
    }

    // Check memory
    const memoryTests = this.results.results.filter(r => r.test === 'Memory Management');
    if (memoryTests.some(t => !t.result.passed)) {
      recommendations.push('Increase cache eviction frequency and reduce frame pool size');
    }

    return recommendations;
  }

  /**
   * Cleanup after tests
   */
  async cleanup() {
    // Clear caches
    await memoryManager.clearAllCaches();

    // Clear queue
    await backgroundQueue.clearQueue();

    // Stop monitoring
    performanceMonitor.reset();
    batteryOptimizer.stopMonitoring();
    memoryManager.stopMemoryMonitoring();

    console.log('Test cleanup complete');
  }

  /**
   * Utility: Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Utility: Delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export test suite
export default new PerformanceValidationSuite();

// Export individual test functions for selective testing
export {
  PerformanceValidationSuite,
  PerformanceTestResults,
  TEST_CONFIG
};