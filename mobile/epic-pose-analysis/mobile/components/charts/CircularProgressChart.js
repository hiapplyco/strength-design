/**
 * Circular Progress Chart Component
 * Reusable circular progress indicator with smooth animations and customization
 * 
 * Features:
 * - Smooth animated progress from 0 to target value
 * - Customizable colors, size, and stroke width
 * - Optional percentage text display in center
 * - Accessibility compliant with screen reader support
 * - Performance optimized with React.memo and custom comparison
 * - Support for reduced motion accessibility setting
 */

import React, { useEffect, useRef, memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { accessibility } from '../../utils/designTokens';

// Default configuration values
const DEFAULT_CONFIG = {
  size: 120,
  strokeWidth: 8,
  duration: 1500,
  fontSize: 24,
  showPercentage: true,
  animated: true,
  backgroundColor: '#E5E5E5',
  progressColor: '#FF6B35',
  textColor: '#000000',
};

// Reduced motion fallback duration
const REDUCED_MOTION_DURATION = 300;

const CircularProgressChart = memo(function CircularProgressChart({
  score = 0,
  size = DEFAULT_CONFIG.size,
  strokeWidth = DEFAULT_CONFIG.strokeWidth,
  backgroundColor = DEFAULT_CONFIG.backgroundColor,
  progressColor = DEFAULT_CONFIG.progressColor,
  textColor = DEFAULT_CONFIG.textColor,
  fontSize = DEFAULT_CONFIG.fontSize,
  showPercentage = DEFAULT_CONFIG.showPercentage,
  animated = DEFAULT_CONFIG.animated,
  duration = DEFAULT_CONFIG.duration,
  gradientColors,
  style,
  accessibilityLabel,
  onAnimationComplete,
}) {
  // Animation values
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  
  // State for accessibility
  const [isReducedMotionEnabled, setIsReducedMotionEnabled] = React.useState(false);
  const [animationFinished, setAnimationFinished] = React.useState(!animated);

  // Calculate circle properties
  const { radius, circumference, strokeDasharray, center } = useMemo(() => {
    const r = (size - strokeWidth) / 2;
    const c = 2 * Math.PI * r;
    const centerPoint = size / 2;
    
    return {
      radius: r,
      circumference: c,
      strokeDasharray: c,
      center: centerPoint,
    };
  }, [size, strokeWidth]);

  // Check for reduced motion preference
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReducedMotionEnabled);
  }, []);

  // Animate progress when score changes
  useEffect(() => {
    if (!animated) {
      animatedValue.setValue(score);
      setAnimationFinished(true);
      return;
    }

    const animationDuration = isReducedMotionEnabled ? REDUCED_MOTION_DURATION : duration;
    
    // Reset animation value
    animatedValue.setValue(0);
    setAnimationFinished(false);

    // Create animation sequence
    const progressAnimation = Animated.timing(animatedValue, {
      toValue: score,
      duration: animationDuration,
      useNativeDriver: false, // Can't use native driver for SVG animations
    });

    // Add completion pulse if animation is enabled
    const completionSequence = animated && !isReducedMotionEnabled
      ? Animated.sequence([
          progressAnimation,
          Animated.sequence([
            Animated.timing(pulseValue, {
              toValue: 1.05,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(pulseValue, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]),
        ])
      : progressAnimation;

    completionSequence.start(() => {
      setAnimationFinished(true);
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });

    return () => {
      completionSequence.stop();
    };
  }, [score, animated, duration, isReducedMotionEnabled, animatedValue, pulseValue, onAnimationComplete]);

  // Calculate stroke dash offset based on progress
  const animatedStrokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  // Animated score text
  const animatedScore = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [0, score],
    extrapolate: 'clamp',
  });

  // Generate gradient ID for unique identification
  const gradientId = useMemo(() => `gradient_${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          width: size, 
          height: size,
          transform: [{ scale: pulseValue }]
        },
        style,
      ]}
      accessible={true}
      accessibilityLabel={accessibilityLabel || `Progress: ${Math.round(score)} percent`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: score }}
    >
      {/* SVG Circle Chart */}
      <Svg 
        width={size} 
        height={size} 
        style={styles.svg}
      >
        {/* Gradient Definition (if gradient colors provided) */}
        {gradientColors && (
          <Defs>
            <LinearGradient 
              id={gradientId}
              x1="0%" 
              y1="0%" 
              x2="100%" 
              y2="100%"
            >
              {gradientColors.map((color, index) => (
                <Stop
                  key={index}
                  offset={`${(index / (gradientColors.length - 1)) * 100}%`}
                  stopColor={color}
                />
              ))}
            </LinearGradient>
          </Defs>
        )}

        {/* Background Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
        />

        {/* Progress Circle */}
        <Animated.Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={gradientColors ? `url(#${gradientId})` : progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={animatedStrokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`} // Start from top
        />
      </Svg>

      {/* Center Text */}
      {showPercentage && (
        <View 
          style={styles.textContainer}
          pointerEvents="none"
        >
          <Animated.Text 
            style={[
              styles.scoreText, 
              { 
                color: textColor,
                fontSize: fontSize,
                lineHeight: fontSize * 1.2,
              }
            ]}
            accessible={true}
            accessibilityLabel={`Score: ${Math.round(score)}`}
          >
            {animationFinished ? (
              Math.round(score)
            ) : (
              <Animated.Text>
                {animatedScore.interpolate({
                  inputRange: [0, score],
                  outputRange: [0, score],
                  extrapolate: 'clamp',
                }).__getValue().toFixed(0)}
              </Animated.Text>
            )}
          </Animated.Text>
          <Text 
            style={[
              styles.percentText, 
              { 
                color: textColor,
                fontSize: fontSize * 0.4,
              }
            ]}
            accessible={false}
          >
            %
          </Text>
        </View>
      )}

      {/* Loading indicator for very slow animations */}
      {animated && !animationFinished && score > 0 && (
        <View style={styles.loadingIndicator}>
          <View style={[styles.loadingDot, { backgroundColor: progressColor }]} />
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    ...accessibility.minTouchTarget,
  },
  scoreText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  percentText: {
    fontWeight: '600',
    marginLeft: 2,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  loadingIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

// Custom comparison function for memo optimization
function arePropsEqual(prevProps, nextProps) {
  return (
    prevProps.score === nextProps.score &&
    prevProps.size === nextProps.size &&
    prevProps.strokeWidth === nextProps.strokeWidth &&
    prevProps.backgroundColor === nextProps.backgroundColor &&
    prevProps.progressColor === nextProps.progressColor &&
    prevProps.textColor === nextProps.textColor &&
    prevProps.fontSize === nextProps.fontSize &&
    prevProps.showPercentage === nextProps.showPercentage &&
    prevProps.animated === nextProps.animated &&
    prevProps.duration === nextProps.duration &&
    JSON.stringify(prevProps.gradientColors) === JSON.stringify(nextProps.gradientColors)
  );
}

CircularProgressChart.displayName = 'CircularProgressChart';

export default memo(CircularProgressChart, arePropsEqual);