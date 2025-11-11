import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BarbellAnimationProps } from './VisualizationTypes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Weight Plate Component
 * Individual plates that animate onto the barbell
 */
const WeightPlate = React.memo<{
  plate: {
    id: string;
    weight: number;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    delay: number;
    side: 'left' | 'right';
    plateType: '45' | '35' | '25' | '10' | '5' | '2.5';
  };
  loadingPhase: 'assembling' | 'lifting' | 'lowering';
  liftHeight: number;
}>(({ plate, loadingPhase, liftHeight }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const liftAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Plate loading animation (slide in from sides)
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 400,
      delay: plate.delay,
      useNativeDriver: true,
    }).start();

    // Scale in animation
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 300,
      delay: plate.delay + 200,
      useNativeDriver: true,
    }).start();

    // Subtle rotation for realism
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: -1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      slideAnim.stopAnimation();
      liftAnim.stopAnimation();
      scaleAnim.stopAnimation();
      rotateAnim.stopAnimation();
    };
  }, [plate.delay]);

  useEffect(() => {
    // Lifting animation
    if (loadingPhase === 'lifting') {
      Animated.timing(liftAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } else if (loadingPhase === 'lowering') {
      Animated.timing(liftAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [loadingPhase, liftHeight]);

  // Slide in from appropriate side
  const slideX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      plate.side === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH,
      0
    ],
  });

  // Lifting motion
  const liftY = liftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -liftHeight],
  });

  // Rotation animation
  const rotation = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-2deg', '2deg'],
  });

  // Weight-based glow intensity
  const glowIntensity = useMemo(() => {
    switch (plate.plateType) {
      case '45': return 20;
      case '35': return 15;
      case '25': return 12;
      case '10': return 8;
      case '5': return 5;
      case '2.5': return 3;
      default: return 8;
    }
  }, [plate.plateType]);

  return (
    <Animated.View
      style={[
        styles.weightPlate,
        {
          left: plate.x - plate.width / 2,
          top: plate.y - plate.height / 2,
          width: plate.width,
          height: plate.height,
          backgroundColor: plate.color,
          borderRadius: plate.width / 8,
          opacity: scaleAnim,
          transform: [
            { translateX: slideX },
            { translateY: liftY },
            { scale: scaleAnim },
            { rotate: rotation },
          ],
          shadowColor: plate.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: glowIntensity,
          elevation: Math.floor(glowIntensity / 2),
        },
      ]}
    >
      {/* Inner plate detail */}
      <View style={[
        styles.plateInner,
        {
          width: plate.width * 0.8,
          height: plate.height * 0.8,
          borderRadius: (plate.width * 0.8) / 8,
          backgroundColor: 'rgba(255,255,255,0.1)',
          margin: plate.width * 0.1,
        }
      ]} />
      
      {/* Center hole */}
      <View style={[
        styles.plateHole,
        {
          width: plate.width * 0.3,
          height: plate.height * 0.3,
          borderRadius: (plate.width * 0.3) / 2,
          backgroundColor: '#000',
          position: 'absolute',
          top: (plate.height - plate.height * 0.3) / 2,
          left: (plate.width - plate.width * 0.3) / 2,
        }
      ]} />

      {/* Weight marking */}
      <Animated.View style={[
        styles.weightText,
        {
          opacity: scaleAnim,
        }
      ]}>
        {/* Weight text would go here - simplified for performance */}
      </Animated.View>
    </Animated.View>
  );
});

/**
 * Barbell Bar Component
 * The main barbell bar that plates load onto
 */
