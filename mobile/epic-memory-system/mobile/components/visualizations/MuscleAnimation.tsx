import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MuscleAnimationProps } from './VisualizationTypes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Individual Muscle Fiber Component
 * Simulates muscle fiber contraction with realistic timing
 */
const MuscleFiber = React.memo<{
  fiber: {
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    thickness: number;
    color: string;
    delay: number;
    contractionPhase: number;
  };
  contractionType: 'smooth' | 'intense' | 'pulsing';
  contractionSpeed: number;
}>(({ fiber, contractionType, contractionSpeed }) => {
  const contractionAnim = useRef(new Animated.Value(0)).current;
  const thicknessAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Fiber appear animation
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      delay: fiber.delay,
      useNativeDriver: true,
    }).start();

    // Contraction animation based on type
    let contractionAnimation;
    
    switch (contractionType) {
      case 'intense':
        contractionAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(contractionAnim, {
              toValue: 1,
              duration: contractionSpeed * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(contractionAnim, {
              toValue: 0,
              duration: contractionSpeed * 0.7,
              useNativeDriver: true,
            }),
          ])
        );
        break;
        
      case 'pulsing':
        contractionAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(contractionAnim, {
              toValue: 0.6,
              duration: contractionSpeed * 0.5,
              useNativeDriver: true,
            }),
            Animated.timing(contractionAnim, {
              toValue: 0,
              duration: contractionSpeed * 0.5,
              useNativeDriver: true,
            }),
          ])
        );
        break;
        
      default: // smooth
        contractionAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(contractionAnim, {
              toValue: 1,
              duration: contractionSpeed,
              useNativeDriver: true,
            }),
            Animated.timing(contractionAnim, {
              toValue: 0,
              duration: contractionSpeed,
              useNativeDriver: true,
            }),
          ])
        );
    }
    
    contractionAnimation.start();
    
    // Thickness variation during contraction
    Animated.loop(
      Animated.sequence([
        Animated.timing(thicknessAnim, {
          toValue: 1.2,
          duration: contractionSpeed * 0.5,
          useNativeDriver: true,
        }),
        Animated.timing(thicknessAnim, {
          toValue: 0.8,
          duration: contractionSpeed * 0.5,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      contractionAnim.stopAnimation();
      thicknessAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, [contractionType, contractionSpeed]);

  // Calculate fiber dimensions
  const fiberLength = Math.sqrt(
    Math.pow(fiber.endX - fiber.startX, 2) + Math.pow(fiber.endY - fiber.startY, 2)
  );
  const angle = Math.atan2(fiber.endY - fiber.startY, fiber.endX - fiber.startX);

  // Animated values for contraction effect
  const animatedLength = contractionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [fiberLength, fiberLength * 0.85], // Contract to 85% of original length
  });

  const animatedOpacity = contractionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  const shadowIntensity = contractionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.muscleFiber,
        {
          left: fiber.startX,
          top: fiber.startY,
          width: animatedLength,
          height: fiber.thickness,
          backgroundColor: fiber.color,
          opacity: Animated.multiply(opacityAnim, animatedOpacity),
          transform: [
            { rotate: `${angle}rad` },
            { scaleY: thicknessAnim },
          ],
          shadowColor: fiber.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: shadowIntensity,
          shadowRadius: fiber.thickness * 0.5,
          elevation: 4,
        },
      ]}
    />
  );
});

/**
 * Muscle Tension Wave Component
 * Creates wave-like tension patterns across muscle groups
 */
const TensionWave = React.memo<{
  waveColor: string;
  centerX: number;
  centerY: number;
  maxRadius: number;
  duration: number;
}>(({ waveColor, centerX, centerY, maxRadius, duration }) => {
  const waveAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 0.6,
              duration: duration * 0.2,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: duration * 0.8,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      waveAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, [duration]);

  const scale = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 1],
  });

  return (
    <Animated.View
      style={[
        styles.tensionWave,
        {
          left: centerX - maxRadius,
          top: centerY - maxRadius,
          width: maxRadius * 2,
          height: maxRadius * 2,
          borderColor: waveColor,
          opacity: opacityAnim,
          transform: [{ scale }],
        },
      ]}
    />
  );
});

/**
 * Main Muscle Animation Component
 * Creates realistic muscle fiber contraction animation for workout starts
 */
