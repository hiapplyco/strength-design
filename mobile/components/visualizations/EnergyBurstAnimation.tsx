import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { EnergyBurstProps } from './VisualizationTypes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Energy Particle Component
 * Individual particle with physics-based movement
 */
const EnergyParticle = React.memo<{
  particle: {
    id: string;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    color: string;
    size: number;
    delay: number;
    speed: number;
    trail: boolean;
    intensity: number;
  };
  burstType: 'radial' | 'lightning' | 'plasma' | 'atomic';
}>(({ particle, burstType }) => {
  const positionAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Particle birth animation
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 200,
      delay: particle.delay,
      useNativeDriver: true,
    }).start();

    // Movement animation based on burst type
    let movementDuration = particle.speed;
    let easingType = 'linear';
    
    switch (burstType) {
      case 'lightning':
        movementDuration *= 0.3; // Very fast
        break;
      case 'plasma':
        movementDuration *= 0.7; // Medium fast
        break;
      case 'atomic':
        movementDuration *= 1.2; // Slower, more controlled
        break;
      default: // radial
        movementDuration *= 1;
    }

    const movementSequence = Animated.sequence([
      Animated.delay(particle.delay),
      Animated.parallel([
        Animated.timing(positionAnim, {
          toValue: 1,
          duration: movementDuration,
          useNativeDriver: true,
        }),
        // Fade out over time
        Animated.sequence([
          Animated.delay(movementDuration * 0.5),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: movementDuration * 0.5,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    movementSequence.start();

    // Rotation for plasma and atomic types
    if (burstType === 'plasma' || burstType === 'atomic') {
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 2000 / particle.intensity,
          useNativeDriver: true,
        })
      ).start();
    }

    return () => {
      positionAnim.stopAnimation();
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
      rotationAnim.stopAnimation();
    };
  }, [burstType, particle]);

  const translateX = positionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, particle.targetX - particle.startX],
  });

  const translateY = positionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, particle.targetY - particle.startY],
  });

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Dynamic scaling based on burst type
  const dynamicScale = useMemo(() => {
    switch (burstType) {
      case 'lightning':
        return positionAnim.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [1, 1.5, 0.2],
        });
      case 'plasma':
        return positionAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.5, 2, 0.8],
        });
      case 'atomic':
        return positionAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2],
        });
      default: // radial
        return positionAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.3, 0.5],
        });
    }
  }, [burstType, positionAnim]);

  return (
    <Animated.View
      style={[
        styles.energyParticle,
        {
          left: particle.startX,
          top: particle.startY,
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          opacity: opacityAnim,
          transform: [
            { translateX },
            { translateY },
            { scale: Animated.multiply(scaleAnim, dynamicScale) },
            { rotate: rotation },
          ],
          shadowColor: particle.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: particle.intensity,
          shadowRadius: particle.size * particle.intensity,
          elevation: Math.floor(particle.intensity * 10),
        },
      ]}
    >
      {/* Trail effect for lightning */}
      {particle.trail && burstType === 'lightning' && (
        <Animated.View
          style={[
            styles.particleTrail,
            {
              backgroundColor: particle.color,
              opacity: opacityAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.3],
              }),
            },
          ]}
        />
      )}
    </Animated.View>
  );
});

/**
 * Shockwave Component
 * Creates expanding shockwave rings
 */
const Shockwave = React.memo<{
  centerX: number;
  centerY: number;
  maxRadius: number;
  color: string;
  delay: number;
  intensity: 'low' | 'medium' | 'high' | 'extreme';
}>(({ centerX, centerY, maxRadius, color, delay, intensity }) => {
  const waveAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const intensityMultiplier = useMemo(() => {
    switch (intensity) {
      case 'extreme': return 2;
      case 'high': return 1.5;
      case 'medium': return 1;
      case 'low': return 0.7;
      default: return 1;
    }
  }, [intensity]);

  useEffect(() => {
    const waveSequence = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1500 * intensityMultiplier,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.8 * intensityMultiplier,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 1300 * intensityMultiplier,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    waveSequence.start();

    return () => {
      waveAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, [delay, intensityMultiplier]);

  const scale = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxRadius / 50],
  });

  return (
    <Animated.View
      style={[
        styles.shockwave,
        {
          left: centerX - 50,
          top: centerY - 50,
          borderColor: color,
          opacity: opacityAnim,
          transform: [{ scale }],
          borderWidth: 3 * intensityMultiplier,
        },
      ]}
    />
  );
});

