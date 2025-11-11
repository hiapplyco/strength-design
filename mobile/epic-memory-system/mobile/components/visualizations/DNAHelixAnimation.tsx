import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { DNAHelixProps } from './VisualizationTypes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * DNA Base Component
 * Represents individual nucleotide bases (A, T, G, C)
 */
const DNABase = React.memo<{
  base: {
    id: string;
    x: number;
    y: number;
    type: 'A' | 'T' | 'G' | 'C';
    strand: 1 | 2;
    angle: number;
    color: string;
    delay: number;
    paired: boolean;
  };
  rotationValue: Animated.Value;
  showBases: boolean;
}>(({ base, rotationValue, showBases }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Appear animation
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 300,
      delay: base.delay,
      useNativeDriver: true,
    }).start();

    // Pulse animation for paired bases
    if (base.paired) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      scaleAnim.stopAnimation();
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
    };
  }, [base.paired]);

  const opacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.dnaBase,
        {
          left: base.x - 4,
          top: base.y - 4,
          backgroundColor: base.color,
          opacity,
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) },
          ],
          shadowColor: base.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity,
          shadowRadius: 8,
          elevation: 6,
        },
      ]}
    >
      {showBases && (
        <Animated.Text style={[
          styles.baseLabel,
          { 
            color: '#fff',
            transform: [{ scale: 0.8 }]
          }
        ]}>
          {base.type}
        </Animated.Text>
      )}
    </Animated.View>
  );
});

/**
 * DNA Backbone Strand Component
 * Represents the sugar-phosphate backbone of DNA
 */
const DNABackbone = React.memo<{
  points: { x: number; y: number }[];
  color: string;
  strand: 1 | 2;
  rotationValue: Animated.Value;
}>(({ points, color, strand, rotationValue }) => {
  const pathAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(pathAnim, {
      toValue: 1,
      duration: 1000,
      delay: strand * 200,
      useNativeDriver: true,
    }).start();

    return () => {
      pathAnim.stopAnimation();
    };
  }, [strand]);

  return (
    <View style={styles.backboneContainer}>
      {points.map((point, index) => {
        if (index === points.length - 1) return null;
        
        const nextPoint = points[index + 1];
        const distance = Math.sqrt(
          Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
        );
        const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);

        return (
          <Animated.View
            key={`backbone-${strand}-${index}`}
            style={[
              styles.backboneSegment,
              {
                left: point.x,
                top: point.y - 1,
                width: distance,
                backgroundColor: color,
                opacity: pathAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.8],
                }),
                transform: [
                  { rotate: `${angle}rad` },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
});

/**
 * Base Pair Connection Component
 * Shows hydrogen bonds between complementary bases
 */
const BasePairConnection = React.memo<{
  base1: { x: number; y: number };
  base2: { x: number; y: number };
  color: string;
  delay: number;
}>(({ base1, base2, color, delay }) => {
  const connectionAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(connectionAnim, {
      toValue: 1,
      duration: 400,
      delay,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      connectionAnim.stopAnimation();
      pulseAnim.stopAnimation();
    };
  }, [delay]);

  const distance = Math.sqrt(
    Math.pow(base2.x - base1.x, 2) + Math.pow(base2.y - base1.y, 2)
  );
  const angle = Math.atan2(base2.y - base1.y, base2.x - base1.x);

  const scaleX = connectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.basePairConnection,
        {
          left: base1.x,
          top: base1.y - 0.5,
          width: distance,
          backgroundColor: color,
          opacity: connectionAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.6],
          }),
          transform: [
            { rotate: `${angle}rad` },
            { scaleX },
            { scaleY: pulseAnim },
          ],
        },
      ]}
    />
  );
});

/**
 * Main DNA Helix Animation Component
 * Creates a rotating double helix for personalization/AI generation
 */