const MuscleAnimation: React.FC<MuscleAnimationProps> = ({
  duration = 2500,
  onComplete,
  colors = ['#FF6B35', '#FF8C42', '#FFA552', '#FFB562'],
  size = 300,
  isVisible = true,
  contractionType = 'smooth',
  fiberCount = 40,
  fiberLength = 120,
  contractionSpeed = 800,
  style
}) => {
  const [animationPhase, setAnimationPhase] = useState<'preparing' | 'contracting' | 'releasing' | 'completed'>('preparing');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasCompleted = useRef(false);

  // Generate muscle fiber patterns
  const muscleFibers = useMemo(() => {
    if (!isVisible) return [];

    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2;
    const fibers = [];
    
    // Create muscle fiber bundles in realistic patterns
    for (let i = 0; i < fiberCount; i++) {
      const bundleIndex = Math.floor(i / 5); // Group fibers into bundles
      const fiberInBundle = i % 5;
      
      // Calculate bundle positioning
      const bundleAngle = (bundleIndex / Math.ceil(fiberCount / 5)) * Math.PI * 2;
      const bundleRadius = (size / 4) + (Math.random() * size / 8);
      
      const bundleCenterX = centerX + Math.cos(bundleAngle) * bundleRadius;
      const bundleCenterY = centerY + Math.sin(bundleAngle) * bundleRadius;
      
      // Individual fiber positioning within bundle
      const fiberAngle = bundleAngle + (fiberInBundle - 2) * 0.1; // Small angle variation
      const fiberStartOffset = (Math.random() - 0.5) * 20;
      
      const startX = bundleCenterX + Math.cos(fiberAngle + Math.PI / 2) * fiberStartOffset;
      const startY = bundleCenterY + Math.sin(fiberAngle + Math.PI / 2) * fiberStartOffset;
      
      const endX = startX + Math.cos(fiberAngle) * fiberLength;
      const endY = startY + Math.sin(fiberAngle) * fiberLength;
      
      fibers.push({
        id: `fiber-${i}`,
        startX,
        startY,
        endX,
        endY,
        thickness: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: (bundleIndex * 50) + (fiberInBundle * 10),
        contractionPhase: Math.random() * 0.5, // Random phase offset
      });
    }
    
    return fibers;
  }, [isVisible, fiberCount, fiberLength, size, colors]);

  useEffect(() => {
    if (!isVisible) return;

    // Haptic feedback for muscle contraction start
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }

    // Animation sequence
    const animationSequence = Animated.sequence([
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Hold for contraction animation
      Animated.delay(duration - 400),
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start(() => {
      if (!hasCompleted.current) {
        hasCompleted.current = true;
        setAnimationPhase('completed');
        onComplete?.();
      }
    });

    // Phase transitions
    const phaseTimers = [
      setTimeout(() => setAnimationPhase('contracting'), 200),
      setTimeout(() => setAnimationPhase('releasing'), duration * 0.7),
    ];

    return () => {
      fadeAnim.stopAnimation();
      phaseTimers.forEach(clearTimeout);
    };
  }, [isVisible, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }, style]}>
      {/* Background gradient */}
      <View style={styles.backgroundGradient}>
        <View style={[
          styles.gradientCircle,
          {
            backgroundColor: colors[0] + '15',
            left: '20%',
            top: '25%',
          }
        ]} />
        <View style={[
          styles.gradientCircle,
          {
            backgroundColor: colors[1] + '15',
            right: '20%',
            bottom: '25%',
          }
        ]} />
      </View>

      {/* Muscle fibers */}
      <View style={styles.fiberContainer}>
        {muscleFibers.map((fiber) => (
          <MuscleFiber
            key={fiber.id}
            fiber={fiber}
            contractionType={contractionType}
            contractionSpeed={contractionSpeed}
          />
        ))}
      </View>

      {/* Tension waves */}
      {animationPhase === 'contracting' && (
        <>
          <TensionWave
            waveColor={colors[0]}
            centerX={SCREEN_WIDTH / 2}
            centerY={SCREEN_HEIGHT / 2}
            maxRadius={size / 2}
            duration={contractionSpeed * 2}
          />
          <TensionWave
            waveColor={colors[1]}
            centerX={SCREEN_WIDTH / 2}
            centerY={SCREEN_HEIGHT / 2}
            maxRadius={size / 3}
            duration={contractionSpeed * 1.5}
          />
        </>
      )}

      {/* Central power indicator */}
      <View style={styles.powerIndicator}>
        <Animated.View
          style={[
            styles.powerCore,
            {
              backgroundColor: colors[0],
              transform: [
                {
                  scale: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
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
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
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
    opacity: 0.3,
  },
  fiberContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  muscleFiber: {
    position: 'absolute',
    borderRadius: 1,
  },
  tensionWave: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  powerIndicator: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  powerCore: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
});

export default MuscleAnimation;
