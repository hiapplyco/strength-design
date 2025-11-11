/**
 * Background Queue Service
 * Priority-based background processing queue for pose analysis
 *
 * Features:
 * - Priority queue management
 * - Concurrent processing control
 * - Job persistence and recovery
 * - Progress tracking and cancellation
 * - Resource-aware scheduling
 * - Automatic retry with exponential backoff
 */

import { Platform, AppState, NativeEventEmitter, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Battery from 'expo-battery';
import NetInfo from '@react-native-community/netinfo';
import videoProcessor from './videoProcessor';
import performanceMonitor from './performanceMonitor';

// Queue constants
const TASK_NAME = 'POSE_ANALYSIS_BACKGROUND_TASK';
const QUEUE_STORAGE_KEY = '@background_queue';
const JOB_STORAGE_PREFIX = '@bg_job_';
const MAX_CONCURRENT_JOBS = 2;
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // Base delay for exponential backoff
const JOB_TIMEOUT = 5 * 60 * 1000; // 5 minutes per job
const MIN_BATTERY_LEVEL = 0.2; // 20% battery minimum
const MIN_FREE_MEMORY_MB = 200; // 200MB free memory minimum

// Job priorities
const JobPriority = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
  IDLE: 4
};

// Job states
const JobState = {
  PENDING: 'pending',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  RETRYING: 'retrying'
};

// Processing conditions
const ProcessingConditions = {
  ANY: 'any',
  WIFI_ONLY: 'wifi_only',
  CHARGING_ONLY: 'charging_only',
  IDLE_ONLY: 'idle_only'
};

class BackgroundQueue {
  constructor() {
    this.queue = [];
    this.activeJobs = new Map();
    this.jobResults = new Map();
    this.isProcessing = false;
    this.appState = 'active';
    this.networkState = null;
    this.batteryState = null;
    this.listeners = new Map();
    this.processingTimer = null;
    this.isInitialized = false;
  }

