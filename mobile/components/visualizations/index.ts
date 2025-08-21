/**
 * Strength.Design Visualization Components
 * Advanced pixel-based animations for mobile fitness platform
 */

// Core visualization components
export { default as StrengthDesignLoader } from './StrengthDesignLoader';
export { default as MuscleAnimation } from './MuscleAnimation';
export { default as DNAHelixAnimation } from './DNAHelixAnimation';
export { default as EnergyBurstAnimation } from './EnergyBurstAnimation';
export { default as BarbellAnimation } from './BarbellAnimation';
export { default as HeartbeatAnimation } from './HeartbeatAnimation';

// Type definitions and interfaces
export * from './VisualizationTypes';

// Re-export commonly used types
export type {
  PixelData,
  AnimationConfig,
  AnimationType,
  PatternType,
  PatternDefinition,
  PerformanceMetrics,
  VisualizationHooks,
  StrengthDesignLoaderProps,
  MuscleAnimationProps,
  DNAHelixAnimationProps,
  EnergyBurstAnimationProps,
  BarbellAnimationProps,
  HeartbeatAnimationProps,
} from './VisualizationTypes';

// Brand colors and presets for easy access
export {
  BRAND_COLORS,
  ANIMATION_PRESETS,
  PERFORMANCE_CONFIG,
} from './VisualizationTypes';

/**
 * Animation Context Map
 * Recommended animations for different app contexts
 */
export const ANIMATION_CONTEXTS = {
  // Loading and initialization
  appLaunch: 'StrengthDesignLoader',
  dataLoading: 'StrengthDesignLoader',
  
  // Workout and fitness
  workoutStart: 'MuscleAnimation',
  exerciseLoading: 'BarbellAnimation',
  strengthTraining: 'BarbellAnimation',
  
  // Health and biometrics  
  heartRateMonitoring: 'HeartbeatAnimation',
  vitalsCheck: 'HeartbeatAnimation',
  healthSync: 'HeartbeatAnimation',
  
  // AI and personalization
  aiProcessing: 'DNAHelixAnimation',
  profileGeneration: 'DNAHelixAnimation',
  dataAnalysis: 'DNAHelixAnimation',
  
  // Achievements and rewards
  levelUp: 'EnergyBurstAnimation',
  achievement: 'EnergyBurstAnimation',
  milestone: 'EnergyBurstAnimation',
  celebration: 'EnergyBurstAnimation',
} as const;

/**
 * Animation Configuration Presets
 * Pre-configured settings for common use cases
 */
export const PRESET_CONFIGS = {
  quickLoad: {
    duration: 1500,
    intensity: 0.8,
    size: 200,
  },
  
  standardLoad: {
    duration: 2500,
    intensity: 1.0,
    size: 280,
  },
  
  dramaticEffect: {
    duration: 3500,
    intensity: 1.5,
    size: 350,
  },
  
  subtleTransition: {
    duration: 1000,
    intensity: 0.6,
    size: 150,
  },
} as const;

/**
 * Performance Optimization Utilities
 */
export const PERFORMANCE_UTILS = {
  /**
   * Determine optimal animation settings based on device performance
   */
  getOptimalSettings: (deviceTier: 'low' | 'mid' | 'high') => {
    switch (deviceTier) {
      case 'low':
        return {
          particleCount: 30,
          frameRate: 30,
          effects: 'minimal',
          ...PRESET_CONFIGS.subtleTransition,
        };
      case 'mid':
        return {
          particleCount: 50,
          frameRate: 60,
          effects: 'standard',
          ...PRESET_CONFIGS.standardLoad,
        };
      case 'high':
        return {
          particleCount: 80,
          frameRate: 60,
          effects: 'enhanced',
          ...PRESET_CONFIGS.dramaticEffect,
        };
      default:
        return PRESET_CONFIGS.standardLoad;
    }
  },

  /**
   * Batch multiple animations for performance
   */
  batchAnimations: (animations: string[]) => {
    return animations.map((animation, index) => ({
      component: animation,
      delay: index * 200,
      stagger: true,
    }));
  },
} as const;

/**
 * Usage Examples and Documentation
 */
export const USAGE_EXAMPLES = {
  strengthDesignLoader: `
    import { StrengthDesignLoader } from '@/components/visualizations';
    
    <StrengthDesignLoader
      duration={2500}
      onComplete={() => console.log('Loading complete')}
      colors={BRAND_COLORS}
      animationType="spiral"
      pattern="strengthLogo"
      isVisible={isLoading}
    />
  `,
  
  muscleAnimation: `
    import { MuscleAnimation } from '@/components/visualizations';
    
    <MuscleAnimation
      duration={3000}
      onComplete={() => startWorkout()}
      contractionType="intense"
      fiberCount={50}
      colors={['#FF6B35', '#FF8C42']}
      isVisible={showMuscleAnimation}
    />
  `,
  
  energyBurst: `
    import { EnergyBurstAnimation } from '@/components/visualizations';
    
    <EnergyBurstAnimation
      duration={2000}
      onComplete={() => showAchievement()}
      burstIntensity={1.5}
      particleCount={100}
      colors={['#FFD700', '#FF6B35']}
      isVisible={celebrationMode}
    />
  `,
} as const;

/**
 * Default export for convenience
 */
const Visualizations = {
  // Components will be lazily loaded to avoid circular dependencies
  get StrengthDesignLoader() { return require('./StrengthDesignLoader').default; },
  get MuscleAnimation() { return require('./MuscleAnimation').default; },
  get DNAHelixAnimation() { return require('./DNAHelixAnimation').default; },
  get EnergyBurstAnimation() { return require('./EnergyBurstAnimation').default; },
  get BarbellAnimation() { return require('./BarbellAnimation').default; },
  get HeartbeatAnimation() { return require('./HeartbeatAnimation').default; },
  
  // Static utilities
  ANIMATION_CONTEXTS,
  PRESET_CONFIGS,
  PERFORMANCE_UTILS,
};

export default Visualizations;