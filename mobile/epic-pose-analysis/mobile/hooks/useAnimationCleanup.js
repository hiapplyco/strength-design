import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';

/**
 * Hook to properly manage animation lifecycle and prevent crashes
 * Addresses watchdog termination issues (0x8BADF00D)
 */
export const useAnimationCleanup = () => {
  const animationsRef = useRef([]);
  const interactionHandleRef = useRef(null);
  const isCleaningUp = useRef(false);
  
  // Register an animation
  const registerAnimation = (animation) => {
    if (!isCleaningUp.current) {
      animationsRef.current.push(animation);
    }
    return animation;
  };
  
  // Stop all animations safely
  const stopAllAnimations = () => {
    isCleaningUp.current = true;
    
    // Cancel any pending interactions
    if (interactionHandleRef.current) {
      InteractionManager.clearInteractionHandle(interactionHandleRef.current);
      interactionHandleRef.current = null;
    }
    
    // Stop all registered animations
    animationsRef.current.forEach(animation => {
      try {
        if (animation && typeof animation.stop === 'function') {
          animation.stop();
        }
        if (animation && typeof animation.reset === 'function') {
          animation.reset();
        }
      } catch (error) {
        console.warn('Failed to stop animation:', error);
      }
    });
    
    // Clear the animations array
    animationsRef.current = [];
    isCleaningUp.current = false;
  };
  
  // Run animation after interactions
  const runAfterInteractions = (callback) => {
    interactionHandleRef.current = InteractionManager.runAfterInteractions(() => {
      if (!isCleaningUp.current) {
        callback();
      }
      interactionHandleRef.current = null;
    });
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAnimations();
    };
  }, []);
  
  return {
    registerAnimation,
    stopAllAnimations,
    runAfterInteractions,
    isCleaningUp: isCleaningUp.current,
  };
};

export default useAnimationCleanup;