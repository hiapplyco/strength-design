/**
 * Analysis Progress Indicator - Beautiful Progress Tracking Component
 * Animated circular progress indicator with step visualization
 * 
 * Features:
 * - Animated circular progress ring
 * - Step-by-step progress visualization
 * - Error and completion states
 * - Accessibility compliant
 * - Smooth animations
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  AccessibilityInfo
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function AnalysisProgressIndicator({
  progress = 0,
  currentStep = 0,
  totalSteps = 5,
  isError = false,
  isComplete = false,
  size = 120,
  strokeWidth = 8,
  showPercentage = true,
  showSteps = true
}) {
  const { theme, isDarkMode } = useTheme();
  
  // Animation refs
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;
  
  useEffect(() => {
    // Progress animation
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);
  
  useEffect(() => {
    // Entry animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 80,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, []);
  
  useEffect(() => {
    // State-based animations
    if (isComplete) {
      // Success pulse
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else if (isError) {
      // Error shake
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Loading rotation
      const rotationAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      rotationAnimation.start();
      
      return () => rotationAnimation.stop();
    }
  }, [isError, isComplete]);
  
  const getProgressColor = () => {
    if (isError) return '#FF6B6B';
    if (isComplete) return '#4CAF50';
    return theme.primary;
  };
  
  const getBackgroundColor = () => {
    return isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  };
  
  const strokeDasharray = circumference;
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp'
  });
  
  const rotation = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-5deg', '0deg', '5deg'],
    extrapolate: 'clamp'
  });
  
  // Announce progress changes to screen readers
  useEffect(() => {
    if (progress > 0) {
      AccessibilityInfo.announceForAccessibility(
        `Analysis progress: ${Math.round(progress)}%${isComplete ? ' complete' : ''}`
      );
    }
  }, [progress, isComplete]);
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size + 40,
          height: size + 40,
          transform: [
            { scale: scaleAnim },
            { scale: pulseAnim },
            { rotate: rotation }
          ]
        }
      ]}
      accessible={true}
      accessibilityLabel={`Progress indicator, ${Math.round(progress)}% complete`}
      accessibilityHint="Shows current analysis progress"
    >
      {/* Main Progress Circle */}
      <View style={[styles.circleContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} style={styles.svg}>
          {/* Background Circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={getBackgroundColor()}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Progress Circle */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={getProgressColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>
        
        {/* Center Content */}
        <View style={styles.centerContent}>
          {isComplete ? (
            <View style={styles.successIcon}>
              <Ionicons 
                name="checkmark-circle" 
                size={size * 0.3} 
                color="#4CAF50" 
              />
            </View>
          ) : isError ? (
            <View style={styles.errorIcon}>
              <Ionicons 
                name="alert-circle" 
                size={size * 0.3} 
                color="#FF6B6B" 
              />
            </View>
          ) : (
            <View style={styles.progressContent}>
              {showPercentage && (
                <Animated.Text style={[
                  styles.progressText,
                  { 
                    color: theme.text,
                    fontSize: size * 0.15
                  }
                ]}>
                  {progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0', Math.round(progress).toString()],
                    extrapolate: 'clamp'
                  })}%
                </Animated.Text>
              )}
              
              {showSteps && (
                <Text style={[
                  styles.stepText,
                  { 
                    color: theme.textSecondary,
                    fontSize: size * 0.08
                  }
                ]}>
                  Step {currentStep + 1}/{totalSteps}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
      
      {/* Pulse Rings for Active State */}
      {!isComplete && !isError && progress > 0 && (
        <View style={styles.pulseContainer}>
          {[1, 2, 3].map((ring, index) => (
            <PulseRing 
              key={ring}
              size={size + (ring * 20)}
              delay={index * 400}
              color={getProgressColor()}
            />
          ))}
        </View>
      )}
      
      {/* Sparkle Effect for Completion */}
      {isComplete && (
        <View style={styles.sparkleContainer}>
          {[...Array(8)].map((_, index) => (
            <SparkleParticle
              key={index}
              angle={index * 45}
              distance={size * 0.7}
              color="#4CAF50"
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

// Pulse Ring Component for Active Animation
const PulseRing = ({ size, delay, color }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 2000,
          delay,
          useNativeDriver: true,
        })
      ])
    );
    
    animation.start();
    return () => animation.stop();
  }, [delay]);
  
  return (
    <Animated.View
      style={[
        styles.pulseRing,
        {
          width: size,
          height: size,
          borderColor: color,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    />
  );
};

// Sparkle Particle for Completion Effect
const SparkleParticle = ({ angle, distance, color }) => {
  const moveAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animation = Animated.sequence([
      Animated.delay(Math.random() * 500),
      Animated.parallel([
        Animated.timing(moveAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          })
        ])
      ])
    ]);
    
    animation.start();
  }, []);
  
  const radian = (angle * Math.PI) / 180;
  const translateX = moveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.cos(radian) * distance],
  });
  const translateY = moveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.sin(radian) * distance],
  });
  
  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          opacity: opacityAnim,
          transform: [
            { translateX },
            { translateY },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      <Ionicons name="star" size={8} color={color} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContent: {
    alignItems: 'center',
  },
  progressText: {
    fontWeight: '800',
    textAlign: 'center',
  },
  stepText: {
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  successIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 2,
  },
  sparkleContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
});