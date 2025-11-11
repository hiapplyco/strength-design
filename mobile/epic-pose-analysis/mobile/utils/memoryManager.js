/**
 * Memory Manager Utility
 * Aggressive memory management for video and frame processing
 *
 * Features:
 * - Memory usage monitoring and limits
 * - Automatic garbage collection triggers
 * - Frame recycling pool management
 * - Cache eviction strategies
 * - Memory pressure detection
 * - Adaptive processing based on available memory
 */

import { Platform, NativeModules } from 'react-native';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';

// Memory management constants
const MEMORY_CHECK_INTERVAL = 2000; // Check every 2 seconds
const LOW_MEMORY_THRESHOLD = 0.8; // 80% memory usage is considered high
const CRITICAL_MEMORY_THRESHOLD = 0.9; // 90% is critical
const CACHE_SIZE_LIMIT_MB = 100; // Maximum cache size in MB
const FRAME_POOL_LIMIT = 50; // Maximum frames in pool
const MIN_FREE_MEMORY_MB = 200; // Minimum free memory to maintain

// Cache priority levels
const CachePriority = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3
};

// Memory pressure levels
const MemoryPressure = {
  NORMAL: 'normal',
  WARNING: 'warning',
  CRITICAL: 'critical'
};

class MemoryManager {
  constructor() {
    this.currentMemoryUsage = 0;
    this.totalMemory = Device.totalMemory || 2 * 1024 * 1024 * 1024; // Default 2GB
    this.memoryPressure = MemoryPressure.NORMAL;
    this.cacheSize = 0;
    this.framePool = [];
    this.cacheRegistry = new Map();
    this.memoryCheckTimer = null;
    this.listeners = new Map();
    this.gcForceCount = 0;
    this.lastGCTime = 0;
    this.memoryHistory = [];
    this.isMonitoring = false;
  }

