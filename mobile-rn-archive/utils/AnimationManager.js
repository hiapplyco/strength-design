import { InteractionManager, Platform } from 'react-native';

/**
 * AnimationManager - Centralized animation control to prevent crashes
 * Implements throttling, batching, and proper cleanup
 */
class AnimationManager {
  constructor() {
    this.activeAnimations = new Set();
    this.pendingAnimations = [];
    this.maxConcurrent = Platform.select({ ios: 60, android: 40 });
    this.isProcessing = false;
    this.interactionHandle = null;
    this.frameCallbacks = new Set();
    this.lastFrameTime = 0;
    this.targetFPS = 60;
    this.frameInterval = 1000 / this.targetFPS;
  }
  
  /**
   * Register an animation for tracking
   */
  register(animation, priority = 'normal') {
    const animationWrapper = {
      animation,
      priority,
      id: Date.now() + Math.random(),
      startTime: Date.now(),
    };
    
    if (this.activeAnimations.size < this.maxConcurrent) {
      this.activeAnimations.add(animationWrapper);
      return animationWrapper.id;
    } else {
      // Queue if too many animations
      this.pendingAnimations.push(animationWrapper);
      this.processPending();
      return animationWrapper.id;
    }
  }
  
  /**
   * Unregister an animation
   */
  unregister(animationId) {
    // Remove from active
    for (const anim of this.activeAnimations) {
      if (anim.id === animationId) {
        this.stopAnimation(anim.animation);
        this.activeAnimations.delete(anim);
        break;
      }
    }
    
    // Remove from pending
    this.pendingAnimations = this.pendingAnimations.filter(
      anim => anim.id !== animationId
    );
    
    // Process next pending
    this.processPending();
  }
  
  /**
   * Stop an animation safely
   */
  stopAnimation(animation) {
    try {
      if (animation && typeof animation.stop === 'function') {
        animation.stop();
      }
      if (animation && typeof animation.reset === 'function') {
        animation.reset();
      }
      if (animation && animation._animation) {
        animation._animation = null;
      }
    } catch (error) {
      console.warn('Failed to stop animation:', error);
    }
  }
  
  /**
   * Process pending animations
   */
  processPending() {
    if (this.isProcessing || this.pendingAnimations.length === 0) return;
    
    this.isProcessing = true;
    
    InteractionManager.runAfterInteractions(() => {
      while (
        this.activeAnimations.size < this.maxConcurrent &&
        this.pendingAnimations.length > 0
      ) {
        // Sort by priority and age
        this.pendingAnimations.sort((a, b) => {
          if (a.priority === 'high' && b.priority !== 'high') return -1;
          if (b.priority === 'high' && a.priority !== 'high') return 1;
          return a.startTime - b.startTime;
        });
        
        const next = this.pendingAnimations.shift();
        if (next) {
          this.activeAnimations.add(next);
        }
      }
      
      this.isProcessing = false;
    });
  }
  
  /**
   * Stop all animations immediately
   */
  stopAll() {
    // Cancel interaction handle
    if (this.interactionHandle) {
      InteractionManager.clearInteractionHandle(this.interactionHandle);
      this.interactionHandle = null;
    }
    
    // Stop all active animations
    for (const anim of this.activeAnimations) {
      this.stopAnimation(anim.animation);
    }
    
    // Clear all
    this.activeAnimations.clear();
    this.pendingAnimations = [];
    this.frameCallbacks.clear();
  }
  
  /**
   * Throttle animation frame updates
   */
  requestAnimationFrame(callback) {
    const now = Date.now();
    const timeToCall = Math.max(0, this.frameInterval - (now - this.lastFrameTime));
    
    const id = setTimeout(() => {
      callback(now + timeToCall);
      this.lastFrameTime = now + timeToCall;
      this.frameCallbacks.delete(id);
    }, timeToCall);
    
    this.frameCallbacks.add(id);
    return id;
  }
  
  /**
   * Cancel animation frame
   */
  cancelAnimationFrame(id) {
    clearTimeout(id);
    this.frameCallbacks.delete(id);
  }
  
  /**
   * Get current animation load
   */
  getLoad() {
    return {
      active: this.activeAnimations.size,
      pending: this.pendingAnimations.length,
      total: this.activeAnimations.size + this.pendingAnimations.length,
      loadPercent: (this.activeAnimations.size / this.maxConcurrent) * 100,
    };
  }
  
  /**
   * Adjust max concurrent animations based on performance
   */
  adjustCapacity(factor = 1) {
    const baseCapacity = Platform.select({ ios: 60, android: 40 });
    this.maxConcurrent = Math.floor(baseCapacity * factor);
    this.processPending();
  }
  
  /**
   * Clean up old animations
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 10000; // 10 seconds
    
    // Remove stale animations
    for (const anim of this.activeAnimations) {
      if (now - anim.startTime > maxAge) {
        this.stopAnimation(anim.animation);
        this.activeAnimations.delete(anim);
      }
    }
    
    // Process pending
    this.processPending();
  }
}

// Singleton instance
const animationManager = new AnimationManager();

// Auto cleanup every 5 seconds
setInterval(() => {
  animationManager.cleanup();
}, 5000);

export default animationManager;