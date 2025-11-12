import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  Platform,
} from 'react-native';
import {
  PixelData,
  AnimationConfig,
  PERFORMANCE_CONFIG,
  PerformanceMetrics,
  VisualizationHooks,
  StrengthDesignLoaderProps,
} from './VisualizationTypes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');


// Optimized pixel component with memoization
const AnimatedPixel = React.memo<{ pixel: PixelData; colors: string[] }>(({ pixel, colors }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const shimmerValue = useRef(new Animated.Value(0)).current;
  const intensityValue = useRef(new Animated.Value(pixel.intensity || 1)).current;

  useEffect(() => {
    // Staggered appear animation with performance optimization
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 400,
      delay: Math.min(pixel.delay, 1500), // Cap delay for better UX
      useNativeDriver: true,
    }).start();

    // Continuous shimmer with variable intensity
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1200 + pixel.shimmerDelay,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1200 + pixel.shimmerDelay,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      animatedValue.stopAnimation();
      shimmerValue.stopAnimation();
    };
  }, [pixel.delay, pixel.shimmerDelay]);

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const opacity = Animated.multiply(
    animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.9],
    }),
    shimmerValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.4],
    })
  );

  const glowIntensity = Animated.multiply(shimmerValue, intensityValue);

  return (
    <Animated.View
      style={[
        styles.pixel,
        {
          left: pixel.x,
          top: pixel.y,
          width: pixel.size,
          height: pixel.size,
          backgroundColor: pixel.color,
          opacity,
          transform: [{ scale }],
          shadowColor: pixel.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: Platform.select({ ios: 0.8, android: 0.6 }),
          shadowRadius: glowIntensity.interpolate({
            inputRange: [0, 1],
            outputRange: [2, pixel.size * 0.8],
          }),
          elevation: 8,
        },
      ]}
    />
  );
});