const DNAHelixAnimation: React.FC<DNAHelixProps> = ({
  duration = 4000,
  onComplete,
  colors = ['#00F0FF', '#FF00FF', '#00FF88', '#FFD700'],
  size = 280,
  isVisible = true,
  helixHeight = 300,
  rotationSpeed = 3000,
  baseCount = 20,
  showBases = true,
  helixColors = {
    backbone: '#00F0FF',
    baseA: '#FF6B35',
    baseT: '#00FF88',
    baseG: '#FF00FF',
    baseC: '#FFD700',
  },
  style
}) => {
  const [animationPhase, setAnimationPhase] = useState<'building' | 'rotating' | 'completing'>('building');
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const helixAnim = useRef(new Animated.Value(0)).current;
  const hasCompleted = useRef(false);

  // Generate DNA helix structure
  const helixStructure = useMemo(() => {
    if (!isVisible) return { strand1: [], strand2: [], basePairs: [] };

    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2;
    const radius = size / 4;
    const heightStep = helixHeight / baseCount;
    
    const strand1: any[] = [];
    const strand2: any[] = [];
    const basePairs: any[] = [];
    
    // Base pair rules: A-T, G-C
    const basePairRules = {
      'A': 'T',
      'T': 'A',
      'G': 'C',
      'C': 'G'
    };
    
    const baseTypes = ['A', 'T', 'G', 'C'] as const;
    
    for (let i = 0; i < baseCount; i++) {
      const angle1 = (i / baseCount) * Math.PI * 4; // Two full rotations
      const angle2 = angle1 + Math.PI; // Opposite strand
      
      const y = centerY - (helixHeight / 2) + (i * heightStep);
      
      // Strand 1 (left helix)
      const x1 = centerX + Math.cos(angle1) * radius;
      const base1Type = baseTypes[Math.floor(Math.random() * baseTypes.length)];
      const base2Type = basePairRules[base1Type];
      
      // Strand 2 (right helix)
      const x2 = centerX + Math.cos(angle2) * radius;
      
      const base1 = {
        id: `base1-${i}`,
        x: x1,
        y,
        type: base1Type,
        strand: 1 as const,
        angle: angle1,
        color: helixColors[`base${base1Type}` as keyof typeof helixColors],
        delay: i * 50,
        paired: true,
      };
      
      const base2 = {
        id: `base2-${i}`,
        x: x2,
        y,
        type: base2Type,
        strand: 2 as const,
        angle: angle2,
        color: helixColors[`base${base2Type}` as keyof typeof helixColors],
        delay: i * 50 + 25,
        paired: true,
      };
      
      strand1.push(base1);
      strand2.push(base2);
      
      basePairs.push({
        base1: { x: x1, y },
        base2: { x: x2, y },
        color: colors[i % colors.length],
        delay: i * 50 + 100,
      });
    }
    
    return { strand1, strand2, basePairs };
  }, [isVisible, baseCount, helixHeight, size, helixColors, colors]);

  // Generate backbone points
  const backbonePoints = useMemo(() => {
    return {
      strand1: helixStructure.strand1.map(base => ({ x: base.x, y: base.y })),
      strand2: helixStructure.strand2.map(base => ({ x: base.x, y: base.y })),
    };
  }, [helixStructure]);

  useEffect(() => {
    if (!isVisible) return;

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync().catch(() => {});
    }

    // Animation sequence
    const animationSequence = Animated.sequence([
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Build helix
      Animated.timing(helixAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Rotate helix
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: rotationSpeed,
        useNativeDriver: true,
      }),
      // Hold for a moment
      Animated.delay(500),
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start(() => {
      if (!hasCompleted.current) {
        hasCompleted.current = true;
        setAnimationPhase('completing');
        onComplete?.();
      }
    });

    // Phase transitions
    const phaseTimer1 = setTimeout(() => setAnimationPhase('rotating'), 1300);
    const phaseTimer2 = setTimeout(() => setAnimationPhase('completing'), duration - 800);

    return () => {
      fadeAnim.stopAnimation();
      helixAnim.stopAnimation();
      rotationAnim.stopAnimation();
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
    };
  }, [isVisible, duration, rotationSpeed, onComplete]);

  if (!isVisible) return null;

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const helixScale = helixAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }, style]}>
      {/* Background gradient */}
      <View style={styles.backgroundGradient}>
        <View style={[
          styles.gradientCircle,
          {
            backgroundColor: helixColors.backbone + '20',
            left: '15%',
            top: '20%',
          }
        ]} />
        <View style={[
          styles.gradientCircle,
          {
            backgroundColor: colors[2] + '20',
            right: '15%',
            bottom: '20%',
          }
        ]} />
      </View>

      {/* DNA Helix Container */}
      <Animated.View
        style={[
          styles.helixContainer,
          {
            transform: [
              { scale: helixScale },
              { rotate: rotation },
            ],
          },
        ]}
      >
        {/* Backbone strands */}
        <DNABackbone
          points={backbonePoints.strand1}
          color={helixColors.backbone}
          strand={1}
          rotationValue={rotationAnim}
        />
        <DNABackbone
          points={backbonePoints.strand2}
          color={helixColors.backbone}
          strand={2}
          rotationValue={rotationAnim}
        />

        {/* Base pair connections */}
        {helixStructure.basePairs.map((pair, index) => (
          <BasePairConnection
            key={`pair-${index}`}
            base1={pair.base1}
            base2={pair.base2}
            color={pair.color}
            delay={pair.delay}
          />
        ))}

        {/* DNA bases */}
        {helixStructure.strand1.map((base) => (
          <DNABase
            key={base.id}
            base={base}
            rotationValue={rotationAnim}
            showBases={showBases}
          />
        ))}
        {helixStructure.strand2.map((base) => (
          <DNABase
            key={base.id}
            base={base}
            rotationValue={rotationAnim}
            showBases={showBases}
          />
        ))}
      </Animated.View>

      {/* Central glow effect */}
      <Animated.View
        style={[
          styles.centralGlow,
          {
            opacity: helixAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.3],
            }),
          },
        ]}
      />
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
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: SCREEN_WIDTH * 0.35,
    opacity: 0.2,
  },
  helixContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  backboneContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backboneSegment: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
  },
  dnaBase: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  baseLabel: {
    fontSize: 6,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  basePairConnection: {
    position: 'absolute',
    height: 1,
    borderRadius: 0.5,
  },
  centralGlow: {
    position: 'absolute',
    width: 100,
    height: 300,
    backgroundColor: '#00F0FF',
    borderRadius: 50,
    left: SCREEN_WIDTH / 2 - 50,
    top: SCREEN_HEIGHT / 2 - 150,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 10,
  },
});

export default DNAHelixAnimation;