  /**
   * Initialize memory manager
   */
  async initialize() {
    try {
      // Get device memory info
      this.totalMemory = Device.totalMemory || 2 * 1024 * 1024 * 1024;

      // Calculate memory limits based on device
      this.calculateMemoryLimits();

      // Clean up old cache files
      await this.cleanupOldCacheFiles();

      // Initialize frame pool
      this.initializeFramePool();

      // Start memory monitoring
      this.startMemoryMonitoring();

      console.log('MemoryManager: Initialized', {
        totalMemory: this.formatBytes(this.totalMemory),
        limits: {
          cache: `${CACHE_SIZE_LIMIT_MB}MB`,
          minFree: `${MIN_FREE_MEMORY_MB}MB`
        }
      });

      return { success: true };
    } catch (error) {
      console.error('MemoryManager: Initialization failed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate memory limits based on device capabilities
   */
  calculateMemoryLimits() {
    const totalMemoryGB = this.totalMemory / (1024 * 1024 * 1024);

    if (totalMemoryGB <= 2) {
      // Low-end device: aggressive memory management
      this.maxCacheSize = 50 * 1024 * 1024; // 50MB
      this.maxFramePoolSize = 20;
      this.gcThreshold = 0.7; // Trigger GC at 70% memory usage
    } else if (totalMemoryGB <= 4) {
      // Mid-range device
      this.maxCacheSize = 100 * 1024 * 1024; // 100MB
      this.maxFramePoolSize = 50;
      this.gcThreshold = 0.8; // Trigger GC at 80% memory usage
    } else {
      // High-end device
      this.maxCacheSize = 200 * 1024 * 1024; // 200MB
      this.maxFramePoolSize = 100;
      this.gcThreshold = 0.85; // Trigger GC at 85% memory usage
    }
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.memoryCheckTimer = setInterval(() => {
      this.checkMemoryUsage();
    }, MEMORY_CHECK_INTERVAL);
  }

  /**
   * Stop memory monitoring
   */
  stopMemoryMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.memoryCheckTimer) {
      clearInterval(this.memoryCheckTimer);
      this.memoryCheckTimer = null;
    }
  }

  /**
   * Check current memory usage
   */
  async checkMemoryUsage() {
    try {
      const memoryInfo = await this.getMemoryInfo();

      // Update current memory usage
      this.currentMemoryUsage = memoryInfo.used;

      // Calculate memory pressure
      const usageRatio = memoryInfo.used / memoryInfo.total;
      const previousPressure = this.memoryPressure;

      if (usageRatio >= CRITICAL_MEMORY_THRESHOLD) {
        this.memoryPressure = MemoryPressure.CRITICAL;
      } else if (usageRatio >= LOW_MEMORY_THRESHOLD) {
        this.memoryPressure = MemoryPressure.WARNING;
      } else {
        this.memoryPressure = MemoryPressure.NORMAL;
      }

      // Record in history
      this.recordMemoryHistory(memoryInfo);

      // Handle pressure changes
      if (this.memoryPressure !== previousPressure) {
        this.handleMemoryPressureChange(previousPressure, this.memoryPressure);
      }

      // Trigger cleanup if needed
      if (usageRatio >= this.gcThreshold) {
        await this.triggerMemoryCleanup(this.memoryPressure);
      }

      return memoryInfo;
    } catch (error) {
      console.error('MemoryManager: Failed to check memory', error);
      return null;
    }
  }

  /**
   * Get current memory information
   */
  async getMemoryInfo() {
    if (Platform.OS === 'ios') {
      // iOS memory info (would require native module)
      return {
        total: this.totalMemory,
        used: this.estimateMemoryUsage(),
        free: this.totalMemory - this.estimateMemoryUsage(),
        available: this.totalMemory * 0.3 // Estimate
      };
    } else if (Platform.OS === 'android') {
      // Android memory info
      if (global.performance && global.performance.memory) {
        return {
          total: global.performance.memory.jsHeapSizeLimit,
          used: global.performance.memory.usedJSHeapSize,
          free: global.performance.memory.jsHeapSizeLimit - global.performance.memory.usedJSHeapSize,
          available: global.performance.memory.jsHeapSizeLimit * 0.3
        };
      }
    }

    // Fallback estimation
    return {
      total: this.totalMemory,
      used: this.estimateMemoryUsage(),
      free: this.totalMemory - this.estimateMemoryUsage(),
      available: this.totalMemory * 0.3
    };
  }

  /**
   * Estimate memory usage
   */
  estimateMemoryUsage() {
    // Rough estimation based on cache size and frame pool
    const cacheMemory = this.cacheSize;
    const framePoolMemory = this.framePool.length * 1024 * 1024; // Assume 1MB per frame
    const baseMemory = 100 * 1024 * 1024; // Base app memory

    return baseMemory + cacheMemory + framePoolMemory;
  }

  /**
   * Handle memory pressure changes
   */
  handleMemoryPressureChange(oldPressure, newPressure) {
    console.log(`MemoryManager: Memory pressure changed from ${oldPressure} to ${newPressure}`);

    // Emit event
    this.emit('memoryPressureChanged', {
      previous: oldPressure,
      current: newPressure,
      memoryInfo: {
        used: this.currentMemoryUsage,
        total: this.totalMemory,
        percentage: (this.currentMemoryUsage / this.totalMemory) * 100
      }
    });

    // Take action based on new pressure level
    switch (newPressure) {
      case MemoryPressure.CRITICAL:
        // Aggressive cleanup
        this.emergencyMemoryCleanup();
        break;
      case MemoryPressure.WARNING:
        // Moderate cleanup
        this.moderateMemoryCleanup();
        break;
      case MemoryPressure.NORMAL:
        // Resume normal operations
        console.log('MemoryManager: Memory pressure normalized');
        break;
    }
  }

  /**
   * Trigger memory cleanup based on pressure level
   */
  async triggerMemoryCleanup(pressure) {
    console.log(`MemoryManager: Triggering cleanup for ${pressure} pressure`);

    switch (pressure) {
      case MemoryPressure.CRITICAL:
        await this.emergencyMemoryCleanup();
        break;
      case MemoryPressure.WARNING:
        await this.moderateMemoryCleanup();
        break;
      default:
        await this.routineMemoryCleanup();
    }

    // Force garbage collection if available
    this.forceGarbageCollection();
  }

  /**
   * Emergency memory cleanup (critical pressure)
   */
  async emergencyMemoryCleanup() {
    console.log('MemoryManager: Emergency cleanup initiated');

    // Clear all caches immediately
    await this.clearAllCaches();

    // Clear frame pool
    this.clearFramePool();

    // Clear AsyncStorage cache
    await this.clearAsyncStorageCache();

    // Delete temporary files
    await this.deleteTemporaryFiles();

    // Force multiple GC cycles
    for (let i = 0; i < 3; i++) {
      this.forceGarbageCollection();
      await this.delay(100);
    }

    // Emit emergency cleanup event
    this.emit('emergencyCleanup', {
      clearedCache: true,
      clearedFramePool: true,
      clearedTempFiles: true
    });
  }

  /**
   * Moderate memory cleanup (warning pressure)
   */
  async moderateMemoryCleanup() {
    console.log('MemoryManager: Moderate cleanup initiated');

    // Clear low priority caches
    await this.clearCacheByPriority(CachePriority.LOW);

    // Reduce frame pool size
    this.reduceFramePool(Math.floor(this.framePool.length / 2));

    // Clear old temporary files
    await this.deleteOldTemporaryFiles(3600000); // Delete files older than 1 hour

    // Force GC
    this.forceGarbageCollection();
  }

  /**
   * Routine memory cleanup (normal pressure)
   */
  async routineMemoryCleanup() {
    // Clear expired caches
    await this.clearExpiredCaches();

    // Optimize frame pool
    this.optimizeFramePool();

    // Clean old temp files
    await this.deleteOldTemporaryFiles(86400000); // Delete files older than 24 hours
  }

  /**
   * Initialize frame pool
   */
  initializeFramePool() {
    const poolSize = Math.min(FRAME_POOL_LIMIT, this.maxFramePoolSize);

    for (let i = 0; i < poolSize; i++) {
      this.framePool.push(this.createFrameObject(i));
    }
  }

  /**
   * Create frame object for pool
   */
  createFrameObject(id) {
    return {
      id,
      data: null,
      uri: null,
      timestamp: null,
      inUse: false,
      lastUsed: null,
      usageCount: 0
    };
  }

  /**
   * Get frame from pool
   */
  getFrameFromPool() {
    // Find unused frame
    let frame = this.framePool.find(f => !f.inUse);

    if (!frame && this.framePool.length < this.maxFramePoolSize) {
      // Create new frame if under limit
      frame = this.createFrameObject(this.framePool.length);
      this.framePool.push(frame);
    } else if (!frame) {
      // Recycle least recently used frame
      frame = this.recycleLRUFrame();
    }

    if (frame) {
      frame.inUse = true;
      frame.lastUsed = Date.now();
      frame.usageCount++;
    }

    return frame;
  }

  /**
   * Return frame to pool
   */
  returnFrameToPool(frame) {
    if (!frame) return;

    // Clear frame data
    frame.data = null;
    frame.uri = null;
    frame.timestamp = null;
    frame.inUse = false;

    // Delete associated file if exists
    if (frame.uri) {
      FileSystem.deleteAsync(frame.uri, { idempotent: true }).catch(() => {});
    }
  }

  /**
   * Recycle least recently used frame
   */
  recycleLRUFrame() {
    const inUseFrames = this.framePool.filter(f => f.inUse);
    if (inUseFrames.length === 0) return null;

    // Sort by last used time
    inUseFrames.sort((a, b) => (a.lastUsed || 0) - (b.lastUsed || 0));

    const frame = inUseFrames[0];
    this.returnFrameToPool(frame);

    return frame;
  }

  /**
   * Clear frame pool
   */
  clearFramePool() {
    for (const frame of this.framePool) {
      this.returnFrameToPool(frame);
    }
    this.framePool = [];
    console.log('MemoryManager: Frame pool cleared');
  }

  /**
   * Reduce frame pool size
   */
  reduceFramePool(newSize) {
    if (newSize >= this.framePool.length) return;

    // Remove unused frames first
    const unusedFrames = this.framePool.filter(f => !f.inUse);
    const toRemove = this.framePool.length - newSize;

    for (let i = 0; i < Math.min(toRemove, unusedFrames.length); i++) {
      const index = this.framePool.indexOf(unusedFrames[i]);
      if (index !== -1) {
        this.framePool.splice(index, 1);
      }
    }

    console.log(`MemoryManager: Frame pool reduced to ${this.framePool.length} frames`);
  }

  /**
   * Optimize frame pool
   */
  optimizeFramePool() {
    // Remove frames that haven't been used recently
    const now = Date.now();
    const maxAge = 60000; // 1 minute

    this.framePool = this.framePool.filter(frame => {
      if (!frame.inUse && frame.lastUsed && (now - frame.lastUsed) > maxAge) {
        this.returnFrameToPool(frame);
        return false;
      }
      return true;
    });
  }

  /**
   * Register cache entry
   */
  registerCache(key, size, priority = CachePriority.NORMAL) {
    this.cacheRegistry.set(key, {
      size,
      priority,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now()
    });

    this.cacheSize += size;

    // Check if cache size exceeds limit
    if (this.cacheSize > this.maxCacheSize) {
      this.evictCacheEntries();
    }
  }

  /**
   * Access cache entry
   */
  accessCache(key) {
    if (this.cacheRegistry.has(key)) {
      const entry = this.cacheRegistry.get(key);
      entry.accessCount++;
      entry.lastAccessed = Date.now();
    }
  }

  /**
   * Evict cache entries based on LRU and priority
   */
  evictCacheEntries() {
    const entries = Array.from(this.cacheRegistry.entries());

    // Sort by priority and last accessed
    entries.sort((a, b) => {
      // First by priority (higher priority = lower number)
      if (a[1].priority !== b[1].priority) {
        return b[1].priority - a[1].priority;
      }
      // Then by last accessed (older first)
      return a[1].lastAccessed - b[1].lastAccessed;
    });

    // Evict until under limit
    let evicted = 0;
    while (this.cacheSize > this.maxCacheSize * 0.8 && entries.length > 0) {
      const [key, entry] = entries.shift();
      this.cacheRegistry.delete(key);
      this.cacheSize -= entry.size;
      evicted++;

      // Emit eviction event
      this.emit('cacheEvicted', { key, size: entry.size });
    }

    console.log(`MemoryManager: Evicted ${evicted} cache entries`);
  }

  /**
   * Clear all caches
   */
  async clearAllCaches() {
    this.cacheRegistry.clear();
    this.cacheSize = 0;

    // Clear file system cache
    await this.clearFileSystemCache();

    console.log('MemoryManager: All caches cleared');
  }

  /**
   * Clear cache by priority
   */
  async clearCacheByPriority(maxPriority) {
    const toRemove = [];

    for (const [key, entry] of this.cacheRegistry) {
      if (entry.priority >= maxPriority) {
        toRemove.push(key);
        this.cacheSize -= entry.size;
      }
    }

    toRemove.forEach(key => this.cacheRegistry.delete(key));

    console.log(`MemoryManager: Cleared ${toRemove.length} cache entries with priority >= ${maxPriority}`);
  }

  /**
   * Clear expired caches
   */
  async clearExpiredCaches() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    const toRemove = [];

    for (const [key, entry] of this.cacheRegistry) {
      if (now - entry.timestamp > maxAge) {
        toRemove.push(key);
        this.cacheSize -= entry.size;
      }
    }

    toRemove.forEach(key => this.cacheRegistry.delete(key));

    if (toRemove.length > 0) {
      console.log(`MemoryManager: Cleared ${toRemove.length} expired cache entries`);
    }
  }

