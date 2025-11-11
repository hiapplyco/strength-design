// Animation Components Index
// Export all animation components and utilities for easy importing

export { default as NeonBorderCard } from './NeonBorderCard';
// Removed PixelShimmerLoader - use UnifiedLoader instead
export { 
  TransitionProvider, 
  useTransition, 
  withTransition,
  transitionUtils 
} from './PageTransitionManager';

// Re-export configuration and optimizations
export { ANIMATION_CONFIG, getContextualConfig } from '../../config/animations';
export { 
  DeviceCapabilities,
  getOptimalPixelSize,
  getOptimalDuration,
  getAdaptiveQualitySettings,
  getOptimizedAnimationConfig 
} from '../../utils/deviceOptimizations';