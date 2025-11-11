/**
 * PulseButton Component - 2025 Micro-Interactions
 * Advanced haptic and visual feedback for workout interactions
 * Implements iOS 26 style micro-animations
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  Text,
  View,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { AdaptiveGlassContainer } from './AdaptiveGlass';
import { AnimatedGradient } from './AnimatedGradient';

/**
 * PulseButton - Main button with pulse effect
 */
export const PulseButton = ({
  children,
  title,
  onPress,
  workoutActive = false,
  intensity = 0.5,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon,
  style,
  textStyle,
  hapticFeedback = true,
  showRipple = true,
  ...props
}) => {
  const theme = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [isPressed, setIsPressed] = useState(false);

  // Button variants with 2025 design trends
  const variants = {
    primary: {
      colors: ['#FF6B35', '#FF8F65', '#FFA500'],
      textColor: '#FFFFFF',
      iconColor: '#FFFFFF',
    },
    secondary: {
      colors: ['#2196F3', '#42A5F5', '#64B5F6'],
      textColor: '#FFFFFF',
      iconColor: '#FFFFFF',
    },
    success: {
      colors: ['#4CAF50', '#66BB6A', '#81C784'],
      textColor: '#FFFFFF',
      iconColor: '#FFFFFF',
    },
    danger: {
      colors: ['#F44336', '#EF5350', '#E57373'],
      textColor: '#FFFFFF',
      iconColor: '#FFFFFF',
    },
    ghost: {
      colors: theme.isDarkMode 
        ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)', 'transparent']
        : ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.02)', 'transparent'],
      textColor: theme.isDarkMode ? '#FFFFFF' : '#000000',
      iconColor: theme.isDarkMode ? '#FFFFFF' : '#000000',
    },
  };

  // Size configurations
  const sizes = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      fontSize: 14,
      iconSize: 16,
      borderRadius: 8,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      fontSize: 16,
      iconSize: 20,
      borderRadius: 12,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      fontSize: 18,
      iconSize: 24,
      borderRadius: 16,
    },
  };

  const currentVariant = variants[variant] || variants.primary;
  const currentSize = sizes[size] || sizes.medium;

  // Pulse animation for workout active state
  useEffect(() => {
    if (workoutActive && !disabled) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000 / (1 + intensity),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000 / (1 + intensity),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [workoutActive, intensity, disabled]);

  // Glow effect for emphasis
  useEffect(() => {
    if (workoutActive && intensity > 0.7) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [workoutActive, intensity]);

  // Handle press with animations
  const handlePressIn = () => {
    setIsPressed(true);
    
    // Haptic feedback
    if (hapticFeedback && Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (hapticFeedback && Platform.OS === 'android') {
      Vibration.vibrate(10);
    }

    // Press animation
    Animated.parallel([
      Animated.spring(pressAnim, {
        toValue: 0.95,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
      showRipple && Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    
    // Release animation
    Animated.parallel([
      Animated.spring(pressAnim, {
        toValue: 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
      showRipple && Animated.timing(rippleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (disabled) return;
    
    // Enhanced haptic feedback for press
    if (hapticFeedback && Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (hapticFeedback && Platform.OS === 'android') {
      Vibration.vibrate(20);
    }
    
    if (onPress) onPress();
  };

  // Animated styles
  const animatedButtonStyle = {
    transform: [
      { scale: Animated.multiply(pulseAnim, pressAnim) },
    ],
  };

  const glowStyle = {
    shadowColor: currentVariant.colors[0],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.6],
    }),
    shadowRadius: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 20],
    }),
  };

  const rippleStyle = {
    position: 'absolute',
    ...StyleSheet.absoluteFillObject,
    borderRadius: currentSize.borderRadius,
    backgroundColor: currentVariant.colors[0],
    opacity: rippleAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.3],
    }),
    transform: [
      {
        scale: rippleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        }),
      },
    ],
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      {...props}
    >
      <Animated.View
        style={[
          styles.button,
          currentSize,
          Platform.OS === 'ios' && glowStyle,
          animatedButtonStyle,
          disabled && styles.disabled,
          style,
        ]}
      >
        <AnimatedGradient
          colors={currentVariant.colors}
          animate={workoutActive}
          intensity={intensity}
          style={[StyleSheet.absoluteFillObject, { borderRadius: currentSize.borderRadius }]}
        />
        
        {showRipple && isPressed && (
          <Animated.View style={rippleStyle} />
        )}
        
        <View style={styles.buttonContent}>
          {icon && (
            <Ionicons
              name={icon}
              size={currentSize.iconSize}
              color={currentVariant.iconColor}
              style={styles.icon}
            />
          )}
          {title && (
            <Text
              style={[
                styles.buttonText,
                { 
                  fontSize: currentSize.fontSize,
                  color: currentVariant.textColor,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
          )}
          {children}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

/**
 * FloatingActionButton - visionOS style floating button
 */
export const FloatingActionButton = ({
  onPress,
  icon = 'add',
  workoutActive = false,
  style,
  ...props
}) => {
  const theme = useTheme();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Floating animation
  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
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
  }, []);

  // Rotation for workout active
  useEffect(() => {
    if (workoutActive) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [workoutActive]);

  const animatedStyle = {
    transform: [
      { translateY: floatAnim },
      {
        rotate: rotateAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.floatingButton, animatedStyle, style]}>
      <AdaptiveGlassContainer
        workoutIntensity={workoutActive ? 0.5 : 0}
        variant="energyGlass"
        onPress={onPress}
        style={styles.floatingButtonGlass}
        {...props}
      >
        <Ionicons
          name={icon}
          size={28}
          color={theme.isDarkMode ? '#FFFFFF' : '#000000'}
        />
      </AdaptiveGlassContainer>
    </Animated.View>
  );
};

/**
 * IconButton - Minimal button with icon
 */
export const IconButton = ({
  icon,
  onPress,
  size = 44,
  color,
  style,
  hapticFeedback = true,
  ...props
}) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (hapticFeedback && Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPress) onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} {...props}>
      <Animated.View
        style={[
          styles.iconButton,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: scaleAnim }],
          },
          style,
        ]}
      >
        <Ionicons
          name={icon}
          size={size * 0.5}
          color={color || (theme.isDarkMode ? '#FFFFFF' : '#000000')}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    overflow: 'hidden',
    position: 'relative',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  buttonText: {
    fontWeight: '600',
  },
  icon: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 1000,
  },
  floatingButtonGlass: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});

export default PulseButton;