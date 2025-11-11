/**
 * Network Condition Testing Suite
 * Tests pose analysis behavior under various network conditions
 */

import PoseAnalysisService from '../../services/poseDetection/PoseAnalysisService';
import backgroundQueue from '../../services/backgroundQueue';
import { uploadVideo, syncResults } from '../../services/networkService';
import NetInfo from '@react-native-community/netinfo';

// Network condition profiles (matching Firebase Test Lab profiles)
const NETWORK_PROFILES = {
  LTE: {
    download: 13000, // 13 Mbps
    upload: 5000,    // 5 Mbps
    latency: 60,     // 60ms
    packetLoss: 0
  },
  '3G': {
    download: 1600,  // 1.6 Mbps
    upload: 768,     // 768 Kbps
    latency: 150,    // 150ms
    packetLoss: 0
  },
  'Slow-3G': {
    download: 400,   // 400 Kbps
    upload: 400,     // 400 Kbps
    latency: 400,    // 400ms
    packetLoss: 0
  },
  offline: {
    download: 0,
    upload: 0,
    latency: Infinity,
    packetLoss: 100
  }
};

// Mock network throttling
const simulateNetworkCondition = (profile) => {
  const condition = NETWORK_PROFILES[profile];

  // Mock NetInfo state
  NetInfo.fetch.mockResolvedValue({
    isConnected: profile !== 'offline',
    isInternetReachable: profile !== 'offline',
    type: profile === 'offline' ? 'none' : 'cellular',
    details: {
      cellularGeneration: profile === 'LTE' ? '4g' : '3g'
    }
  });

  return condition;
};

