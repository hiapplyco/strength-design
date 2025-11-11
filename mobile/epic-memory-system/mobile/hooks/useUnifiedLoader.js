import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import UnifiedLoader from '../components/UnifiedLoader';

/**
 * Hook to manage loading states with UnifiedLoader
 * Replaces ActivityIndicator throughout the app
 */
export const useUnifiedLoader = (variant = 'dots') => {
  const [isLoading, setIsLoading] = useState(false);
  
  const showLoader = useCallback(() => {
    setIsLoading(true);
  }, []);
  
  const hideLoader = useCallback(() => {
    setIsLoading(false);
  }, []);
  
  const withLoader = useCallback(async (asyncFn) => {
    try {
      setIsLoading(true);
      const result = await asyncFn();
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const LoaderComponent = useCallback(({ inline = false }) => {
    if (!isLoading) return null;
    
    if (inline) {
      // Inline loader for within screens
      return (
        <View style={styles.inlineContainer}>
          <UnifiedLoader 
            duration={60000} // Long duration for continuous loading
            variant={variant}
          />
        </View>
      );
    }
    
    // Full screen modal loader
    return (
      <Modal
        transparent
        animationType="fade"
        visible={isLoading}
      >
        <View style={styles.modalContainer}>
          <UnifiedLoader 
            duration={60000} // Long duration for continuous loading
            variant={variant}
          />
        </View>
      </Modal>
    );
  }, [isLoading, variant]);
  
  return {
    isLoading,
    showLoader,
    hideLoader,
    withLoader,
    LoaderComponent,
  };
};

// Standalone loading indicator component for simple replacements
export const LoadingIndicator = ({ 
  visible = true, 
  variant = 'dots',
  size = 'small',
  color,
  style,
}) => {
  if (!visible) return null;
  
  const containerStyle = [
    styles.standaloneContainer,
    size === 'large' && styles.largeSizeContainer,
    style,
  ];
  
  return (
    <View style={containerStyle}>
      <View style={{ transform: [{ scale: size === 'large' ? 1 : 0.5 }] }}>
        <UnifiedLoader 
          duration={60000}
          variant={variant}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  standaloneContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeSizeContainer: {
    width: 80,
    height: 80,
  },
});

export default useUnifiedLoader;