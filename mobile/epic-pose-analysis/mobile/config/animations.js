// Animation Configuration System for Strength.Design Mobile App

export const ANIMATION_CONFIG = {
  // Neon Border Configuration
  neonBorder: {
    speed: 3000, // ms for full rotation
    width: 2, // border width in pixels
    blur: 10, // glow intensity
    colors: {
      default: ['#00D4FF', '#00FF88', '#FF00FF'],
      success: ['#00FF88', '#4CAF50', '#00D4FF'],
      warning: ['#FFD700', '#FFA500', '#FF6347'],
      error: ['#FF6B6B', '#FF1493', '#FF00FF'],
      premium: ['#FFD700', '#8A2BE2', '#FF00FF'],
    },
    pulseIntensity: 1.02, // Scale factor for pulse effect
    pulseDuration: 2000, // ms for pulse cycle
  },
  
  // Unified Loader Configuration
  unifiedLoader: {
    variants: {
      minimal: { duration: 1500 },
      logo: { duration: 2000 },
      dots: { duration: 2500 },
    },
    colors: {
      primary: '#00F0FF',
      secondary: '#FF00FF',
      accent: '#FFD700',
    },
  },
  
  // Page Transitions
  transitions: {
    page: { 
      duration: 500,
      easing: 'ease-in-out',
      pixelSize: 15,
    },
    modal: { 
      duration: 300,
      easing: 'ease-out',
      pixelSize: 12,
    },
    tab: { 
      duration: 200,
      easing: 'linear',
      pixelSize: 20,
    },
    drawer: {
      duration: 350,
      easing: 'ease-in-out',
      pixelSize: 10,
    }
  },
  
  // Haptic Feedback Settings
  haptics: {
    enabled: true,
    patterns: {
      success: 'notificationSuccess',
      error: 'notificationError',
      warning: 'notificationWarning',
      impact: {
        light: 'impactLight',
        medium: 'impactMedium',
        heavy: 'impactHeavy',
      },
      selection: 'selection',
    }
  },
  
  // Performance Thresholds
  performance: {
    maxPixels: 1000, // Maximum pixels to render
    frameRateTarget: 60, // Target FPS
    lowMemoryThreshold: 100 * 1024 * 1024, // 100MB
    adaptiveQuality: true, // Automatically adjust quality based on device
    useNativeDriver: true, // Always prefer native driver when possible
  },
  
  // Animation Timings
  timings: {
    instant: 0,
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 1000,
    custom: (duration) => duration,
  },
  
  // Easing Functions
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: { tension: 40, friction: 7 },
    bounce: { tension: 50, friction: 3 },
    smooth: { tension: 30, friction: 10 },
  },
  
  // Responsive Breakpoints
  breakpoints: {
    small: 375, // iPhone SE, small Android
    medium: 414, // iPhone Pro, standard Android
    large: 428, // iPhone Pro Max, large Android
    tablet: 768, // iPad, Android tablets
  },
  
  // Debug Settings
  debug: {
    showPerformanceMetrics: false,
    logAnimationStarts: false,
    logAnimationEnds: false,
    showPixelGrid: false,
    slowMotion: false, // 10x slower animations for debugging
    slowMotionFactor: 10,
  }
};

// Dynamic configuration based on context
export const getContextualConfig = (context) => {
  switch (context) {
    case 'workout':
      return {
        variant: 'logo',
        duration: 2000,
      };
      
    case 'search':
      return {
        variant: 'dots',
        duration: 1500,
      };
      
    case 'profile':
      return {
        variant: 'minimal',
        duration: 1000,
      };
      
    case 'achievement':
      return {
        variant: 'logo',
        duration: 3000,
      };
      
    default:
      return {
        variant: 'dots',
        duration: 1500,
      };
  }
};

// Export utility to update config at runtime
export const updateConfig = (updates) => {
  Object.assign(ANIMATION_CONFIG, updates);
};

// Export config validator
export const validateConfig = (config) => {
  const requiredKeys = ['neonBorder', 'unifiedLoader', 'transitions', 'performance'];
  return requiredKeys.every(key => key in config);
};