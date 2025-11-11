import { Platform, Dimensions, PixelRatio } from 'react-native';
import { ANIMATION_CONFIG } from '../config/animations';

// Safe import of expo-device with fallback
let Device = null;
try {
  Device = require('expo-device');
} catch (error) {
  console.log('expo-device not available, using fallbacks');
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device capability detection
export const DeviceCapabilities = {
  // Check if device is low-end based on RAM
  isLowEndDevice: () => {
    if (!Device) {
      // Fallback based on screen dimensions and pixel ratio
      return SCREEN_WIDTH < 375 || PixelRatio.get() < 2;
    }
    
    if (Platform.OS === 'ios') {
      // iOS devices with less than 3GB RAM
      const modelName = Device.modelName || '';
      const lowEndModels = ['iPhone 6', 'iPhone 6s', 'iPhone 7', 'iPhone SE'];
      return lowEndModels.some(model => modelName.includes(model));
    } else {
      // Android devices with less than 3GB RAM
      return Device.totalMemory ? Device.totalMemory < 3 * 1024 * 1024 * 1024 : false;
    }
  },
  
  // Check if device is high-end
  isHighEndDevice: () => {
    if (!Device) {
      // Fallback based on screen dimensions and pixel ratio
      return SCREEN_WIDTH >= 428 && PixelRatio.get() >= 3;
    }
    
    if (Platform.OS === 'ios') {
      const modelName = Device.modelName || '';
      const highEndModels = ['iPhone 14', 'iPhone 15', 'iPhone 13 Pro', 'iPhone 14 Pro', 'iPhone 15 Pro', 'iPad Pro'];
      return highEndModels.some(model => modelName.includes(model));
    } else {
      // Android devices with more than 6GB RAM
      return Device.totalMemory ? Device.totalMemory > 6 * 1024 * 1024 * 1024 : false;
    }
  },
  
  // Get device tier (low, medium, high)
  getDeviceTier: () => {
    if (DeviceCapabilities.isLowEndDevice()) return 'low';
    if (DeviceCapabilities.isHighEndDevice()) return 'high';
    return 'medium';
  },
  
  // Check if device supports high refresh rate
  hasHighRefreshRate: () => {
    if (!Device) return false; // Conservative default without Device info
    
    // ProMotion displays on iOS (120Hz)
    if (Platform.OS === 'ios') {
      const modelName = Device.modelName || '';
      return modelName.includes('Pro') || modelName.includes('iPad Pro');
    }
    // Many modern Android devices support 90Hz or 120Hz
    return false; // Conservative default
  },
  
  // Get pixel density
  getPixelDensity: () => {
    return PixelRatio.get();
  },
  
  // Check if tablet
  isTablet: () => {
    const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
    return Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) >= 600 && aspectRatio < 1.6;
  }
};

// Optimize pixel size based on device capabilities
export const getOptimalPixelSize = (baseSize = 10) => {
  const tier = DeviceCapabilities.getDeviceTier();
  const pixelDensity = DeviceCapabilities.getPixelDensity();
  
  let adjustedSize = baseSize;
  
  // Adjust based on device tier
  switch (tier) {
    case 'low':
      adjustedSize = baseSize * 1.5; // Larger pixels = fewer elements
      break;
    case 'medium':
      adjustedSize = baseSize;
      break;
    case 'high':
      adjustedSize = baseSize * 0.8; // Smaller pixels = more detail
      break;
  }
  
  // Adjust for screen size
  if (SCREEN_WIDTH < 375) {
    adjustedSize *= 1.2; // Larger pixels for small screens
  } else if (SCREEN_WIDTH > 428) {
    adjustedSize *= 0.9; // Smaller pixels for large screens
  }
  
  // Adjust for pixel density
  if (pixelDensity > 3) {
    adjustedSize *= 0.9; // High density screens can handle more detail
  }
  
  return Math.round(adjustedSize);
};

// Get optimal animation duration based on device
export const getOptimalDuration = (baseDuration = 1000) => {
  const tier = DeviceCapabilities.getDeviceTier();
  
  switch (tier) {
    case 'low':
      return baseDuration * 0.7; // Faster animations for low-end devices
    case 'high':
      return baseDuration * 1.1; // Slightly longer for smooth experience
    default:
      return baseDuration;
  }
};

// Get optimal batch size for pixel animations
export const getOptimalBatchSize = () => {
  const tier = DeviceCapabilities.getDeviceTier();
  
  switch (tier) {
    case 'low':
      return 15; // Smaller batches for low-end devices
    case 'high':
      return 50; // Larger batches for high-end devices
    default:
      return 30;
  }
};