const BarbellBar = React.memo<{
  barLength: number;
  barThickness: number;
  barColor: string;
  centerX: number;
  centerY: number;
  loadingPhase: 'assembling' | 'lifting' | 'lowering';
  liftHeight: number;
}>(({ barLength, barThickness, barColor, centerX, centerY, loadingPhase, liftHeight }) => {
  const growAnim = useRef(new Animated.Value(0)).current;
  const liftAnim = useRef(new Animated.Value(0)).current;
  const flexAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Bar grows from center outward
    Animated.timing(growAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Subtle flex animation during lifting
    Animated.loop(
      Animated.sequence([
        Animated.timing(flexAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(flexAnim, {
          toValue: -1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      growAnim.stopAnimation();
      liftAnim.stopAnimation();
      flexAnim.stopAnimation();
    };
  }, []);

  useEffect(() => {
    // Lifting animation
    if (loadingPhase === 'lifting') {
      Animated.timing(liftAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } else if (loadingPhase === 'lowering') {
      Animated.timing(liftAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [loadingPhase, liftHeight]);

  const scaleX = growAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const liftY = liftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -liftHeight],
  });

  // Barbell flex under weight
  const flexY = flexAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-2, 2],
  });

  return (
    <View style={styles.barbellContainer}>
      {/* Main bar */}
      <Animated.View
        style={[
          styles.barbellBar,
          {
            left: centerX - barLength / 2,
            top: centerY - barThickness / 2,
            width: barLength,
            height: barThickness,
            backgroundColor: barColor,
            borderRadius: barThickness / 2,
            transform: [
              { scaleX },
              { translateY: Animated.add(liftY, flexY) },
            ],
            shadowColor: barColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 5,
          },
        ]}
      >
        {/* Bar texture/grip marks */}
        <View style={styles.gripMarks}>
          {[...Array(5)].map((_, i) => (
            <View
              key={`grip-${i}`}
              style={[
                styles.gripMark,
                {
                  left: (barLength / 6) * (i + 1),
                  top: barThickness * 0.2,
                  width: 2,
                  height: barThickness * 0.6,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>

      {/* Bar collars (clips that hold plates) */}
      <Animated.View
        style={[
          styles.barCollar,
          {
            left: centerX - barLength * 0.35,
            top: centerY - barThickness * 0.8,
            width: barThickness * 1.6,
            height: barThickness * 1.6,
            borderRadius: barThickness * 0.8,
            backgroundColor: '#FFD700',
            transform: [
              { translateY: liftY },
              { scale: growAnim },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.barCollar,
          {
            left: centerX + barLength * 0.35 - barThickness * 0.8,
            top: centerY - barThickness * 0.8,
            width: barThickness * 1.6,
            height: barThickness * 1.6,
            borderRadius: barThickness * 0.8,
            backgroundColor: '#FFD700',
            transform: [
              { translateY: liftY },
              { scale: growAnim },
            ],
          },
        ]}
      />
    </View>
  );
});

/**
 * Loading Progress Indicator
 * Shows the current weight being loaded
 */
const LoadingProgress = React.memo<{
  currentWeight: number;
  targetWeight: number;
  centerX: number;
  centerY: number;
  colors: string[];
}>(({ currentWeight, targetWeight, centerX, centerY, colors }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const progress = currentWeight / targetWeight;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      progressAnim.stopAnimation();
      pulseAnim.stopAnimation();
    };
  }, [currentWeight, targetWeight]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <View style={[
      styles.progressContainer,
      {
        left: centerX - 100,
        top: centerY + 80,
      }
    ]}>
      {/* Progress bar background */}
      <View style={styles.progressBackground} />
      
      {/* Progress bar fill */}
      <Animated.View
        style={[
          styles.progressFill,
          {
            width: progressWidth,
            backgroundColor: colors[0],
            opacity: pulseOpacity,
          },
        ]}
      />
      
      {/* Weight text indicator */}
      <Animated.View
        style={[
          styles.weightIndicator,
          {
            opacity: pulseOpacity,
          },
        ]}
      />
    </View>
  );
});

/**
 * Gym Floor Component
 * Adds environmental context
 */
const GymFloor = React.memo<{
  centerY: number;
  colors: string[];
}>(({ centerY, colors }) => {
  const floorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(floorAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    return () => {
      floorAnim.stopAnimation();
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.gymFloor,
        {
          top: centerY + 120,
          opacity: floorAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.3],
          }),
          transform: [
            {
              scaleX: floorAnim,
            },
          ],
        },
      ]}
    >
      {/* Floor texture lines */}
      {[...Array(8)].map((_, i) => (
        <View
          key={`floor-line-${i}`}
          style={[
            styles.floorLine,
            {
              left: i * (SCREEN_WIDTH / 8),
              backgroundColor: colors[0] + '20',
            },
          ]}
        />
      ))}
    </Animated.View>
  );
});

/**
 * Main Barbell Animation Component
 * Creates a realistic barbell loading animation for workout contexts
 */
const BarbellAnimation: React.FC<BarbellAnimationProps> = ({
  duration = 3000,
  onComplete,
  colors = ['#FF6B35', '#FFD700', '#C0C0C0', '#8B4513'],
  size = 280,
  isVisible = true,
  targetWeight = 225,
  plateConfiguration = 'standard',
  liftType = 'deadlift',
  showProgress = true,
  style,
}) => {
  const [animationPhase, setAnimationPhase] = useState<'assembling' | 'lifting' | 'lowering' | 'completed'>('assembling');
  const [currentWeight, setCurrentWeight] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasCompleted = useRef(false);

  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;

  // Generate weight plates based on target weight
  const weightPlates = useMemo(() => {
    if (!isVisible) return [];

    const plates = [];
    let remainingWeight = targetWeight - 45; // Subtract bar weight
    let plateId = 0;
    let leftX = centerX - size * 0.35;
    let rightX = centerX + size * 0.35;
    
    // Standard plate weights in descending order
    const standardPlates = [
      { weight: 45, color: colors[0], type: '45' },
      { weight: 35, color: colors[1], type: '35' },
      { weight: 25, color: colors[2], type: '25' },
      { weight: 10, color: colors[3], type: '10' },
      { weight: 5, color: colors[0], type: '5' },
      { weight: 2.5, color: colors[1], type: '2.5' },
    ];
    
    let delay = 200;
    
    for (const plateInfo of standardPlates) {
      const pairsNeeded = Math.floor(remainingWeight / (plateInfo.weight * 2));
      
      for (let pair = 0; pair < pairsNeeded; pair++) {
        const plateSize = Math.max(40, plateInfo.weight * 1.2);
        
        // Left plate
        plates.push({
          id: `plate-left-${plateId}`,
          weight: plateInfo.weight,
          x: leftX - (pair * 12),
          y: centerY,
          width: plateSize,
          height: plateSize,
          color: plateInfo.color,
          delay: delay,
          side: 'left' as const,
          plateType: plateInfo.type as any,
        });
        
        // Right plate
        plates.push({
          id: `plate-right-${plateId}`,
          weight: plateInfo.weight,
          x: rightX + (pair * 12),
          y: centerY,
          width: plateSize,
          height: plateSize,
          color: plateInfo.color,
          delay: delay + 50,
          side: 'right' as const,
          plateType: plateInfo.type as any,
        });
        
        delay += 100;
        plateId++;
      }
      
      remainingWeight -= pairsNeeded * plateInfo.weight * 2;
      if (remainingWeight <= 0) break;
    }
    
    return plates;
  }, [isVisible, targetWeight, colors, size, centerX, centerY]);

  // Calculate lift height based on lift type
  const liftHeight = useMemo(() => {
    switch (liftType) {
      case 'overhead-press': return 150;
      case 'bench-press': return 30;
      case 'squat': return 80;
      case 'deadlift': return 100;
      default: return 80;
    }
  }, [liftType]);

  useEffect(() => {
    if (!isVisible) return;

    // Update current weight as plates are added
    const weightInterval = setInterval(() => {
      if (animationPhase === 'assembling') {
        setCurrentWeight(prev => {
          const next = Math.min(prev + 15, targetWeight);
          return next;
        });
      }
    }, 150);

    // Haptic feedback for barbell setup
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    // Animation sequence
    const animationSequence = Animated.sequence([
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Hold for plate loading and lifting
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
      setTimeout(() => setAnimationPhase('lifting'), duration * 0.4),
      setTimeout(() => setAnimationPhase('lowering'), duration * 0.7),
    ];

    return () => {
      clearInterval(weightInterval);
      fadeAnim.stopAnimation();
      phaseTimers.forEach(clearTimeout);
    };
  }, [isVisible, duration, animationPhase, targetWeight, onComplete]);

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }, style]}>
      {/* Background gym environment */}
      <View style={styles.backgroundGradient}>
        <View style={[
          styles.gradientCircle,
          {
            backgroundColor: colors[0] + '10',
            left: '20%',
            top: '25%',
          }
        ]} />
        <View style={[
          styles.gradientCircle,
          {
            backgroundColor: colors[1] + '10',
            right: '20%',
            bottom: '25%',
          }
        ]} />
      </View>

      {/* Gym floor */}
      <GymFloor centerY={centerY} colors={colors} />

      {/* Barbell bar */}
      <BarbellBar
        barLength={size}
        barThickness={16}
        barColor={colors[2]}
        centerX={centerX}
        centerY={centerY}
        loadingPhase={animationPhase}
        liftHeight={liftHeight}
      />

      {/* Weight plates */}
      {weightPlates.map((plate) => (
        <WeightPlate
          key={plate.id}
          plate={plate}
          loadingPhase={animationPhase}
          liftHeight={liftHeight}
        />
      ))}

      {/* Loading progress indicator */}
      {showProgress && (
        <LoadingProgress
          currentWeight={currentWeight}
          targetWeight={targetWeight}
          centerX={centerX}
          centerY={centerY}
          colors={colors}
        />
      )}

      {/* Power indicators */}
      {animationPhase === 'lifting' && (
        <View style={styles.powerEffects}>
          <Animated.View
            style={[
              styles.powerBurst,
              {
                left: centerX - 15,
                top: centerY - 15,
                backgroundColor: colors[0],
                opacity: fadeAnim,
              },
            ]}
          />
        </View>
      )}
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
    opacity: 0.2,
  },
  barbellContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  barbellBar: {
    position: 'absolute',
  },
  gripMarks: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gripMark: {
    position: 'absolute',
    borderRadius: 1,
  },
  barCollar: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowColor: '#FFD700',
    elevation: 6,
  },
  weightPlate: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  plateInner: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  plateHole: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  weightText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    position: 'absolute',
    width: 200,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 4,
  },
  weightIndicator: {
    position: 'absolute',
    top: -20,
    right: 0,
    width: 60,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
  },
  gymFloor: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  floorLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  powerEffects: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  powerBurst: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 8,
  },
});

export default BarbellAnimation;