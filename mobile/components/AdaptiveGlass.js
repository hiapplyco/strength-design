/**
 * AdaptiveGlass Component - 2025 AI-Powered Dynamic Glass
 * Context-aware glass that adapts to workout intensity and user state
 * Implements advanced blur techniques and biometric responsiveness
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';
import { AnimatedGradient, KineticGradient, SpatialGradient } from './AnimatedGradient';

const { width: screenWidth } = Dimensions.get('window');

// 2025 Advanced Blur Mapping with AI adaptation
const ADAPTIVE_BLUR_MAP = {
  resting: Platform.select({ ios: 20, android: 25, web: 10 }),
  active: Platform.select({ ios: 40, android: 45, web: 20 }),
  intense: Platform.select({ ios: 60, android: 65, web: 30 }),
  peak: Platform.select({ ios: 80, android: 85, web: 40 }),
  recovery: Platform.select({ ios: 30, android: 35, web: 15 }),
};

// Biometric-aware glass materials
const GLASS_MATERIALS = {
  energyGlass: {
    light: {
      backgroundColor: 'rgba(255,107,53,0.08)',
      borderColor: 'rgba(255,107,53,0.2)',
    },
    dark: {
      backgroundColor: 'rgba(255,107,53,0.12)',
      borderColor: 'rgba(255,107,53,0.3)',
    },
  },
  focusGlass: {
    light: {
      backgroundColor: 'rgba(33,150,243,0.06)',
      borderColor: 'rgba(33,150,243,0.15)',
    },
    dark: {
      backgroundColor: 'rgba(33,150,243,0.10)',
      borderColor: 'rgba(33,150,243,0.25)',
    },
  },
  calmGlass: {
    light: {
      backgroundColor: 'rgba(76,175,80,0.05)',
      borderColor: 'rgba(76,175,80,0.12)',
    },
    dark: {
      backgroundColor: 'rgba(76,175,80,0.08)',
      borderColor: 'rgba(76,175,80,0.20)',
    },
  },
};

/**
 * AdaptiveGlassContainer - Main adaptive glass component
 */
export const AdaptiveGlassContainer = ({
  children,
  workoutIntensity = 0,
  heartRate = 60,
  restingHeartRate = 60,
  variant = 'energyGlass',
  showPulse = false,
  enableAdaptation = true,
  style,
  borderRadius = 16,
  padding = 16,
  onPress,
  ...props
}) => {
  const theme = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [currentBlurIntensity, setCurrentBlurIntensity] = useState('resting');

  // Calculate adaptive blur intensity based on biometrics
  const adaptiveBlurIntensity = useMemo(() => {
    if (!enableAdaptation) return ADAPTIVE_BLUR_MAP.resting;

    const hrRatio = heartRate / restingHeartRate;
    
    if (hrRatio > 1.8 || workoutIntensity > 0.9) return ADAPTIVE_BLUR_MAP.peak;
    if (hrRatio > 1.5 || workoutIntensity > 0.7) return ADAPTIVE_BLUR_MAP.intense;
    if (hrRatio > 1.2 || workoutIntensity > 0.4) return ADAPTIVE_BLUR_MAP.active;
    if (hrRatio < 1.1 && workoutIntensity < 0.2) return ADAPTIVE_BLUR_MAP.recovery;
    
    return ADAPTIVE_BLUR_MAP.resting;
  }, [heartRate, restingHeartRate, workoutIntensity, enableAdaptation]);

  // Pulse animation for active workouts
  useEffect(() => {
    if (showPulse && workoutIntensity > 0.3) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 1000 / (1 + workoutIntensity), // Faster pulse with higher intensity
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000 / (1 + workoutIntensity),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [showPulse, workoutIntensity]);

  // Glow effect for high intensity
  useEffect(() => {
    if (workoutIntensity > 0.7) {
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [workoutIntensity]);

  // Get glass material based on theme and variant
  const glassMaterial = GLASS_MATERIALS[variant]?.[theme.isDarkMode ? 'dark' : 'light'] || 
                        GLASS_MATERIALS.energyGlass[theme.isDarkMode ? 'dark' : 'light'];

  // Animated styles
  const animatedContainerStyle = {
    transform: [{ scale: pulseAnim }],
  };

  const glowStyle = {
    shadowColor: variant === 'energyGlass' ? '#FF6B35' : '#2196F3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.5],
    }),
    shadowRadius: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 20],
    }),
  };

  const Component = onPress ? Animated.createAnimatedComponent(View) : Animated.View;

  return (
    <Component
      style={[
        styles.container,
        glassMaterial,
        animatedContainerStyle,
        Platform.OS === 'ios' && glowStyle,
        {
          borderRadius,
          padding,
          borderWidth: 0.5,
        },
        style,
      ]}
      onPress={onPress}
      {...props}
    >
      <BlurView
        intensity={adaptiveBlurIntensity}
        tint={theme.isDarkMode ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFillObject, { borderRadius }]}
      />
      <View style={{ zIndex: 1 }}>
        {children}
      </View>
    </Component>
  );
};