// Get optimal color scheme based on device capabilities
export const getOptimalColorScheme = (preferredScheme = 'neon') => {
  const tier = DeviceCapabilities.getDeviceTier();
  
  if (tier === 'low') {
    // Use simpler color schemes for low-end devices
    return ANIMATION_CONFIG.pixelShimmer.colorSchemes.monochrome;
  }
  
  return ANIMATION_CONFIG.pixelShimmer.colorSchemes[preferredScheme] || 
         ANIMATION_CONFIG.pixelShimmer.colorSchemes.neon;
};

// Calculate maximum pixels to render
export const getMaxPixelCount = () => {
  const tier = DeviceCapabilities.getDeviceTier();
  const baseMax = ANIMATION_CONFIG.performance.maxPixels;
  
  switch (tier) {
    case 'low':
      return Math.floor(baseMax * 0.5);
    case 'high':
      return Math.floor(baseMax * 1.5);
    default:
      return baseMax;
  }
};

// Adaptive quality settings
export const getAdaptiveQualitySettings = () => {
  const tier = DeviceCapabilities.getDeviceTier();
  const isTablet = DeviceCapabilities.isTablet();
  
  return {
    pixelSize: getOptimalPixelSize(),
    batchSize: getOptimalBatchSize(),
    maxPixels: getMaxPixelCount(),
    enableShadows: tier !== 'low',
    enableGlow: tier !== 'low',
    enableHaptics: Platform.OS === 'ios' && tier !== 'low',
    animationDuration: getOptimalDuration(),
    useNativeDriver: true,
    enableParticles: tier === 'high',
    particleCount: tier === 'high' ? 50 : tier === 'medium' ? 25 : 0,
    borderWidth: isTablet ? 3 : 2,
    glowIntensity: tier === 'high' ? 30 : tier === 'medium' ? 20 : 10,
  };
};

// Memory management utilities
export const MemoryManager = {
  // Check available memory
  checkMemory: () => {
    if (Platform.OS === 'ios') {
      // iOS doesn't provide direct memory access
      return { available: true, percentage: 100 };
    }
    // For Android, you'd need native modules
    return { available: true, percentage: 100 };
  },
  
  // Clean up animations when memory is low
  cleanupAnimations: (pixels) => {
    if (pixels && Array.isArray(pixels)) {
      pixels.forEach(pixel => {
        if (pixel.animValue) {
          pixel.animValue.stopAnimation();
          pixel.animValue.removeAllListeners();
        }
        if (pixel.scaleValue) {
          pixel.scaleValue.stopAnimation();
          pixel.scaleValue.removeAllListeners();
        }
      });
    }
  },
  
  // Throttle animations if needed
  shouldThrottleAnimations: () => {
    const tier = DeviceCapabilities.getDeviceTier();
    return tier === 'low';
  }
};

// Performance monitoring
export const PerformanceMonitor = {
  frameDropThreshold: 5, // Consecutive frames below target
  frameDropCount: 0,
  
  // Monitor frame rate
  monitorFrameRate: (callback) => {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const checkFrameRate = () => {
      const currentTime = performance.now();
      const delta = currentTime - lastTime;
      
      if (delta >= 1000) {
        const fps = Math.round((frameCount * 1000) / delta);
        callback(fps);
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      frameCount++;
      requestAnimationFrame(checkFrameRate);
    };
    
    checkFrameRate();
  },
  
  // Auto-adjust quality based on performance
  autoAdjustQuality: (currentFPS, targetFPS = 60) => {
    if (currentFPS < targetFPS * 0.8) {
      // Performance is poor, reduce quality
      return {
        reduceQuality: true,
        suggestions: [
          'Increase pixel size',
          'Reduce animation duration',
          'Disable shadows and glow',
          'Reduce batch size'
        ]
      };
    }
    return { reduceQuality: false };
  }
};

// Export a ready-to-use optimized configuration
export const getOptimizedAnimationConfig = () => {
  const settings = getAdaptiveQualitySettings();
  const tier = DeviceCapabilities.getDeviceTier();
  
  return {
    ...ANIMATION_CONFIG,
    pixelShimmer: {
      ...ANIMATION_CONFIG.pixelShimmer,
      defaultSize: settings.pixelSize,
      batchSize: settings.batchSize,
    },
    neonBorder: {
      ...ANIMATION_CONFIG.neonBorder,
      width: settings.borderWidth,
      blur: settings.glowIntensity,
    },
    performance: {
      ...ANIMATION_CONFIG.performance,
      maxPixels: settings.maxPixels,
      adaptiveQuality: true,
    },
    haptics: {
      ...ANIMATION_CONFIG.haptics,
      enabled: settings.enableHaptics,
    },
    // Add tier-specific overrides
    tierOverrides: {
      currentTier: tier,
      shadows: settings.enableShadows,
      glow: settings.enableGlow,
      particles: settings.enableParticles,
    }
  };
};