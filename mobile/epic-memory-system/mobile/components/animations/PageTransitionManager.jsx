import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import StrengthDesignLoader from '../visualizations/StrengthDesignLoader';

// Create context
const TransitionContext = createContext();

// Hook to use transition context
export const useTransition = () => {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('useTransition must be used within TransitionProvider');
  }
  return context;
};

// Animation presets for common use cases
const TRANSITION_PRESETS = {
  workoutGeneration: {
    message: "Creating Your Perfect Workout...",
    colors: ['#00FF88', '#00D4FF', '#FF00FF'],
    pixelSize: 12,
    pattern: 'humanFigure',
    duration: 3000,
    direction: 'outward'
  },
  
  exerciseSearch: {
    message: "Finding Exercises...",
    colors: ['#FFD700', '#FF6B6B', '#4ECDC4'],
    pixelSize: 8,
    pattern: 'wave',
    duration: 1500,
    direction: 'horizontal'
  },
  
  profileLoad: {
    message: "Loading Profile...",
    colors: ['#00D4FF', '#8A2BE2', '#FF00FF'],
    pixelSize: 10,
    pattern: 'circle',
    duration: 1000,
    direction: 'inward'
  },
  
  pageTransition: {
    message: "",
    colors: ['#00D4FF', '#00FF88', '#FF00FF', '#8A2BE2'],
    pixelSize: 15,
    pattern: 'random',
    duration: 500,
    direction: 'random'
  },
  
  achievementUnlock: {
    message: "Achievement Unlocked!",
    colors: ['#FFD700', '#FFA500', '#FF6347', '#FF1493'],
    pixelSize: 6,
    pattern: 'circle',
    duration: 3000,
    direction: 'outward'
  },
  
  levelUp: {
    message: "Level Up!",
    colors: ['#00FF88', '#00D4FF', '#FFD700', '#FF00FF', '#8A2BE2'],
    pixelSize: 8,
    pattern: 'strengthLogo',
    duration: 4000,
    direction: 'outward'
  },
  
  saving: {
    message: "Saving...",
    colors: ['#00FF88', '#4CAF50'],
    pixelSize: 10,
    pattern: 'wave',
    duration: 1000,
    direction: 'vertical'
  },
  
  loading: {
    message: "Loading...",
    colors: ['#00D4FF', '#00FF88'],
    pixelSize: 12,
    pattern: 'circle',
    duration: 1500,
    direction: 'inward'
  }
};

// Transition Provider Component
export const TransitionProvider = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionConfig, setTransitionConfig] = useState({});
  const transitionQueue = useRef([]);
  const currentTransition = useRef(null);
  
  // Start a transition with config
  const startTransition = useCallback((configOrPreset, customConfig = {}) => {
    let config;
    
    // Check if using a preset
    if (typeof configOrPreset === 'string') {
      config = { 
        ...TRANSITION_PRESETS[configOrPreset], 
        ...customConfig 
      };
    } else {
      config = configOrPreset;
    }
    
    // Add to queue if already transitioning
    if (isTransitioning) {
      transitionQueue.current.push(config);
      return;
    }
    
    currentTransition.current = config;
    setTransitionConfig(config);
    setIsTransitioning(true);
  }, [isTransitioning]);
  
  // End current transition
  const endTransition = useCallback(() => {
    currentTransition.current = null;
    setIsTransitioning(false);
    
    // Process queue if there are pending transitions
    if (transitionQueue.current.length > 0) {
      const nextTransition = transitionQueue.current.shift();
      setTimeout(() => {
        startTransition(nextTransition);
      }, 100); // Small delay between transitions
    }
  }, [startTransition]);
  
  // Cancel all transitions
  const cancelAllTransitions = useCallback(() => {
    transitionQueue.current = [];
    currentTransition.current = null;
    setIsTransitioning(false);
    setTransitionConfig({});
  }, []);
  
  // Batch transition helper
  const batchTransition = useCallback(async (asyncFunction, configOrPreset, customConfig = {}) => {
    startTransition(configOrPreset, customConfig);
    
    try {
      const result = await asyncFunction();
      return result;
    } catch (error) {
      console.error('Transition error:', error);
      throw error;
    } finally {
      // Auto end transition after async operation
      setTimeout(() => {
        endTransition();
      }, 300); // Small delay for visual smoothness
    }
  }, [startTransition, endTransition]);
  
  // Check if transitioning
  const isInTransition = useCallback(() => {
    return isTransitioning;
  }, [isTransitioning]);
  
  // Get current transition info
  const getCurrentTransition = useCallback(() => {
    return currentTransition.current;
  }, []);
  
  const value = {
    startTransition,
    endTransition,
    cancelAllTransitions,
    batchTransition,
    isInTransition,
    getCurrentTransition,
    presets: TRANSITION_PRESETS,
  };
  
  return (
    <TransitionContext.Provider value={value}>
      {children}
      {isTransitioning && (
        <StrengthDesignLoader
          duration={transitionConfig.duration || 1500}
          colors={transitionConfig.colors || ['#FF6B35', '#00F0FF', '#00FF88', '#FFD700']}
          animationType="spiral"
          pattern="strengthLogo"
          intensity={0.8}
          size={280}
          isVisible={true}
          onComplete={endTransition}
        />
      )}
    </TransitionContext.Provider>
  );
};

// Higher-order component for transition-enabled components
export const withTransition = (Component) => {
  return (props) => {
    const transition = useTransition();
    return <Component {...props} transition={transition} />;
  };
};

// Utility functions for common transition scenarios
export const transitionUtils = {
  // Wrap API calls with transitions
  withApiTransition: async (apiCall, transitionConfig) => {
    const { batchTransition } = useTransition();
    return batchTransition(apiCall, transitionConfig);
  },
  
  // Navigation with transition
  navigateWithTransition: (navigation, routeName, params, transitionConfig = 'pageTransition') => {
    const { startTransition } = useTransition();
    startTransition(transitionConfig);
    
    setTimeout(() => {
      navigation.navigate(routeName, params);
    }, 100);
  },
  
  // Form submission with transition
  submitWithTransition: async (submitFunction, successMessage = "Success!", errorMessage = "Error occurred") => {
    const { batchTransition } = useTransition();
    
    try {
      const result = await batchTransition(submitFunction, 'saving');
      // Show success feedback
      return { success: true, data: result };
    } catch (error) {
      // Show error feedback
      return { success: false, error };
    }
  }
};