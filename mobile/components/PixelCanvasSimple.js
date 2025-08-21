import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  AccessibilityInfo,
  Easing,
} from 'react-native';

/**
 * PixelCanvasSimple - Optimized pixel shimmer without external dependencies
 * Pure React Native implementation with batched animations
 */
const PixelCanvasSimple = ({
  colors = ['#e0e0e0', '#d0d0d0', '#c0c0c0'],
  gap = 5,
  speed = 35,
  noFocus = false,
  style,
  onHoverStart,
  onHoverEnd,
  testID,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const animationValues = useRef([]);
  const animationRefs = useRef([]);
  
  // Clamp and validate props
  const clampedGap = Math.min(Math.max(gap, 4), 50);
  const clampedSpeed = Math.min(Math.max(speed, 0), 100);
  const animationDuration = clampedSpeed > 0 ? (100 - clampedSpeed) * 20 + 500 : 0;
  
  // Parse colors if string
  const parsedColors = typeof colors === 'string' 
    ? colors.split(',').map(c => c.trim())
    : colors;
  
  // Get dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const containerWidth = style?.width || screenWidth;
  const containerHeight = style?.height || screenHeight;
  
  // Check accessibility settings
  useEffect(() => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      AccessibilityInfo.isReduceMotionEnabled()
        .then(setReducedMotion)
        .catch(() => setReducedMotion(false));
    }
  }, []);
  
  // Generate optimized pixel grid
  const pixels = useMemo(() => {
    const pixelSize = 3;
    const totalGap = clampedGap;
    const cols = Math.floor(containerWidth / (pixelSize + totalGap));
    const rows = Math.floor(containerHeight / (pixelSize + totalGap));
    
    // Limit total pixels for performance
    const maxPixels = 200;
    const skipFactor = Math.max(1, Math.ceil((cols * rows) / maxPixels));
    
    const pixelArray = [];
    let index = 0;
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (index % skipFactor === 0) {
          const color = parsedColors[Math.floor(Math.random() * parsedColors.length)];
          const animValue = new Animated.Value(0);
          
          pixelArray.push({
            id: `${x}-${y}`,
            x: x * (pixelSize + totalGap),
            y: y * (pixelSize + totalGap),
            size: pixelSize,
            color,
            animValue,
            delay: Math.random() * 500,
            duration: animationDuration + Math.random() * 500,
          });
          
          animationValues.current.push(animValue);
        }
        index++;
      }
    }
    
    return pixelArray;
  }, [containerWidth, containerHeight, clampedGap, parsedColors, animationDuration]);
  
  // Shimmer animation
  const startShimmer = useCallback(() => {
    if (reducedMotion || clampedSpeed === 0) return;
    
    // Batch animations for better performance
    const animations = pixels.map((pixel, index) => {
      if (index % 3 === 0) { // Animate only 1/3 of pixels at a time
        return Animated.sequence([
          Animated.delay(pixel.delay),
          Animated.loop(
            Animated.sequence([
              Animated.timing(pixel.animValue, {
                toValue: 1,
                duration: pixel.duration,
                easing: Easing.inOut(Easing.sine),
                useNativeDriver: true,
              }),
              Animated.timing(pixel.animValue, {
                toValue: 0,
                duration: pixel.duration,
                easing: Easing.inOut(Easing.sine),
                useNativeDriver: true,
              }),
            ])
          ),
        ]);
      }
      return null;
    }).filter(Boolean);
    
    // Start animations in batches
    const batchSize = 10;
    for (let i = 0; i < animations.length; i += batchSize) {
      const batch = animations.slice(i, i + batchSize);
      const animation = Animated.parallel(batch);
      animation.start();
      animationRefs.current.push(animation);
    }
  }, [pixels, reducedMotion, clampedSpeed]);
  
  // Stop all animations
  const stopShimmer = useCallback(() => {
    animationRefs.current.forEach(anim => anim?.stop());
    animationRefs.current = [];
    animationValues.current.forEach(value => value.setValue(0));
  }, []);
  
  // Handle activation state
  useEffect(() => {
    if (isActive) {
      startShimmer();
    } else {
      stopShimmer();
    }
    
    return () => {
      stopShimmer();
    };
  }, [isActive, startShimmer, stopShimmer]);
  
  // Touch/hover handlers
  const handleTouchStart = () => {
    setIsActive(true);
    onHoverStart?.();
  };
  
  const handleTouchEnd = () => {
    setIsActive(false);
    onHoverEnd?.();
  };
  
  const handleFocus = () => {
    if (!noFocus) {
      setIsActive(true);
      onHoverStart?.();
    }
  };
  
  const handleBlur = () => {
    if (!noFocus) {
      setIsActive(false);
      onHoverEnd?.();
    }
  };
  
  return (
    <View
      style={[styles.container, style]}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onFocus={handleFocus}
      onBlur={handleBlur}
      testID={testID}
      pointerEvents="box-only"
    >
      {pixels.map(pixel => (
        <Animated.View
          key={pixel.id}
          style={[
            styles.pixel,
            {
              left: pixel.x,
              top: pixel.y,
              width: pixel.size,
              height: pixel.size,
              backgroundColor: pixel.color,
              opacity: pixel.animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
              transform: [
                {
                  scale: pixel.animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.5],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  pixel: {
    position: 'absolute',
    borderRadius: 1,
  },
});

export default PixelCanvasSimple;