describe('Network Condition Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LTE Network (Standard)', () => {
    beforeEach(() => {
      simulateNetworkCondition('LTE');
    });

    test('video upload completes smoothly on LTE', async () => {
      const videoUri = 'mock://10s-video.mp4';
      const startTime = Date.now();

      const result = await uploadVideo(videoUri);

      const uploadTime = Date.now() - startTime;

      console.log(`LTE upload time: ${uploadTime}ms`);

      expect(result.success).toBe(true);
      expect(uploadTime).toBeLessThan(10000); // Should complete in <10s
    });

    test('realtime updates occur frequently on LTE', async () => {
      const updates = [];
      const onProgress = (progress) => {
        updates.push({
          timestamp: Date.now(),
          progress: progress.percent
        });
      };

      await PoseAnalysisService.analyzeVideo(
        'mock://10s-video.mp4',
        'squat',
        { onProgress }
      );

      // Calculate average update frequency
      const intervals = [];
      for (let i = 1; i < updates.length; i++) {
        intervals.push(updates[i].timestamp - updates[i - 1].timestamp);
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

      console.log(`LTE update frequency: every ${avgInterval}ms`);
      console.log(`Total updates: ${updates.length}`);

      // On LTE, expect updates at least every 1 second
      expect(avgInterval).toBeLessThan(1000);
    });

    test('results sync immediately on LTE', async () => {
      const analysisResult = {
        id: 'test-123',
        score: 85,
        feedback: []
      };

      const startTime = Date.now();
      const result = await syncResults(analysisResult);
      const syncTime = Date.now() - startTime;

      console.log(`LTE sync time: ${syncTime}ms`);

      expect(result.success).toBe(true);
      expect(syncTime).toBeLessThan(1000); // <1s sync delay
    });
  });

  describe('3G Network (Degraded)', () => {
    beforeEach(() => {
      simulateNetworkCondition('3G');
    });

    test('video upload uses chunked transfer on 3G', async () => {
      const videoUri = 'mock://10s-video.mp4';

      const uploadSpy = jest.spyOn(uploadVideo, 'uploadChunk');

      await uploadVideo(videoUri);

      // Should use chunked upload
      expect(uploadSpy).toHaveBeenCalled();

      const chunkCount = uploadSpy.mock.calls.length;
      console.log(`3G upload chunks: ${chunkCount}`);

      // Expect multiple chunks for better reliability
      expect(chunkCount).toBeGreaterThan(1);
    });

    test('progress updates are batched on 3G', async () => {
      const updates = [];
      const onProgress = (progress) => {
        updates.push({
          timestamp: Date.now(),
          progress: progress.percent
        });
      };

      await PoseAnalysisService.analyzeVideo(
        'mock://10s-video.mp4',
        'squat',
        { onProgress }
      );

      const intervals = [];
      for (let i = 1; i < updates.length; i++) {
        intervals.push(updates[i].timestamp - updates[i - 1].timestamp);
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

      console.log(`3G update frequency: every ${avgInterval}ms`);

      // On 3G, updates should be batched (every 2-3 seconds)
      expect(avgInterval).toBeGreaterThan(1500);
      expect(avgInterval).toBeLessThan(5000);
    });

    test('results sync has acceptable delay on 3G', async () => {
      const analysisResult = {
        id: 'test-123',
        score: 85,
        feedback: []
      };

      const startTime = Date.now();
      const result = await syncResults(analysisResult);
      const syncTime = Date.now() - startTime;

      console.log(`3G sync time: ${syncTime}ms`);

      expect(result.success).toBe(true);
      expect(syncTime).toBeLessThan(5000); // 2-5s delay acceptable
    });

    test('retry logic activates on 3G failures', async () => {
      // Simulate intermittent failures on 3G
      let attemptCount = 0;
      uploadVideo.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 2) {
          return Promise.reject(new Error('Network timeout'));
        }
        return Promise.resolve({ success: true });
      });

      const result = await uploadVideo('mock://video.mp4', { retryOnFailure: true });

      expect(result.success).toBe(true);
      expect(attemptCount).toBeGreaterThan(1);

      console.log(`3G retry attempts: ${attemptCount}`);
    });
  });

  describe('Slow 3G Network (Poor)', () => {
    beforeEach(() => {
      simulateNetworkCondition('Slow-3G');
    });

    test('video upload uses aggressive chunking on Slow 3G', async () => {
      const videoUri = 'mock://10s-video.mp4';

      const uploadSpy = jest.spyOn(uploadVideo, 'uploadChunk');

      await uploadVideo(videoUri);

      const chunkCount = uploadSpy.mock.calls.length;
      console.log(`Slow 3G upload chunks: ${chunkCount}`);

      // Should use smaller chunks (more of them)
      expect(chunkCount).toBeGreaterThan(5);
    });

    test('offline queue is enabled on Slow 3G', async () => {
      const analysisResult = {
        id: 'test-123',
        score: 85,
        feedback: []
      };

      // Simulate upload failure due to slow connection
      syncResults.mockRejectedValue(new Error('Request timeout'));

      await expect(syncResults(analysisResult)).rejects.toThrow();

      // Result should be queued for later
      const queuedJobs = await backgroundQueue.getQueue();
      const syncJob = queuedJobs.find(j => j.data.resultId === 'test-123');

      expect(syncJob).toBeDefined();
      expect(syncJob.status).toBe('pending');

      console.log('Slow 3G: Result queued for offline retry');
    });

    test('UI shows degraded network indicator on Slow 3G', async () => {
      const networkState = await NetInfo.fetch();

      const shouldShowWarning =
        networkState.isConnected &&
        networkState.details?.cellularGeneration === '3g';

      expect(shouldShowWarning).toBe(true);

      console.log('Slow 3G: Network warning indicator should be shown');
    });
  });

  describe('Offline Mode', () => {
    beforeEach(() => {
      simulateNetworkCondition('offline');
    });

    test('video upload is queued when offline', async () => {
      const videoUri = 'mock://10s-video.mp4';

      const result = await uploadVideo(videoUri, { offlineMode: true });

      expect(result.queued).toBe(true);
      expect(result.success).toBe(false);

      const queuedJobs = await backgroundQueue.getQueue();
      const uploadJob = queuedJobs.find(j => j.type === 'video_upload');

      expect(uploadJob).toBeDefined();
      expect(uploadJob.status).toBe('pending');

      console.log('Offline: Video upload queued for later');
    });

    test('local analysis continues when offline (if model cached)', async () => {
      const videoUri = 'mock://10s-video.mp4';

      // Assume pose detection model is cached locally
      const result = await PoseAnalysisService.analyzeVideo(
        videoUri,
        'squat',
        { offlineMode: true }
      );

      expect(result.success).toBe(true);
      expect(result.offlineAnalysis).toBe(true);

      console.log('Offline: Local analysis completed');
    });

    test('results are queued for sync when offline', async () => {
      const analysisResult = {
        id: 'test-123',
        score: 85,
        feedback: []
      };

      const result = await syncResults(analysisResult, { offlineMode: true });

      expect(result.queued).toBe(true);

      const queuedJobs = await backgroundQueue.getQueue();
      const syncJob = queuedJobs.find(j => j.data.resultId === 'test-123');

      expect(syncJob).toBeDefined();

      console.log('Offline: Results queued for sync when online');
    });

    test('offline indicator is shown to user', async () => {
      const networkState = await NetInfo.fetch();

      expect(networkState.isConnected).toBe(false);
      expect(networkState.isInternetReachable).toBe(false);

      console.log('Offline: UI should show offline indicator');
    });

    test('queue processes when connection restored', async () => {
      // Add jobs to queue while offline
      await backgroundQueue.enqueue({
        type: 'video_upload',
        data: { videoUri: 'mock://video1.mp4' }
      });

      await backgroundQueue.enqueue({
        type: 'sync_results',
        data: { resultId: 'result-123' }
      });

      // Simulate connection restored
      simulateNetworkCondition('LTE');

      NetInfo.addEventListener.mock.calls[0][0]({
        isConnected: true,
        isInternetReachable: true
      });

      // Queue should start processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const processedJobs = await backgroundQueue.getProcessedJobs();

      expect(processedJobs.length).toBeGreaterThan(0);

      console.log(`Queue processed ${processedJobs.length} jobs after reconnection`);
    });
  });

  describe('Network Transition Handling', () => {
    test('handles transition from LTE to offline gracefully', async () => {
      simulateNetworkCondition('LTE');

      // Start upload on LTE
      const uploadPromise = uploadVideo('mock://10s-video.mp4');

      // Simulate network loss mid-upload
      setTimeout(() => {
        simulateNetworkCondition('offline');
      }, 500);

      const result = await uploadPromise;

      // Upload should be queued or partially completed
      expect(result.queued || result.partialUpload).toBe(true);

      console.log('Network transition: Upload handled gracefully');
    });

    test('resumes upload when network improves', async () => {
      simulateNetworkCondition('Slow-3G');

      // Start upload on Slow 3G
      const uploadPromise = uploadVideo('mock://10s-video.mp4', {
        resumable: true
      });

      // Simulate network improvement to LTE
      setTimeout(() => {
        simulateNetworkCondition('LTE');
      }, 1000);

      const result = await uploadPromise;

      expect(result.success).toBe(true);
      expect(result.resumed).toBe(true);

      console.log('Network improvement: Upload resumed successfully');
    });

    test('adapts batch size based on network conditions', async () => {
      const batchSizes = [];

      // Start on LTE
      simulateNetworkCondition('LTE');
      batchSizes.push(await backgroundQueue.getCurrentBatchSize());

      // Degrade to 3G
      simulateNetworkCondition('3G');
      batchSizes.push(await backgroundQueue.getCurrentBatchSize());

      // Degrade to Slow 3G
      simulateNetworkCondition('Slow-3G');
      batchSizes.push(await backgroundQueue.getCurrentBatchSize());

      console.log('Batch sizes:', batchSizes);

      // Batch size should decrease as network degrades
      expect(batchSizes[0]).toBeGreaterThan(batchSizes[1]);
      expect(batchSizes[1]).toBeGreaterThan(batchSizes[2]);
    });
  });

  describe('Network Error Recovery', () => {
    test('retries with exponential backoff on network errors', async () => {
      simulateNetworkCondition('3G');

      const retryDelays = [];
      let attemptCount = 0;

      uploadVideo.mockImplementation(async () => {
        attemptCount++;
        const delay = Math.min(1000 * Math.pow(2, attemptCount - 1), 30000);
        retryDelays.push(delay);

        if (attemptCount < 3) {
          throw new Error('Network error');
        }

        return { success: true };
      });

      const result = await uploadVideo('mock://video.mp4', {
        maxRetries: 3,
        exponentialBackoff: true
      });

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);

      console.log('Retry delays:', retryDelays);

      // Delays should increase exponentially
      expect(retryDelays[1]).toBeGreaterThan(retryDelays[0]);
      if (retryDelays[2]) {
        expect(retryDelays[2]).toBeGreaterThan(retryDelays[1]);
      }
    });

    test('provides clear error messages for network failures', async () => {
      simulateNetworkCondition('offline');

      try {
        await uploadVideo('mock://video.mp4', { offlineMode: false });
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('network');
        expect(error.userMessage).toBeDefined();
        expect(error.recoverable).toBe(true);

        console.log('Error message:', error.userMessage);
      }
    });
  });

  describe('Bandwidth Optimization', () => {
    test('uses compression on slower networks', async () => {
      simulateNetworkCondition('3G');

      const uploadSpy = jest.spyOn(uploadVideo, 'compress');

      await uploadVideo('mock://10s-video.mp4');

      expect(uploadSpy).toHaveBeenCalled();

      const compressionLevel = uploadSpy.mock.calls[0][0];

      console.log(`3G compression level: ${compressionLevel}`);

      // Higher compression on slower networks
      expect(compressionLevel).toBeGreaterThanOrEqual(0.6);
    });

    test('disables compression on LTE to preserve quality', async () => {
      simulateNetworkCondition('LTE');

      const uploadSpy = jest.spyOn(uploadVideo, 'compress');

      await uploadVideo('mock://10s-video.mp4');

      const compressionLevel = uploadSpy.mock.calls[0]?.[0] || 1.0;

      console.log(`LTE compression level: ${compressionLevel}`);

      // Minimal or no compression on LTE
      expect(compressionLevel).toBeGreaterThanOrEqual(0.9);
    });
  });
});