/**
 * BiometricGlass - Glass that responds to biometric data
 */
export const BiometricGlass = ({
  children,
  heartRate = 60,
  restingHeartRate = 60,
  steps = 0,
  calories = 0,
  style,
  ...props
}) => {
  const theme = useTheme();
  const animatedOpacity = useRef(new Animated.Value(0.1)).current;

  // Calculate activity level from biometrics
  const activityLevel = useMemo(() => {
    const hrIntensity = (heartRate - restingHeartRate) / restingHeartRate;
    const stepIntensity = Math.min(steps / 10000, 1); // Normalize to 10k steps
    const calorieIntensity = Math.min(calories / 2000, 1); // Normalize to 2000 cal
    
    return (hrIntensity + stepIntensity + calorieIntensity) / 3;
  }, [heartRate, restingHeartRate, steps, calories]);

  // Animate opacity based on activity
  useEffect(() => {
    Animated.timing(animatedOpacity, {
      toValue: 0.1 + (activityLevel * 0.2),
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [activityLevel]);

  const biometricColors = [
    `rgba(255,107,53,${0.05 + activityLevel * 0.1})`,
    `rgba(255,143,101,${0.03 + activityLevel * 0.08})`,
    `rgba(255,165,0,${0.02 + activityLevel * 0.05})`,
  ];

  return (
    <View style={[styles.biometricContainer, style]} {...props}>
      <KineticGradient
        colors={biometricColors}
        intensity={activityLevel}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View
        style={[
          styles.biometricOverlay,
          {
            backgroundColor: theme.isDarkMode 
              ? `rgba(0,0,0,${animatedOpacity})`
              : `rgba(255,255,255,${animatedOpacity})`,
          },
        ]}
      />
      {children}
    </View>
  );
};

/**
 * SpatialGlass - visionOS-inspired spatial depth glass
 */
export const SpatialGlass = ({
  children,
  depth = 1,
  elevation = 1,
  style,
  ...props
}) => {
  const theme = useTheme();
  const depthAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Create floating effect
  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -5 * elevation,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    floatAnimation.start();
    return () => floatAnimation.stop();
  }, [elevation]);

  // Depth animation
  useEffect(() => {
    Animated.spring(depthAnim, {
      toValue: depth,
      tension: 20,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [depth]);

  const spatialStyle = {
    transform: [
      { translateY: floatAnim },
      { 
        scale: depthAnim.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [1, 1.02, 1.04],
        }),
      },
    ],
  };

  const shadowStyle = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: depth * 4,
      },
      shadowOpacity: 0.15 + (depth * 0.05),
      shadowRadius: 8 + (depth * 4),
    },
    android: {
      elevation: depth * 8,
    },
  });

  return (
    <Animated.View
      style={[
        styles.spatialContainer,
        shadowStyle,
        spatialStyle,
        style,
      ]}
      {...props}
    >
      <SpatialGradient depth={depth} style={StyleSheet.absoluteFillObject} />
      {children}
    </Animated.View>
  );
};

/**
 * GestureGlass - Glass that responds to gestures
 */
export const GestureGlass = ({
  children,
  onSwipe,
  onPinch,
  style,
  ...props
}) => {
  const theme = useTheme();
  const gestureOpacity = useRef(new Animated.Value(0.1)).current;
  const gestureScale = useRef(new Animated.Value(1)).current;

  // This would integrate with PanResponder or react-native-gesture-handler
  // Simplified for demonstration

  return (
    <Animated.View
      style={[
        styles.gestureContainer,
        {
          opacity: gestureOpacity,
          transform: [{ scale: gestureScale }],
        },
        style,
      ]}
      {...props}
    >
      <AnimatedGradient
        variant="focus"
        animate={true}
        style={StyleSheet.absoluteFillObject}
      />
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  biometricContainer: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  biometricOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  spatialContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  gestureContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});

export default AdaptiveGlassContainer;