const StrengthDesignLoader: React.FC<StrengthDesignLoaderProps> = ({
  isVisible = true,
  duration = 2500,
  colors = ['#00F0FF', '#FF6B35', '#00FF88', '#FF00FF'],
  pixelSize = 8,
  animationType = 'spiral',
  message = 'STRENGTH.DESIGN',
  brandMessage = 'Powering Your Potential',
  onComplete,
  onFrameUpdate,
  onAnimationStart,
  onAnimationEnd,
  onPerformanceWarning,
}) => {
  const [progress, setProgress] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const messageAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const performanceTimer = useRef<NodeJS.Timeout>();

  // Strength.Design logo pattern - optimized S.D. letters
  const strengthLogoPattern = useMemo(() => [
    // S letter (left)
    [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
    // Period (center)
    [0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0],
    // D letter (right)
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0],
  ], []);

  // Advanced animation delay calculation
  const getAnimationDelay = useCallback((x: number, y: number, centerX: number, centerY: number): number => {
    const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    
    switch (animationType) {
      case 'spiral':
        const angle = Math.atan2(y - centerY, x - centerX);
        const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
        return (distance * 12) + (normalizedAngle * 400);
      
      case 'magnetic':
        // Magnetic field effect - pixels closer to logo appear first
        const logoDistance = Math.min(
          Math.abs(x - centerX + 6), // S position
          Math.abs(x - centerX),     // Period position  
          Math.abs(x - centerX - 6)  // D position
        );
        return logoDistance * 25 + (distance * 8);
      
      case 'wave':
        return (x * 15) + (Math.sin(y * 0.2) * 80);
      
      case 'explosion':
        return Math.max(0, 800 - (distance * 15));
      
      case 'pulse':
        return Math.floor(distance / 4) * 150;
      
      default:
        return distance * 10;
    }
  }, [animationType]);

  // Generate optimized pixel grid with performance monitoring
  const pixels = useMemo(() => {
    if (!isVisible) return [];

    const startTime = performance.now();
    const cols = Math.floor(SCREEN_WIDTH / pixelSize);
    const rows = Math.floor(SCREEN_HEIGHT / pixelSize);
    const centerX = Math.floor(cols / 2);
    const centerY = Math.floor(rows / 2);
    const pixelArray: PixelData[] = [];

    const patternWidth = strengthLogoPattern[0]?.length || 0;
    const patternHeight = strengthLogoPattern.length;
    const patternStartX = Math.floor((cols - patternWidth) / 2);
    const patternStartY = Math.floor((rows - patternHeight) / 2);

    // Adaptive step size based on performance
    const step = pixelArray.length > PERFORMANCE_CONFIG.lowEndThreshold ? 3 : 2;

    for (let x = 0; x < cols; x += step) {
      for (let y = 0; y < rows; y += step) {
        if (pixelArray.length >= PERFORMANCE_CONFIG.maxPixels) break;

        const patternX = x - patternStartX;
        const patternY = y - patternStartY;
        
        let isLogoPixel = false;
        let logoIntensity = 1;

        // Check if pixel is part of S.D. logo
        if (
          patternX >= 0 && 
          patternX < patternWidth &&
          patternY >= 0 && 
          patternY < patternHeight &&
          strengthLogoPattern[patternY]?.[patternX] === 1
        ) {
          isLogoPixel = true;
          logoIntensity = 1.5; // Brighter for logo pixels
        }

        const shouldCreatePixel = isLogoPixel || Math.random() > 0.6;

        if (shouldCreatePixel) {
          const delay = getAnimationDelay(x, y, centerX, centerY);
          const colorIndex = isLogoPixel 
            ? Math.floor(patternX / 6) % colors.length // Different colors for S, period, D
            : Math.floor(Math.random() * colors.length);

          pixelArray.push({
            id: `${x}-${y}`,
            x: x * pixelSize,
            y: y * pixelSize,
            color: colors[colorIndex],
            delay: Math.min(delay, 1500),
            shimmerDelay: Math.random() * 1000,
            size: isLogoPixel ? pixelSize + 2 : pixelSize - 2,
            intensity: logoIntensity,
            pattern: isLogoPixel ? 'logo' : 'background',
          });
        }
      }
    }

    const endTime = performance.now();
    const generationTime = endTime - startTime;

    // Performance warning if generation takes too long
    if (generationTime > 100 && onPerformanceWarning) {
      onPerformanceWarning({
        frameTime: generationTime,
        pixelCount: pixelArray.length,
        animationLoad: 0,
        memoryUsage: 0,
      });
    }

    return pixelArray;
  }, [isVisible, pixelSize, colors, animationType, getAnimationDelay, strengthLogoPattern, onPerformanceWarning]);

  // Performance monitoring
  useEffect(() => {
    if (!isVisible || !onFrameUpdate) return;

    performanceTimer.current = setInterval(() => {
      const metrics: PerformanceMetrics = {
        frameTime: 16.67, // Target 60fps
        pixelCount: pixels.length,
        animationLoad: pixels.length / PERFORMANCE_CONFIG.maxPixels,
        memoryUsage: pixels.length * 8, // Rough estimate
      };
      onFrameUpdate(metrics);
    }, 1000);

    return () => {
      if (performanceTimer.current) {
        clearInterval(performanceTimer.current);
      }
    };
  }, [isVisible, pixels.length, onFrameUpdate]);

  // Main animation sequence
  useEffect(() => {
    if (!isVisible) return;

    onAnimationStart?.();

    // Fade in container
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Logo pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(logoAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Show message after initial pixel appearance
    const messageTimer = setTimeout(() => {
      setShowMessage(true);
      Animated.timing(messageAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 600);

    // Progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration - 600,
      useNativeDriver: false,
    }).start();

    // Progress counter
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + (100 / (duration / 50));
        return next >= 100 ? 100 : next;
      });
    }, 50);

    // Completion handler
    const completionTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(messageAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onAnimationEnd?.();
        onComplete?.();
      });
    }, duration);

    return () => {
      clearTimeout(messageTimer);
      clearTimeout(completionTimer);
      clearInterval(progressInterval);
    };
  }, [isVisible, duration, onComplete, onAnimationStart, onAnimationEnd]);

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Background gradient effect */}
      <View style={styles.gradientContainer}>
        <Animated.View 
          style={[
            styles.gradientCircle,
            {
              backgroundColor: colors[0] + '15',
              opacity: logoAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.7],
              }),
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.gradientCircle,
            {
              backgroundColor: colors[1] + '15',
              right: '15%',
              bottom: '25%',
              opacity: logoAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 0.3],
              }),
            }
          ]} 
        />
      </View>

      {/* Pixel Grid */}
      <View style={styles.pixelContainer}>
        {pixels.map((pixel) => (
          <AnimatedPixel key={pixel.id} pixel={pixel} colors={colors} />
        ))}
      </View>

      {/* Brand Message */}
      <Animated.View style={[styles.messageContainer, { opacity: messageAnim }]}>
        <Animated.Text 
          style={[
            styles.messageText,
            {
              textShadowColor: colors[0] + '88',
              transform: [
                {
                  scale: logoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.02],
                  }),
                },
              ],
            }
          ]}
        >
          {message}
        </Animated.Text>
        
        <Text style={[styles.subMessageText, { color: colors[1] }]}>
          {brandMessage}
        </Text>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <Animated.View 
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: colors[2],
                shadowColor: colors[2],
              }
            ]} 
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 9999,
  },
  gradientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientCircle: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: SCREEN_WIDTH * 0.3,
    left: '20%',
    top: '35%',
  },
  pixelContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pixel: {
    position: 'absolute',
    borderRadius: 1,
  },
  messageContainer: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.2,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subMessageText: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 20,
    opacity: 0.8,
    letterSpacing: 1,
  },
  progressContainer: {
    width: 200,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
});

export default StrengthDesignLoader;