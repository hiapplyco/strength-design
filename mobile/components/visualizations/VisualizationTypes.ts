/**
 * Shared types and interfaces for Strength.Design visualizations
 * Based on pixel-shimmer architecture with performance optimizations
 */

export interface PixelData {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  shimmerDelay: number;
  intensity?: number;
  pattern?: string;
}

export interface AnimationConfig {
  duration: number;
  colors: string[];
  pixelSize: number;
  animationType: AnimationType;
  pattern?: PatternType;
  intensity?: number;
  message?: string;
  subMessage?: string;
  onComplete?: () => void;
}

export type AnimationType = 
  | 'spiral' 
  | 'wave' 
  | 'explosion' 
  | 'scan' 
  | 'pulse' 
  | 'ripple'
  | 'magnetic'
  | 'flow'
  | 'orbit';

export type PatternType = 
  | 'strengthLogo'
  | 'barbell'
  | 'muscle'
  | 'dnaHelix'
  | 'heartbeat'
  | 'energy'
  | 'lightning'
  | 'trophy';

export interface PatternDefinition {
  name: PatternType;
  grid: number[][];
  centerOffset?: { x: number; y: number };
  scale?: number;
  rotation?: number;
}

// Strength.Design brand colors
export const BRAND_COLORS = {
  orange: '#FF6B35',
  cyan: '#00F0FF', 
  green: '#00FF88',
  magenta: '#FF00FF',
  gold: '#FFD700',
  white: '#FFFFFF',
  black: '#000000',
} as const;

// Animation presets for different contexts
export const ANIMATION_PRESETS = {
  loading: {
    duration: 2500,
    colors: [BRAND_COLORS.cyan, BRAND_COLORS.orange, BRAND_COLORS.green],
    animationType: 'spiral' as AnimationType,
    pixelSize: 8,
  },
  achievement: {
    duration: 3500,
    colors: [BRAND_COLORS.gold, BRAND_COLORS.orange, BRAND_COLORS.magenta],
    animationType: 'explosion' as AnimationType,
    pixelSize: 12,
  },
  workout: {
    duration: 3000,
    colors: [BRAND_COLORS.green, BRAND_COLORS.cyan],
    animationType: 'pulse' as AnimationType,
    pixelSize: 10,
  },
  transition: {
    duration: 1500,
    colors: [BRAND_COLORS.orange, BRAND_COLORS.magenta],
    animationType: 'wave' as AnimationType,
    pixelSize: 6,
  }
} as const;

// Performance thresholds
export const PERFORMANCE_CONFIG = {
  maxPixels: 800,
  stepSize: 2,
  frameRate: 60,
  lowEndThreshold: 400,
  highEndThreshold: 1200,
} as const;

export interface PerformanceMetrics {
  frameTime: number;
  pixelCount: number;
  animationLoad: number;
  memoryUsage: number;
}

export interface VisualizationHooks {
  onFrameUpdate?: (metrics: PerformanceMetrics) => void;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
  onPerformanceWarning?: (metrics: PerformanceMetrics) => void;
}

// Component Props Interfaces
export interface StrengthDesignLoaderProps {
  duration?: number;
  onComplete?: () => void;
  colors?: string[];
  size?: number;
  isVisible?: boolean;
  animationType?: AnimationType;
  pattern?: PatternType;
  intensity?: number;
  pixelSize?: number;
  message?: string;
  brandMessage?: string;
  style?: any;
  // Visualization hooks
  onFrameUpdate?: (metrics: PerformanceMetrics) => void;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
  onPerformanceWarning?: (metrics: PerformanceMetrics) => void;
}

export interface MuscleAnimationProps {
  duration?: number;
  onComplete?: () => void;
  colors?: string[];
  size?: number;
  isVisible?: boolean;
  contractionType?: 'smooth' | 'intense' | 'pulsing';
  fiberCount?: number;
  fiberLength?: number;
  contractionSpeed?: number;
  style?: any;
}

export interface DNAHelixProps {
  duration?: number;
  onComplete?: () => void;
  colors?: string[];
  size?: number;
  isVisible?: boolean;
  helixHeight?: number;
  rotationSpeed?: number;
  baseCount?: number;
  showBases?: boolean;
  helixColors?: {
    backbone: string;
    baseA: string;
    baseT: string;
    baseG: string;
    baseC: string;
  };
  style?: any;
}

export interface DNAHelixAnimationProps {
  duration?: number;
  onComplete?: () => void;
  colors?: string[];
  size?: number;
  isVisible?: boolean;
  helixTurns?: number;
  basePairCount?: number;
  rotationSpeed?: number;
  pulseIntensity?: number;
  style?: any;
}

export interface EnergyBurstProps {
  duration?: number;
  onComplete?: () => void;
  colors?: string[];
  size?: number;
  isVisible?: boolean;
  burstType?: 'radial' | 'lightning' | 'plasma' | 'atomic';
  particleCount?: number;
  burstRadius?: number;
  intensity?: 'low' | 'medium' | 'high' | 'extreme';
  style?: any;
}

export interface EnergyBurstAnimationProps {
  duration?: number;
  onComplete?: () => void;
  colors?: string[];
  size?: number;
  isVisible?: boolean;
  particleCount?: number;
  waveCount?: number;
  burstIntensity?: number;
  centerForce?: number;
  style?: any;
}

export interface BarbellAnimationProps {
  duration?: number;
  onComplete?: () => void;
  colors?: string[];
  size?: number;
  isVisible?: boolean;
  targetWeight?: number;
  plateConfiguration?: 'standard' | 'metric' | 'powerlifting';
  liftType?: 'deadlift' | 'squat' | 'bench-press' | 'overhead-press';
  showProgress?: boolean;
  style?: any;
}

export interface HeartbeatAnimationProps {
  duration?: number;
  onComplete?: () => void;
  colors?: string[];
  size?: number;
  isVisible?: boolean;
  heartRate?: number;
  showVitals?: boolean;
  monitorType?: 'ECG' | 'pulse' | 'monitor';
  intensity?: 'low' | 'normal' | 'high' | 'critical';
  style?: any;
}