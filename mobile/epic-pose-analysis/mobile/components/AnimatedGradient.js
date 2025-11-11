/**
 * AnimatedGradient Component - 2025 Glassmorphism Enhancement
 * Dynamic gradients that respond to user interactions and workout intensity
 * Inspired by iOS 26 and visionOS spatial design patterns
 */

import React, { useRef, useEffect, useMemo } from 'react';
import {
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const AnimatedGradient = ({
  children,
  colors,
  intensity = 0.5,
  speed = 3000,
  style,
  animate = true,
  workoutActive = false,
  heartRate = 60,
  variant = 'energy',
}) => {
  const theme = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  // 2025 Color Schemes with biometric awareness
  const gradientPresets = {
    energy: {
      light: ['#FF6B3515', '#FF8F6510', '#FFA50005'],
      dark: ['#FF6B3525', '#FF8F6520', '#FFA50010'],
      active: ['#FF6B3540', '#FF8F6535', '#FFA50020'], // During workout
    },
    calm: {
      light: ['#4CAF5010', '#66BB6A08', '#81C78405'],
      dark: ['#4CAF5020', '#66BB6A15', '#81C78410'],
      active: ['#4CAF5030', '#66BB6A25', '#81C78420'],
    },
    focus: {
      light: ['#2196F310', '#42A5F508', '#64B5F605'],
      dark: ['#2196F320', '#42A5F515', '#64B5F610'],
      active: ['#2196F330', '#42A5F525', '#64B5F620'],
    },
    intense: {
      light: ['#F4433615', '#FF525210', '#FF6E4005'],
      dark: ['#F4433625', '#FF525220', '#FF6E4010'],
      active: ['#F4433640', '#FF525235', '#FF6E4020'],
    },
  };

  // Dynamic color selection based on context
  const dynamicColors = useMemo(() => {
    if (colors) return colors;
    
    const preset = gradientPresets[variant];
    const themeMode = theme.isDarkMode ? 'dark' : 'light';
    
    // Adaptive colors based on workout state
    if (workoutActive || heartRate > 100) {
      return preset.active;
    }
    
    return preset[themeMode];
  }, [colors, variant, theme.isDarkMode, workoutActive, heartRate]);

  // Animation configuration with biometric response
  useEffect(() => {
    if (!animate) return;

    // Adjust animation speed based on heart rate
    const dynamicSpeed = workoutActive 
      ? Math.max(1000, speed - (heartRate * 10))
      : speed;

    // Main gradient animation
    const gradientAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: dynamicSpeed,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: dynamicSpeed,
          useNativeDriver: false,
        }),
      ])
    );

    // Rotation animation for dynamic effect
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: dynamicSpeed * 4,
        useNativeDriver: true,
      })
    );

    // Pulse animation during workout
    let pulseAnimation;
    if (workoutActive) {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
    }

    gradientAnimation.start();
    rotateAnimation.start();

    return () => {
      gradientAnimation.stop();
      rotateAnimation.stop();
      if (pulseAnimation) pulseAnimation.stop();
    };
  }, [animate, speed, workoutActive, heartRate]);

  // Interpolate animations
  const animatedStart = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const animatedEnd = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const rotation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const animatedStyle = {
    transform: [
      { rotate: rotation },
      { scale: scaleValue },
    ],
  };

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      <LinearGradient
        colors={dynamicColors}
        start={{ x: animatedStart, y: 0 }}
        end={{ x: animatedEnd, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {children}
    </Animated.View>
  );
};

// Kinetic Gradient Component - Responds to gestures
export const KineticGradient = ({
  children,
  colors,
  style,
  intensity = 0.5,
}) => {
  const theme = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create kinetic movement pattern
    const createMovement = () => {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: intensity * 20,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: -intensity * 20,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -intensity * 15,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: intensity * 15,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => createMovement());
    };

    createMovement();
  }, [intensity]);

  const defaultColors = theme.isDarkMode 
    ? ['#FF6B3520', '#FF8F6515', '#FFA50010']
    : ['#FF6B3510', '#FF8F6508', '#FFA50005'];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX },
            { translateY },
          ],
        },
        style,
      ]}
    >
      <LinearGradient
        colors={colors || defaultColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {children}
    </Animated.View>
  );
};

// Spatial Gradient - visionOS inspired depth effect
export const SpatialGradient = ({
  children,
  depth = 1,
  colors,
  style,
}) => {
  const theme = useTheme();
  const depthValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(depthValue, {
      toValue: depth,
      tension: 20,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [depth]);

  const shadowStyle = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: depth * 2,
      },
      shadowOpacity: 0.1 + (depth * 0.05),
      shadowRadius: 3 + (depth * 2),
    },
    android: {
      elevation: depth * 4,
    },
  });

  const defaultColors = theme.isDarkMode
    ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.01)', 'transparent']
    : ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.01)', 'transparent'];

  return (
    <Animated.View
      style={[
        styles.container,
        shadowStyle,
        {
          transform: [
            {
              translateZ: depthValue.interpolate({
                inputRange: [0, 1, 2],
                outputRange: [0, 5, 10],
              }),
            },
            {
              scale: depthValue.interpolate({
                inputRange: [0, 1, 2],
                outputRange: [1, 1.01, 1.02],
              }),
            },
          ],
        },
        style,
      ]}
    >
      <LinearGradient
        colors={colors || defaultColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default AnimatedGradient;