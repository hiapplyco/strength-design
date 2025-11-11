/**
 * Background Queue Service Test Suite
 * Tests for priority-based background job processing
 */

import BackgroundQueue from '../backgroundQueue';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import * as Battery from 'expo-battery';
import NetInfo from '@react-native-community/netinfo';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

// Mock job
const createMockJob = (priority = 2, id = null) => ({
  id: id || `job-${Date.now()}`,
  type: 'video_analysis',
  priority,
  data: {
    videoUri: 'file:///video.mp4',
    exerciseType: 'squat'
  },
  state: 'pending',
  retries: 0,
  createdAt: Date.now(),
  conditions: 'any'
});

describe('BackgroundQueue', () => {
  let queue;

  beforeEach(() => {
    queue = new BackgroundQueue();
    jest.clearAllMocks();

    // Mock system states
    Battery.getBatteryLevelAsync.mockResolvedValue(0.8);
    Battery.getBatteryStateAsync.mockResolvedValue(2); // CHARGING
    NetInfo.fetch.mockResolvedValue({
      type: 'wifi',
      isConnected: true
    });
  });

  describe('Initialization', () => {
    test('initializes successfully', async () => {
      const result = await queue.initialize();

      expect(result.success).toBe(true);
      expect(queue.isInitialized).toBe(true);
    });

    test('loads persisted queue from storage', async () => {
      const savedJobs = [
        createMockJob(1, 'job-1'),
        createMockJob(2, 'job-2')
      ];

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedJobs));

      await queue.initialize();

      expect(queue.queue.length).toBe(2);
    });

    test('sets up app state listener', async () => {
      const addEventListenerSpy = jest.spyOn(AppState, 'addEventListener');

      await queue.initialize();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    test('sets up network state listener', async () => {
      const addEventListenerSpy = jest.spyOn(NetInfo, 'addEventListener');

      await queue.initialize();

      expect(addEventListenerSpy).toHaveBeenCalledWith(expect.any(Function));
    });

    test('registers background task', async () => {
      await queue.initialize();

      expect(TaskManager.defineTask).toHaveBeenCalled();
      expect(BackgroundFetch.registerTaskAsync).toHaveBeenCalled();
    });

    test('starts processing if app is active', async () => {
      jest.spyOn(AppState, 'currentState', 'get').mockReturnValue('active');
      const startSpy = jest.spyOn(queue, 'startProcessing');

      await queue.initialize();

      expect(startSpy).toHaveBeenCalled();
    });
  });

  describe('Job Enqueueing', () => {
    beforeEach(async () => {
      await queue.initialize();
    });

    test('enqueues job with default priority', async () => {
      const job = createMockJob();

      await queue.enqueue(job);

      expect(queue.queue).toContainEqual(expect.objectContaining({ id: job.id }));
    });

    test('assigns unique ID if not provided', async () => {
      const job = { ...createMockJob(), id: undefined };

      const result = await queue.enqueue(job);

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
    });

    test('maintains priority order in queue', async () => {
      await queue.enqueue(createMockJob(3, 'low'));    // LOW
      await queue.enqueue(createMockJob(0, 'critical')); // CRITICAL
      await queue.enqueue(createMockJob(1, 'high'));   // HIGH
      await queue.enqueue(createMockJob(2, 'normal')); // NORMAL

      expect(queue.queue[0].id).toBe('critical');
      expect(queue.queue[1].id).toBe('high');
      expect(queue.queue[2].id).toBe('normal');
      expect(queue.queue[3].id).toBe('low');
    });

    test('persists queue after enqueuing', async () => {
      await queue.enqueue(createMockJob());

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@background_queue',
        expect.any(String)
      );
    });

    test('prevents duplicate job IDs', async () => {
      const job = createMockJob(2, 'duplicate-id');

      await queue.enqueue(job);
      await queue.enqueue(job);

      expect(queue.queue.filter(j => j.id === 'duplicate-id')).toHaveLength(1);
    });
  });

  describe('Job Processing', () => {
    beforeEach(async () => {
      await queue.initialize();
    });

    test('processes next job from queue', async () => {
      const job = createMockJob();
      await queue.enqueue(job);

      jest.spyOn(queue, 'executeJob').mockResolvedValue({ success: true });

      await queue.processNextJob();

      expect(queue.executeJob).toHaveBeenCalledWith(
        expect.objectContaining({ id: job.id })
      );
    });

    test('removes completed job from queue', async () => {
      const job = createMockJob();
      await queue.enqueue(job);

      jest.spyOn(queue, 'executeJob').mockResolvedValue({ success: true });

      await queue.processNextJob();

      expect(queue.queue.find(j => j.id === job.id)).toBeUndefined();
    });

    test('respects maximum concurrent jobs limit', async () => {
      const jobs = Array.from({ length: 5 }, (_, i) => createMockJob(2, `job-${i}`));

      for (const job of jobs) {
        await queue.enqueue(job);
      }

      jest.spyOn(queue, 'executeJob').mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      queue.startProcessing();

      // Check that active jobs don't exceed limit
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(queue.activeJobs.size).toBeLessThanOrEqual(2); // MAX_CONCURRENT_JOBS
    });

    test('updates job state during processing', async () => {
      const job = createMockJob();
      await queue.enqueue(job);

      jest.spyOn(queue, 'executeJob').mockImplementation(async (job) => {
        expect(job.state).toBe('processing');
        return { success: true };
      });

      await queue.processNextJob();
    });

    test('stores job results', async () => {
      const job = createMockJob(2, 'result-job');
      await queue.enqueue(job);

      const mockResult = { success: true, data: { score: 85 } };
      jest.spyOn(queue, 'executeJob').mockResolvedValue(mockResult);

      await queue.processNextJob();

      expect(queue.jobResults.has('result-job')).toBe(true);
      expect(queue.jobResults.get('result-job')).toEqual(mockResult);
    });
  });

  describe('Priority Handling', () => {
    beforeEach(async () => {
      await queue.initialize();
    });

    test('processes critical jobs first', async () => {
      await queue.enqueue(createMockJob(2, 'normal'));
      await queue.enqueue(createMockJob(0, 'critical'));
      await queue.enqueue(createMockJob(1, 'high'));

      jest.spyOn(queue, 'executeJob').mockResolvedValue({ success: true });

      await queue.processNextJob();

      expect(queue.executeJob).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'critical' })
      );
    });

    test('allows priority updates for queued jobs', async () => {
      const job = createMockJob(3, 'update-job');
      await queue.enqueue(job);

      await queue.updateJobPriority('update-job', 0); // Upgrade to CRITICAL

      const updatedJob = queue.queue.find(j => j.id === 'update-job');
      expect(updatedJob.priority).toBe(0);
    });

    test('reorders queue after priority update', async () => {
      await queue.enqueue(createMockJob(2, 'job-1'));
      await queue.enqueue(createMockJob(3, 'job-2'));

      await queue.updateJobPriority('job-2', 0); // job-2 becomes CRITICAL

      expect(queue.queue[0].id).toBe('job-2');
    });
  });

  describe('Retry Logic', () => {
    beforeEach(async () => {
      await queue.initialize();
    });

    test('retries failed jobs with exponential backoff', async () => {
      const job = createMockJob();
      await queue.enqueue(job);

      let attempts = 0;
      jest.spyOn(queue, 'executeJob').mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Job failed'));
        }
        return Promise.resolve({ success: true });
      });

      await queue.processJobWithRetry(job);

      expect(attempts).toBe(3);
    });

    test('increases retry delay exponentially', async () => {
      const delays = [];

      jest.spyOn(queue, 'executeJob').mockRejectedValue(new Error('Failed'));
      jest.spyOn(queue, 'delay').mockImplementation((ms) => {
        delays.push(ms);
        return Promise.resolve();
      });

      const job = createMockJob();
      try {
        await queue.processJobWithRetry(job);
      } catch (error) {
        // Expected to fail after max retries
      }

      // Delays should increase: 1000, 2000, 4000...
      expect(delays[1]).toBeGreaterThan(delays[0]);
      expect(delays[2]).toBeGreaterThan(delays[1]);
    });

    test('marks job as failed after max retries', async () => {
      const job = createMockJob(2, 'fail-job');
      await queue.enqueue(job);

      jest.spyOn(queue, 'executeJob').mockRejectedValue(new Error('Always fails'));

      try {
        await queue.processJobWithRetry(job);
      } catch (error) {
        // Expected
      }

      const failedJob = queue.queue.find(j => j.id === 'fail-job');
      expect(failedJob.state).toBe('failed');
      expect(failedJob.retries).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Processing Conditions', () => {
    beforeEach(async () => {
      await queue.initialize();
    });

    test('respects WiFi-only condition', async () => {
      const job = { ...createMockJob(), conditions: 'wifi_only' };
      await queue.enqueue(job);

      // Mock WiFi connection
      queue.networkState = { type: 'wifi', isConnected: true };

      const canProcess = await queue.canProcessJob(job);

      expect(canProcess).toBe(true);
    });

    test('blocks processing on cellular when WiFi required', async () => {
      const job = { ...createMockJob(), conditions: 'wifi_only' };
      await queue.enqueue(job);

      // Mock cellular connection
      queue.networkState = { type: 'cellular', isConnected: true };

      const canProcess = await queue.canProcessJob(job);

      expect(canProcess).toBe(false);
    });

    test('respects charging-only condition', async () => {
      const job = { ...createMockJob(), conditions: 'charging_only' };
      await queue.enqueue(job);

      queue.batteryState = 2; // CHARGING

      const canProcess = await queue.canProcessJob(job);

      expect(canProcess).toBe(true);
    });

    test('blocks processing when not charging if required', async () => {
      const job = { ...createMockJob(), conditions: 'charging_only' };
      await queue.enqueue(job);

      queue.batteryState = 1; // NOT CHARGING

      const canProcess = await queue.canProcessJob(job);

      expect(canProcess).toBe(false);
    });

    test('checks minimum battery level', async () => {
      const job = createMockJob();
      await queue.enqueue(job);

      Battery.getBatteryLevelAsync.mockResolvedValue(0.15); // 15% - below minimum

      const canProcess = await queue.canProcessJob(job);

      expect(canProcess).toBe(false);
    });
  });

  describe('Job Cancellation', () => {
    beforeEach(async () => {
      await queue.initialize();
    });

    test('cancels queued job', async () => {
      const job = createMockJob(2, 'cancel-job');
      await queue.enqueue(job);

      await queue.cancelJob('cancel-job');

      const cancelledJob = queue.queue.find(j => j.id === 'cancel-job');
      expect(cancelledJob.state).toBe('cancelled');
    });

    test('cancels active job', async () => {
      const job = createMockJob(2, 'active-cancel');
      await queue.enqueue(job);

      jest.spyOn(queue, 'executeJob').mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 5000))
      );

      // Start processing
      const processPromise = queue.processNextJob();

      // Cancel while processing
      await new Promise(resolve => setTimeout(resolve, 100));
      await queue.cancelJob('active-cancel');

      expect(queue.activeJobs.has('active-cancel')).toBe(false);
    });

    test('removes cancelled job from queue', async () => {
      const job = createMockJob(2, 'remove-job');
      await queue.enqueue(job);

      await queue.cancelJob('remove-job', true); // true = remove completely

      expect(queue.queue.find(j => j.id === 'remove-job')).toBeUndefined();
    });
  });

  describe('App State Handling', () => {
    beforeEach(async () => {
      await queue.initialize();
    });

    test('pauses processing when app goes to background', async () => {
      queue.isProcessing = true;

      queue.handleAppStateChange('background');

      expect(queue.isProcessing).toBe(false);
    });

    test('resumes processing when app becomes active', async () => {
      queue.isProcessing = false;
      await queue.enqueue(createMockJob());

      jest.spyOn(queue, 'startProcessing');

      queue.handleAppStateChange('active');

      expect(queue.startProcessing).toHaveBeenCalled();
    });

    test('persists queue state when backgrounding', async () => {
      await queue.enqueue(createMockJob());

      queue.handleAppStateChange('background');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@background_queue',
        expect.any(String)
      );
    });
  });

  describe('Queue Management', () => {
    beforeEach(async () => {
      await queue.initialize();
    });

    test('gets job by ID', async () => {
      const job = createMockJob(2, 'find-job');
      await queue.enqueue(job);

      const found = queue.getJob('find-job');

      expect(found).toBeDefined();
      expect(found.id).toBe('find-job');
    });

    test('clears completed jobs', async () => {
      await queue.enqueue({ ...createMockJob(), state: 'completed', id: 'job-1' });
      await queue.enqueue({ ...createMockJob(), state: 'pending', id: 'job-2' });

      await queue.clearCompletedJobs();

      expect(queue.queue.find(j => j.id === 'job-1')).toBeUndefined();
      expect(queue.queue.find(j => j.id === 'job-2')).toBeDefined();
    });

    test('gets queue statistics', () => {
      queue.queue = [
        { ...createMockJob(), state: 'pending' },
        { ...createMockJob(), state: 'processing' },
        { ...createMockJob(), state: 'completed' },
        { ...createMockJob(), state: 'failed' }
      ];

      const stats = queue.getQueueStats();

      expect(stats.total).toBe(4);
      expect(stats.pending).toBe(1);
      expect(stats.processing).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
    });

    test('clears entire queue', async () => {
      await queue.enqueue(createMockJob());
      await queue.enqueue(createMockJob());
      await queue.enqueue(createMockJob());

      await queue.clearQueue();

      expect(queue.queue.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await queue.initialize();
    });

    test('handles job execution timeout', async () => {
      jest.useFakeTimers();

      const job = createMockJob();
      await queue.enqueue(job);

      jest.spyOn(queue, 'executeJob').mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000)) // 10 minutes
      );

      const promise = queue.processJobWithTimeout(job, 5 * 60 * 1000); // 5 min timeout

      jest.advanceTimersByTime(5 * 60 * 1000);

      await expect(promise).rejects.toThrow('timeout');

      jest.useRealTimers();
    });

    test('continues processing next job after failure', async () => {
      await queue.enqueue(createMockJob(2, 'fail-job'));
      await queue.enqueue(createMockJob(2, 'success-job'));

      jest.spyOn(queue, 'executeJob')
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ success: true });

      await queue.processNextJob();
      await queue.processNextJob();

      expect(queue.executeJob).toHaveBeenCalledTimes(2);
    });
  });

  describe('Persistence', () => {
    beforeEach(async () => {
      await queue.initialize();
    });

    test('saves queue to storage', async () => {
      await queue.enqueue(createMockJob());

      await queue.saveQueue();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@background_queue',
        expect.stringContaining('videoUri')
      );
    });

    test('loads queue from storage', async () => {
      const savedJobs = [createMockJob(2, 'saved-1'), createMockJob(1, 'saved-2')];

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(savedJobs));

      await queue.loadQueue();

      expect(queue.queue.length).toBe(2);
    });

    test('handles corrupted storage data', async () => {
      AsyncStorage.getItem.mockResolvedValue('invalid json{');

      await expect(queue.loadQueue()).resolves.not.toThrow();
      expect(queue.queue.length).toBe(0); // Empty queue on error
    });
  });
});