  /**
   * Initialize background queue
   */
  async initialize() {
    try {
      // Load persisted queue
      await this.loadQueue();

      // Set up app state listener
      AppState.addEventListener('change', this.handleAppStateChange.bind(this));

      // Set up network state listener
      NetInfo.addEventListener(this.handleNetworkChange.bind(this));

      // Set up battery state monitoring
      await this.setupBatteryMonitoring();

      // Register background task
      await this.registerBackgroundTask();

      // Start processing if app is active
      if (AppState.currentState === 'active') {
        this.startProcessing();
      }

      this.isInitialized = true;

      console.log('BackgroundQueue: Initialized', {
        queueLength: this.queue.length,
        activeJobs: this.activeJobs.size
      });

      return { success: true, queueLength: this.queue.length };
    } catch (error) {
      console.error('BackgroundQueue: Initialization failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Register background task for iOS/Android
   */
  async registerBackgroundTask() {
    try {
      // Define the background task
      TaskManager.defineTask(TASK_NAME, async () => {
        try {
          console.log('BackgroundQueue: Background task triggered');

          // Process queue in background
          const result = await this.processNextJob();

          return result
            ? BackgroundFetch.BackgroundFetchResult.NewData
            : BackgroundFetch.BackgroundFetchResult.NoData;
        } catch (error) {
          console.error('BackgroundQueue: Background task failed', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // Register background fetch
      await BackgroundFetch.registerTaskAsync(TASK_NAME, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true
      });

      console.log('BackgroundQueue: Background task registered');
    } catch (error) {
      console.error('BackgroundQueue: Failed to register background task', error);
    }
  }

  /**
   * Add job to queue
   */
  async addJob(jobData, options = {}) {
    const {
      priority = JobPriority.NORMAL,
      conditions = ProcessingConditions.ANY,
      metadata = {},
      onProgress = () => {},
      onComplete = () => {},
      onError = () => {}
    } = options;

    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: jobData.type || 'pose_analysis',
      data: jobData,
      priority,
      conditions,
      metadata,
      callbacks: { onProgress, onComplete, onError },
      state: JobState.PENDING,
      retries: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      startedAt: null,
      completedAt: null,
      error: null,
      progress: {
        current: 0,
        total: 0,
        percentage: 0
      }
    };

    // Add to queue
    this.queue.push(job);

    // Sort queue by priority
    this.sortQueue();

    // Persist queue
    await this.saveQueue();

    // Emit job added event
    this.emit('jobAdded', job);

    console.log('BackgroundQueue: Job added', {
      id: job.id,
      type: job.type,
      priority: job.priority
    });

    // Start processing if conditions are met
    if (await this.canProcess()) {
      this.startProcessing();
    }

    return job.id;
  }

  /**
   * Sort queue by priority
   */
  sortQueue() {
    this.queue.sort((a, b) => {
      // First sort by priority
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // Then by creation time (FIFO within same priority)
      return a.createdAt - b.createdAt;
    });
  }

  /**
   * Start processing queue
   */
  startProcessing() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    console.log('BackgroundQueue: Started processing');

    // Set up processing loop
    this.processingTimer = setInterval(async () => {
      if (await this.canProcess()) {
        await this.processNextJob();
      }
    }, 1000); // Check every second
  }

  /**
   * Stop processing queue
   */
  stopProcessing() {
    if (!this.isProcessing) return;

    this.isProcessing = false;

    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }

    console.log('BackgroundQueue: Stopped processing');
  }

  /**
   * Process next job in queue
   */
  async processNextJob() {
    // Check if we can process more jobs
    if (this.activeJobs.size >= MAX_CONCURRENT_JOBS) {
      return false;
    }

    // Get next eligible job
    const job = await this.getNextEligibleJob();

    if (!job) {
      // No eligible jobs, stop processing if queue is empty
      if (this.queue.length === 0 && this.activeJobs.size === 0) {
        this.stopProcessing();
      }
      return false;
    }

    // Update job state
    job.state = JobState.PROCESSING;
    job.startedAt = Date.now();
    job.updatedAt = Date.now();

    // Move to active jobs
    this.activeJobs.set(job.id, job);

    // Remove from queue
    const index = this.queue.findIndex(j => j.id === job.id);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }

    // Save state
    await this.saveQueue();

    // Emit processing started event
    this.emit('jobStarted', job);

    console.log('BackgroundQueue: Processing job', {
      id: job.id,
      type: job.type
    });

    // Process job with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Job timeout')), JOB_TIMEOUT)
    );

    try {
      const result = await Promise.race([
        this.executeJob(job),
        timeoutPromise
      ]);

      // Job completed successfully
      job.state = JobState.COMPLETED;
      job.completedAt = Date.now();
      job.updatedAt = Date.now();

      // Store result
      this.jobResults.set(job.id, result);

      // Remove from active jobs
      this.activeJobs.delete(job.id);

      // Save job result
      await this.saveJobResult(job.id, result);

      // Emit completion event
      this.emit('jobCompleted', { job, result });

      // Callback
      if (job.callbacks.onComplete) {
        job.callbacks.onComplete(result);
      }

      console.log('BackgroundQueue: Job completed', {
        id: job.id,
        duration: job.completedAt - job.startedAt
      });

      return true;

    } catch (error) {
      console.error('BackgroundQueue: Job failed', {
        id: job.id,
        error: error.message
      });

      // Handle job failure
      await this.handleJobFailure(job, error);

      return false;
    }
  }

  /**
   * Get next eligible job based on conditions
   */
  async getNextEligibleJob() {
    for (const job of this.queue) {
      if (await this.isJobEligible(job)) {
        return job;
      }
    }
    return null;
  }

  /**
   * Check if job is eligible for processing
   */
  async isJobEligible(job) {
    // Check job state
    if (job.state !== JobState.PENDING && job.state !== JobState.RETRYING) {
      return false;
    }

    // Check processing conditions
    switch (job.conditions) {
      case ProcessingConditions.WIFI_ONLY:
        if (!await this.isWifiConnected()) {
          return false;
        }
        break;
      case ProcessingConditions.CHARGING_ONLY:
        if (!await this.isCharging()) {
          return false;
        }
        break;
      case ProcessingConditions.IDLE_ONLY:
        if (this.appState !== 'background' && this.appState !== 'inactive') {
          return false;
        }
        break;
    }

    // Check resource availability
    if (!await this.hasRequiredResources()) {
      return false;
    }

    return true;
  }

  /**
   * Execute job based on type
   */
  async executeJob(job) {
    switch (job.type) {
      case 'pose_analysis':
        return await this.executePoseAnalysisJob(job);
      case 'video_processing':
        return await this.executeVideoProcessingJob(job);
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  /**
   * Execute pose analysis job
   */
  async executePoseAnalysisJob(job) {
    const { videoUri, exerciseType, deviceTier } = job.data;

    // Process video with progress tracking
    const result = await videoProcessor.processVideo(videoUri, {
      exerciseType,
      deviceTier,
      onProgress: (progress) => {
        job.progress = progress;
        job.updatedAt = Date.now();

        // Emit progress event
        this.emit('jobProgress', { job, progress });

        // Callback
        if (job.callbacks.onProgress) {
          job.callbacks.onProgress(progress);
        }
      }
    });

    return result;
  }

  /**
   * Execute video processing job
   */
  async executeVideoProcessingJob(job) {
    // Similar to pose analysis but could have different parameters
    return await this.executePoseAnalysisJob(job);
  }

  /**
   * Handle job failure
   */
  async handleJobFailure(job, error) {
    job.error = error.message;
    job.updatedAt = Date.now();
    job.retries++;

    // Check if we should retry
    if (job.retries < MAX_RETRIES) {
      // Calculate retry delay with exponential backoff
      const retryDelay = RETRY_DELAY_BASE * Math.pow(2, job.retries - 1);

      job.state = JobState.RETRYING;

      console.log('BackgroundQueue: Retrying job', {
        id: job.id,
        retries: job.retries,
        delay: retryDelay
      });

      // Schedule retry
      setTimeout(() => {
        job.state = JobState.PENDING;
        this.queue.push(job);
        this.sortQueue();
        this.saveQueue();

        // Resume processing
        if (this.canProcess()) {
          this.startProcessing();
        }
      }, retryDelay);

    } else {
      // Max retries reached, mark as failed
      job.state = JobState.FAILED;
      job.completedAt = Date.now();

      // Remove from active jobs
      this.activeJobs.delete(job.id);

      // Emit failure event
      this.emit('jobFailed', { job, error });

      // Callback
      if (job.callbacks.onError) {
        job.callbacks.onError(error);
      }

      // Save failed job
      await this.saveJobResult(job.id, { error: error.message });
    }

    // Save queue state
    await this.saveQueue();
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId) {
    // Check if job is in queue
    const queueIndex = this.queue.findIndex(j => j.id === jobId);
    if (queueIndex !== -1) {
      const job = this.queue[queueIndex];
      job.state = JobState.CANCELLED;
      this.queue.splice(queueIndex, 1);

      // Emit cancellation event
      this.emit('jobCancelled', job);

      await this.saveQueue();
      return true;
    }

    // Check if job is active
    if (this.activeJobs.has(jobId)) {
      const job = this.activeJobs.get(jobId);
      job.state = JobState.CANCELLED;

      // Try to cancel video processor if it's processing
      if (job.type === 'pose_analysis' || job.type === 'video_processing') {
        videoProcessor.cancelProcessing();
      }

      this.activeJobs.delete(jobId);

      // Emit cancellation event
      this.emit('jobCancelled', job);

      await this.saveQueue();
      return true;
    }

    return false;
  }

  /**
   * Get job status
   */
  getJobStatus(jobId) {
    // Check active jobs
    if (this.activeJobs.has(jobId)) {
      return this.activeJobs.get(jobId);
    }

    // Check queue
    const queuedJob = this.queue.find(j => j.id === jobId);
    if (queuedJob) {
      return queuedJob;
    }

    // Check completed results
    if (this.jobResults.has(jobId)) {
      return {
        id: jobId,
        state: JobState.COMPLETED,
        result: this.jobResults.get(jobId)
      };
    }

    return null;
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    const status = {
      queueLength: this.queue.length,
      activeJobs: this.activeJobs.size,
      isProcessing: this.isProcessing,
      jobsByPriority: {},
      estimatedWaitTime: 0
    };

    // Count jobs by priority
    for (const priority of Object.values(JobPriority)) {
      status.jobsByPriority[priority] = this.queue.filter(j => j.priority === priority).length;
    }

    // Estimate wait time based on average processing time
    if (this.activeJobs.size > 0) {
      const avgProcessingTime = 30000; // 30 seconds average
      status.estimatedWaitTime = (this.queue.length / MAX_CONCURRENT_JOBS) * avgProcessingTime;
    }

    return status;
  }

  /**
   * Check if we can process jobs
   */
  async canProcess() {
    // Check if initialized
    if (!this.isInitialized) {
      return false;
    }

    // Check if queue is empty
    if (this.queue.length === 0) {
      return false;
    }

    // Check if we've reached max concurrent jobs
    if (this.activeJobs.size >= MAX_CONCURRENT_JOBS) {
      return false;
    }

    // Check resource availability
    if (!await this.hasRequiredResources()) {
      return false;
    }

    return true;
  }

  /**
   * Check if required resources are available
   */
  async hasRequiredResources() {
    // Check battery level
    const batteryLevel = await Battery.getBatteryLevelAsync();
    if (batteryLevel < MIN_BATTERY_LEVEL) {
      console.log('BackgroundQueue: Low battery, pausing processing');
      return false;
    }

    // Check memory availability (simplified check)
    // In production, would use native module for accurate memory info
    const memoryCheck = true; // Placeholder

    return memoryCheck;
  }

  /**
   * Check if WiFi is connected
   */
  async isWifiConnected() {
    const netInfo = await NetInfo.fetch();
    return netInfo.type === 'wifi' && netInfo.isConnected;
  }

  /**
   * Check if device is charging
   */
  async isCharging() {
    const batteryState = await Battery.getBatteryStateAsync();
    return batteryState === Battery.BatteryState.CHARGING ||
           batteryState === Battery.BatteryState.FULL;
  }

  /**
   * Set up battery monitoring
   */
  async setupBatteryMonitoring() {
    try {
      // Get initial battery state
      this.batteryState = await Battery.getBatteryStateAsync();

      // Subscribe to battery state changes
      Battery.addBatteryStateListener((state) => {
        this.batteryState = state.batteryState;

        // Start processing if now charging and was waiting
        if (state.batteryState === Battery.BatteryState.CHARGING) {
          if (this.canProcess()) {
            this.startProcessing();
          }
        }
      });
    } catch (error) {
      console.error('BackgroundQueue: Battery monitoring setup failed', error);
    }
  }

  /**
   * Handle app state changes
   */
  handleAppStateChange(nextAppState) {
    const prevState = this.appState;
    this.appState = nextAppState;

    console.log('BackgroundQueue: App state changed', {
      from: prevState,
      to: nextAppState
    });

    if (nextAppState === 'active') {
      // Resume processing when app becomes active
      if (this.canProcess()) {
        this.startProcessing();
      }
    } else if (nextAppState === 'background') {
      // Continue processing in background if allowed
      // Some jobs may be configured to only run in background
      if (this.canProcess()) {
        this.startProcessing();
      }
    }
  }

  /**
   * Handle network state changes
   */
  handleNetworkChange(state) {
    this.networkState = state;

    // Check if any jobs are waiting for WiFi
    const wifiJobs = this.queue.filter(j =>
      j.conditions === ProcessingConditions.WIFI_ONLY
    );

    if (state.type === 'wifi' && state.isConnected && wifiJobs.length > 0) {
      console.log('BackgroundQueue: WiFi connected, resuming WiFi-only jobs');
      if (this.canProcess()) {
        this.startProcessing();
      }
    }
  }

  /**
   * Save queue to storage
   */
  async saveQueue() {
    try {
      const queueData = {
        queue: this.queue.map(job => ({
          ...job,
          callbacks: undefined // Don't persist callbacks
        })),
        activeJobs: Array.from(this.activeJobs.entries()).map(([id, job]) => ({
          ...job,
          callbacks: undefined
        })),
        timestamp: Date.now()
      };

      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queueData));
    } catch (error) {
      console.error('BackgroundQueue: Failed to save queue', error);
    }
  }

  /**
   * Load queue from storage
   */
  async loadQueue() {
    try {
      const data = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);

      if (data) {
        const queueData = JSON.parse(data);

        // Restore queue
        this.queue = queueData.queue || [];

        // Restore active jobs (mark as pending to retry)
        if (queueData.activeJobs) {
          queueData.activeJobs.forEach(job => {
            job.state = JobState.PENDING;
            job.retries = (job.retries || 0) + 1;
            this.queue.push(job);
          });
        }

        // Sort queue
        this.sortQueue();

        console.log('BackgroundQueue: Loaded queue', {
          queueLength: this.queue.length
        });
      }
    } catch (error) {
      console.error('BackgroundQueue: Failed to load queue', error);
    }
  }