/**
 * Lightning Branch Component
 * Creates fractal lightning patterns
 */
const LightningBranch = React.memo<{
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  thickness: number;
  delay: number;
  branches?: { x: number; y: number }[];
}>(({ startX, startY, endX, endY, color, thickness, delay, branches = [] }) => {
  const pathAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(pathAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    return () => {
      pathAnim.stopAnimation();
      glowAnim.stopAnimation();
    };
  }, [delay]);

  const distance = Math.sqrt(
    Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
  );
  const angle = Math.atan2(endY - startY, endX - startX);

  const scaleX = pathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View>
      {/* Main lightning bolt */}
      <Animated.View
        style={[
          styles.lightningBolt,
          {
            left: startX,
            top: startY - thickness / 2,
            width: distance,
            height: thickness,
            backgroundColor: color,
            opacity: pathAnim,
            transform: [
              { rotate: `${angle}rad` },
              { scaleX },
            ],
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: glowAnim,
            shadowRadius: thickness * 2,
            elevation: 8,
          },
        ]}
      />
      
      {/* Branch lightning */}
      {branches.map((branch, index) => {
        const branchDistance = Math.sqrt(
          Math.pow(branch.x - startX, 2) + Math.pow(branch.y - startY, 2)
        ) * 0.6;
        const branchAngle = Math.atan2(branch.y - startY, branch.x - startX);
        
        return (
          <Animated.View
            key={`branch-${index}`}
            style={[
              styles.lightningBolt,
              {
                left: startX,
                top: startY - thickness / 4,
                width: branchDistance,
                height: thickness / 2,
                backgroundColor: color,
                opacity: pathAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0, 0.7],
                }),
                transform: [
                  { rotate: `${branchAngle}rad` },
                  { scaleX: pathAnim },
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
 * Main Energy Burst Animation Component
 * Creates dynamic energy burst effects for achievements
 */
const EnergyBurstAnimation: React.FC<EnergyBurstProps> = ({
  duration = 2500,
  onComplete,
  colors = ['#FFD700', '#FF6B35', '#00F0FF', '#FF00FF'],
  size = 300,
  isVisible = true,
  burstType = 'radial',
  particleCount = 50,
  burstRadius = 150,
  intensity = 'high',
  style
}) => {
  const [animationPhase, setAnimationPhase] = useState<'charging' | 'bursting' | 'dissipating'>('charging');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const chargeAnim = useRef(new Animated.Value(0)).current;
  const hasCompleted = useRef(false);

  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;

  // Intensity settings
  const intensitySettings = useMemo(() => {
    switch (intensity) {
      case 'extreme':
        return { multiplier: 2, haptic: Haptics.ImpactFeedbackStyle.Heavy, particles: particleCount * 2 };
      case 'high':
        return { multiplier: 1.5, haptic: Haptics.ImpactFeedbackStyle.Heavy, particles: particleCount * 1.5 };
      case 'medium':
        return { multiplier: 1, haptic: Haptics.ImpactFeedbackStyle.Medium, particles: particleCount };
      case 'low':
        return { multiplier: 0.7, haptic: Haptics.ImpactFeedbackStyle.Light, particles: particleCount * 0.7 };
      default:
        return { multiplier: 1, haptic: Haptics.ImpactFeedbackStyle.Medium, particles: particleCount };
    }
  }, [intensity, particleCount]);

  // Generate particles based on burst type
  const particles = useMemo(() => {
    if (!isVisible) return [];

    const particleArray = [];
    const actualParticleCount = Math.floor(intensitySettings.particles);
    
    for (let i = 0; i < actualParticleCount; i++) {
      let targetX, targetY;
      let speed = 1000 + Math.random() * 500;
      let particleSize = 4 + Math.random() * 6;
      let trail = false;
      
      switch (burstType) {
        case 'lightning':
          // Lightning follows jagged paths
          const lightningAngle = (Math.random() - 0.5) * Math.PI * 2;
          const lightningDistance = burstRadius * (0.8 + Math.random() * 0.4);
          targetX = centerX + Math.cos(lightningAngle) * lightningDistance + (Math.random() - 0.5) * 100;
          targetY = centerY + Math.sin(lightningAngle) * lightningDistance + (Math.random() - 0.5) * 100;
          speed *= 0.3; // Very fast
          trail = true;
          break;
          
        case 'plasma':
          // Plasma follows curved organic paths
          const plasmaAngle = (i / actualParticleCount) * Math.PI * 2;
          const plasmaDistance = burstRadius * (0.6 + Math.random() * 0.8);
          const plasmaOffset = Math.sin(plasmaAngle * 3) * 50;
          targetX = centerX + Math.cos(plasmaAngle) * plasmaDistance + plasmaOffset;
          targetY = centerY + Math.sin(plasmaAngle) * plasmaDistance + Math.cos(plasmaAngle * 2) * 30;
          speed *= 0.7;
          particleSize *= 1.5;
          break;
          
        case 'atomic':
          // Atomic follows orbital patterns
          const orbitalRadius = burstRadius * (0.3 + Math.random() * 0.7);
          const orbitalAngle = (i / actualParticleCount) * Math.PI * 4; // Multiple orbits
          const orbitalLayer = Math.floor(i / (actualParticleCount / 3));
          targetX = centerX + Math.cos(orbitalAngle) * (orbitalRadius + orbitalLayer * 30);
          targetY = centerY + Math.sin(orbitalAngle) * (orbitalRadius + orbitalLayer * 30);
          speed *= 1.2;
          particleSize *= 0.8;
          break;
          
        default: // radial
          // Perfect radial explosion
          const radialAngle = (i / actualParticleCount) * Math.PI * 2;
          const radialDistance = burstRadius * (0.8 + Math.random() * 0.4);
          targetX = centerX + Math.cos(radialAngle) * radialDistance;
          targetY = centerY + Math.sin(radialAngle) * radialDistance;
      }
      
      particleArray.push({
        id: `particle-${i}`,
        startX: centerX,
        startY: centerY,
        targetX,
        targetY,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: particleSize * intensitySettings.multiplier,
        delay: Math.random() * 200,
        speed,
        trail,
        intensity: intensitySettings.multiplier,
      });
    }
    
    return particleArray;
  }, [isVisible, burstType, burstRadius, colors, intensitySettings, centerX, centerY]);

  // Generate lightning bolts for lightning type
  const lightningBolts = useMemo(() => {
    if (!isVisible || burstType !== 'lightning') return [];
    
    const bolts = [];
    const boltCount = Math.floor(intensitySettings.particles / 10);
    
    for (let i = 0; i < boltCount; i++) {
      const angle = (i / boltCount) * Math.PI * 2;
      const distance = burstRadius * (0.7 + Math.random() * 0.5);
      const endX = centerX + Math.cos(angle) * distance;
      const endY = centerY + Math.sin(angle) * distance;
      
      // Generate branch points
      const branches = [];
      const branchCount = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < branchCount; j++) {
        const branchAngle = angle + (Math.random() - 0.5) * Math.PI / 3;
        const branchDistance = distance * (0.3 + Math.random() * 0.4);
        branches.push({
          x: centerX + Math.cos(branchAngle) * branchDistance,
          y: centerY + Math.sin(branchAngle) * branchDistance,
        });
      }
      
      bolts.push({
        id: `bolt-${i}`,
        startX: centerX,
        startY: centerY,
        endX,
        endY,
        color: colors[Math.floor(Math.random() * colors.length)],
        thickness: 2 + Math.random() * 3,
        delay: i * 50,
        branches,
      });
    }
    
    return bolts;
  }, [isVisible, burstType, burstRadius, colors, intensitySettings, centerX, centerY]);

  useEffect(() => {
    if (!isVisible) return;

    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(intensitySettings.haptic).catch(() => {});
    }

    // Animation sequence
    const animationSequence = Animated.sequence([
      // Fade in + charge
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(chargeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Hold for burst
      Animated.delay(duration - 800),
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start(() => {
      if (!hasCompleted.current) {
        hasCompleted.current = true;
        setAnimationPhase('dissipating');
        onComplete?.();
      }
    });

    // Phase transitions
    const phaseTimer1 = setTimeout(() => setAnimationPhase('bursting'), 400);
    const phaseTimer2 = setTimeout(() => setAnimationPhase('dissipating'), duration - 400);

    return () => {
      fadeAnim.stopAnimation();
      chargeAnim.stopAnimation();
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
    };
  }, [isVisible, duration, intensitySettings.haptic, onComplete]);

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }, style]}>
      {/* Background gradient */}
      <View style={styles.backgroundGradient}>
        <View style={[
          styles.gradientCircle,
          {
            backgroundColor: colors[0] + '20',
            left: '10%',
            top: '20%',
          }
        ]} />
        <View style={[
          styles.gradientCircle,
          {
            backgroundColor: colors[1] + '20',
            right: '10%',
            bottom: '20%',
          }
        ]} />
      </View>

      {/* Central charge effect */}
      <Animated.View
        style={[
          styles.centralCharge,
          {
            left: centerX - 25,
            top: centerY - 25,
            backgroundColor: colors[0],
            transform: [
              {
                scale: chargeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, intensitySettings.multiplier],
                }),
              },
            ],
            shadowColor: colors[0],
            shadowOpacity: chargeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.8],
            }),
          },
        ]}
      />

      {/* Shockwaves */}
      {animationPhase === 'bursting' && (
        <>
          <Shockwave
            centerX={centerX}
            centerY={centerY}
            maxRadius={burstRadius * 0.8}
            color={colors[0]}
            delay={0}
            intensity={intensity}
          />
          <Shockwave
            centerX={centerX}
            centerY={centerY}
            maxRadius={burstRadius * 1.2}
            color={colors[1]}
            delay={200}
            intensity={intensity}
          />
          {intensity === 'extreme' && (
            <Shockwave
              centerX={centerX}
              centerY={centerY}
              maxRadius={burstRadius * 1.6}
              color={colors[2]}
              delay={400}
              intensity={intensity}
            />
          )}
        </>
      )}

      {/* Lightning bolts */}
      {burstType === 'lightning' && lightningBolts.map((bolt) => (
        <LightningBranch
          key={bolt.id}
          startX={bolt.startX}
          startY={bolt.startY}
          endX={bolt.endX}
          endY={bolt.endY}
          color={bolt.color}
          thickness={bolt.thickness}
          delay={bolt.delay}
          branches={bolt.branches}
        />
      ))}

      {/* Energy particles */}
      {particles.map((particle) => (
        <EnergyParticle
          key={particle.id}
          particle={particle}
          burstType={burstType}
        />
      ))}
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
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
    opacity: 0.3,
  },
  centralCharge: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 25,
    elevation: 10,
  },
  shockwave: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'transparent',
  },
  energyParticle: {
    position: 'absolute',
    borderRadius: 50,
  },
  particleTrail: {
    position: 'absolute',
    top: '50%',
    left: -10,
    width: 20,
    height: 2,
    borderRadius: 1,
  },
  lightningBolt: {
    position: 'absolute',
    borderRadius: 1,
  },
});

export default EnergyBurstAnimation;
