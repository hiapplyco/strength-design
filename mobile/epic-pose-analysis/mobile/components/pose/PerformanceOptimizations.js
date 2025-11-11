/**
 * Performance Optimizations for Pose Analysis Video Player
 * Advanced performance utilities and React.memo wrappers for 60fps smooth playback
 * 
 * Features:
 * - Memoized components with shallow comparison
 * - Frame rate monitoring and optimization
 * - Memory leak prevention
 * - Efficient rendering strategies
 * - Background processing utilities
 */

import React from 'react';
import { Platform } from 'react-native';

// Performance monitoring utilities
export class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = Date.now();
    this.fps = 60;
    this.frameDrops = 0;
  }

  startMonitoring() {
    if (!__DEV__) return;
    
    const monitor = () => {
      const now = Date.now();
      const delta = now - this.lastTime;
      
      if (delta >= 1000) {
        this.fps = (this.frameCount * 1000) / delta;
        
        if (this.fps < 50) {
          this.frameDrops++;
          console.warn(`Frame drop detected: ${this.fps.toFixed(1)} FPS`);
        }
        
        this.frameCount = 0;
        this.lastTime = now;
      }
      
      this.frameCount++;
      requestAnimationFrame(monitor);
    };
    
    requestAnimationFrame(monitor);
  }

  getPerformanceMetrics() {
    return {
      currentFPS: this.fps,
      frameDrops: this.frameDrops,
      performanceGrade: this.fps > 55 ? 'excellent' : this.fps > 45 ? 'good' : 'poor'
    };
  }
}

// Shallow comparison for React.memo
export const shallowCompare = (prevProps, nextProps) => {
  const keys1 = Object.keys(prevProps);
  const keys2 = Object.keys(nextProps);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let key of keys1) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
};

// Deep comparison for complex objects (use sparingly)
export const deepCompare = (obj1, obj2) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

// Memoization utilities
export const memoizeWithTimeout = (fn, timeout = 100) => {
  const cache = new Map();
  
  return (...args) => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < timeout) {
      return cached.value;
    }
    
    const result = fn(...args);
    cache.set(key, {
      value: result,
      timestamp: Date.now()
    });
    
    return result;
  };
};

// Throttle function for expensive operations
export const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

// Debounce function for rapid-fire events
export const debounce = (func, delay) => {
  let timeoutId;
  
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// Memory-efficient landmark processing
export const processLandmarksEfficiently = memoizeWithTimeout((landmarks, threshold = 0.5) => {
  if (!Array.isArray(landmarks)) return [];
  
  // Use ArrayBuffer for better memory efficiency with large datasets
  const validLandmarks = [];
  
  for (let i = 0; i < landmarks.length; i++) {
    const landmark = landmarks[i];
    if (landmark && landmark.inFrameLikelihood >= threshold) {
      validLandmarks.push({
        index: i,
        x: landmark.x,
        y: landmark.y,
        z: landmark.z || 0,
        confidence: landmark.inFrameLikelihood
      });
    }
  }
  
  return validLandmarks;
}, 50);

// Efficient coordinate transformation
export const transformCoordinates = memoizeWithTimeout((
  landmarks,
  scaleX,
  scaleY,
  offsetX,
  offsetY,
  videoWidth,
  videoHeight
) => {
  if (!landmarks.length) return [];
  
  const transformed = new Array(landmarks.length);
  
  for (let i = 0; i < landmarks.length; i++) {
    const landmark = landmarks[i];
    transformed[i] = {
      ...landmark,
      screenX: (landmark.x * videoWidth * scaleX) + offsetX,
      screenY: (landmark.y * videoHeight * scaleY) + offsetY,
    };
  }
  
  return transformed;
}, 33); // ~30fps update rate

// Platform-specific optimizations
export const PlatformOptimizations = {
  // iOS specific optimizations
  ios: {
    enableCADisplayLink: true,
    preferCAMetalLayer: true,
    useNativeDriver: true,
  },
  
  // Android specific optimizations
  android: {
    enableVulkan: Platform.Version >= 24,
    useTextureView: true,
    enableHardwareAcceleration: true,
  },
  
  // Web specific optimizations
  web: {
    useOffscreenCanvas: typeof OffscreenCanvas !== 'undefined',
    enableWebGL: true,
    preferRequestIdleCallback: typeof requestIdleCallback !== 'undefined',
  }
};

// Memory management utilities
export class MemoryManager {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 50; // Maximum cached items
    this.cleanupInterval = null;
  }

  set(key, value, ttl = 5000) {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now - item.timestamp > item.ttl) {
          this.cache.delete(key);
        }
      }
    }, 10000); // Clean up every 10 seconds
  }

  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      utilizationPercent: (this.cache.size / this.maxCacheSize) * 100
    };
  }
}

// High-performance component wrappers
export const MemoizedVideoPlayer = React.memo(({ children, ...props }) => children, shallowCompare);

export const MemoizedLandmarkRenderer = React.memo(
  ({ landmarks, videoDimensions, containerDimensions, ...otherProps }) => {
    // Only re-render if critical props change
    return React.createElement('div', otherProps);
  },
  (prevProps, nextProps) => {
    // Custom comparison for landmark data
    return (
      prevProps.landmarks === nextProps.landmarks &&
      prevProps.videoDimensions?.width === nextProps.videoDimensions?.width &&
      prevProps.videoDimensions?.height === nextProps.videoDimensions?.height &&
      prevProps.containerDimensions?.width === nextProps.containerDimensions?.width &&
      prevProps.containerDimensions?.height === nextProps.containerDimensions?.height &&
      shallowCompare(prevProps, nextProps)
    );
  }
);

// Render optimization utilities
export const shouldSkipRender = (lastRenderTime, minFrameTime = 16.67) => {
  return Date.now() - lastRenderTime < minFrameTime;
};

// Batch operations for better performance
export const batchOperations = (operations, batchSize = 10) => {
  return new Promise((resolve) => {
    let index = 0;
    
    const processBatch = () => {
      const batch = operations.slice(index, index + batchSize);
      
      batch.forEach(operation => {
        try {
          operation();
        } catch (error) {
          console.error('Batch operation error:', error);
        }
      });
      
      index += batchSize;
      
      if (index < operations.length) {
        // Use requestAnimationFrame for smooth processing
        requestAnimationFrame(processBatch);
      } else {
        resolve();
      }
    };
    
    processBatch();
  });
};

// Export performance monitor instance
export const performanceMonitor = new PerformanceMonitor();
export const memoryManager = new MemoryManager();

// Initialize performance monitoring in development
if (__DEV__) {
  performanceMonitor.startMonitoring();
  memoryManager.startCleanup();
}