  /**
   * Save job result
   */
  async saveJobResult(jobId, result) {
    try {
      const key = `${JOB_STORAGE_PREFIX}${jobId}`;
      await AsyncStorage.setItem(key, JSON.stringify({
        result,
        timestamp: Date.now()
      }));

      // Clean up old results after 24 hours
      setTimeout(() => {
        AsyncStorage.removeItem(key);
      }, 24 * 60 * 60 * 1000);
    } catch (error) {
      console.error('BackgroundQueue: Failed to save job result', error);
    }
  }

  /**
   * Get job result
   */
  async getJobResult(jobId) {
    try {
      // Check in-memory results first
      if (this.jobResults.has(jobId)) {
        return this.jobResults.get(jobId);
      }

      // Check storage
      const key = `${JOB_STORAGE_PREFIX}${jobId}`;
      const data = await AsyncStorage.getItem(key);

      if (data) {
        const { result } = JSON.parse(data);
        return result;
      }
    } catch (error) {
      console.error('BackgroundQueue: Failed to get job result', error);
    }

    return null;
  }

  /**
   * Clear all jobs
   */
  async clearQueue() {
    // Cancel all active jobs
    for (const [jobId] of this.activeJobs) {
      await this.cancelJob(jobId);
    }

    // Clear queue
    this.queue = [];

    // Save empty queue
    await this.saveQueue();

    // Stop processing
    this.stopProcessing();

    console.log('BackgroundQueue: Queue cleared');
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
          console.error(`BackgroundQueue: Error in event listener for ${event}`, error);
        }
      });
    }
  }
}

// Export singleton instance
export default new BackgroundQueue();