  /**
   * Clear file system cache
   */
  async clearFileSystemCache() {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      const files = await FileSystem.readDirectoryAsync(cacheDir);

      for (const file of files) {
        if (file.startsWith('frame_') || file.startsWith('video_') || file.startsWith('pose_')) {
          await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
        }
      }

      console.log('MemoryManager: File system cache cleared');
    } catch (error) {
      console.error('MemoryManager: Failed to clear file cache', error);
    }
  }

  /**
   * Clear AsyncStorage cache entries
   */
  async clearAsyncStorageCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key =>
        key.includes('_cache') ||
        key.includes('_temp') ||
        key.includes('frame_')
      );

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        console.log(`MemoryManager: Cleared ${cacheKeys.length} AsyncStorage cache entries`);
      }
    } catch (error) {
      console.error('MemoryManager: Failed to clear AsyncStorage cache', error);
    }
  }

  /**
   * Delete temporary files
   */
  async deleteTemporaryFiles() {
    try {
      const tempDir = `${FileSystem.cacheDirectory}temp/`;

      if (await FileSystem.getInfoAsync(tempDir).then(info => info.exists)) {
        await FileSystem.deleteAsync(tempDir, { idempotent: true });
        await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
      }

      console.log('MemoryManager: Temporary files deleted');
    } catch (error) {
      console.error('MemoryManager: Failed to delete temp files', error);
    }
  }

  /**
   * Delete old temporary files
   */
  async deleteOldTemporaryFiles(maxAge) {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      const files = await FileSystem.readDirectoryAsync(cacheDir);
      const now = Date.now();
      let deleted = 0;

      for (const file of files) {
        const filePath = `${cacheDir}${file}`;
        const info = await FileSystem.getInfoAsync(filePath);

        if (info.exists && !info.isDirectory) {
          const age = now - info.modificationTime;
          if (age > maxAge) {
            await FileSystem.deleteAsync(filePath, { idempotent: true });
            deleted++;
          }
        }
      }

      if (deleted > 0) {
        console.log(`MemoryManager: Deleted ${deleted} old temporary files`);
      }
    } catch (error) {
      console.error('MemoryManager: Failed to delete old temp files', error);
    }
  }

  /**
   * Clean up old cache files on initialization
   */
  async cleanupOldCacheFiles() {
    // Delete files older than 7 days
    await this.deleteOldTemporaryFiles(7 * 24 * 60 * 60 * 1000);
  }

  /**
   * Force garbage collection
   */
  forceGarbageCollection() {
    const now = Date.now();

    // Limit GC frequency (max once per 5 seconds)
    if (now - this.lastGCTime < 5000) {
      return;
    }

    if (global.gc) {
      global.gc();
      this.gcForceCount++;
      this.lastGCTime = now;
      console.log(`MemoryManager: Forced GC (count: ${this.gcForceCount})`);
    }
  }

  /**
   * Record memory history
   */
  recordMemoryHistory(memoryInfo) {
    this.memoryHistory.push({
      ...memoryInfo,
      timestamp: Date.now(),
      pressure: this.memoryPressure
    });

    // Keep only last 100 entries
    if (this.memoryHistory.length > 100) {
      this.memoryHistory.shift();
    }
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    if (this.memoryHistory.length === 0) {
      return null;
    }

    const recent = this.memoryHistory.slice(-10);
    const avgUsage = recent.reduce((sum, m) => sum + m.used, 0) / recent.length;
    const maxUsage = Math.max(...recent.map(m => m.used));
    const minUsage = Math.min(...recent.map(m => m.used));

    return {
      current: {
        used: this.currentMemoryUsage,
        total: this.totalMemory,
        percentage: (this.currentMemoryUsage / this.totalMemory) * 100,
        pressure: this.memoryPressure
      },
      average: avgUsage,
      peak: maxUsage,
      minimum: minUsage,
      cacheSize: this.cacheSize,
      framePoolSize: this.framePool.length,
      gcCount: this.gcForceCount
    };
  }

  /**
   * Check if safe to allocate memory
   */
  canAllocate(bytes) {
    const memoryInfo = this.getMemoryInfo();
    const available = memoryInfo.free;
    const required = bytes + (MIN_FREE_MEMORY_MB * 1024 * 1024);

    return available > required;
  }

  /**
   * Request memory allocation
   */
  async requestMemory(bytes, priority = CachePriority.NORMAL) {
    if (this.canAllocate(bytes)) {
      return true;
    }

    // Try to free memory based on priority
    if (priority <= CachePriority.HIGH) {
      await this.clearCacheByPriority(CachePriority.LOW);
      this.forceGarbageCollection();

      // Check again
      if (this.canAllocate(bytes)) {
        return true;
      }
    }

    if (priority <= CachePriority.CRITICAL) {
      await this.moderateMemoryCleanup();

      // Check again
      return this.canAllocate(bytes);
    }

    return false;
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
          console.error(`MemoryManager: Error in event listener for ${event}`, error);
        }
      });
    }
  }

  /**
   * Cleanup and shutdown
   */
  shutdown() {
    this.stopMemoryMonitoring();
    this.clearFramePool();
    this.listeners.clear();
    console.log('MemoryManager: Shutdown complete');
  }
}

// Export singleton instance
export default new MemoryManager();