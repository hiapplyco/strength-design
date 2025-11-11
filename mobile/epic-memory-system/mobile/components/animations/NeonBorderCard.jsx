import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NeonBorderCard = ({ 
  children, 
  colors = ['#00D4FF', '#00FF88', '#FF00FF'],
  borderWidth = 2,
  borderRadius = 16,
  glowIntensity = 20,
  animationDuration = 3000,
  style,
  onPress
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Continuous rotation animation for border gradient
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: animationDuration,
        useNativeDriver: true,
      })
    ).start();

    // Subtle pulse effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animationDuration]);

  const rotation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        style,
        {
          transform: [{ scale: pulseAnim }]
        }
      ]}
    >
      {/* Animated border gradient container */}
      <View style={[styles.borderContainer, { borderRadius }]}>
        {/* Rotating gradient mask */}
        <Animated.View
          style={[
            styles.gradientWrapper,
            {
              transform: [{ rotate: rotation }]
            }
          ]}
        >
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.gradient,
              {
                borderRadius,
                padding: borderWidth,
              }
            ]}
          >
            {/* Inner mask to create border effect */}
            <View 
              style={[
                styles.innerMask,
                {
                  borderRadius: borderRadius - borderWidth,
                  backgroundColor: '#000',
                }
              ]}
            />
          </LinearGradient>
        </Animated.View>

        {/* Glow effect layers */}
        {[...Array(3)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.glowLayer,
              {
                borderRadius,
                borderWidth: borderWidth + (index * 2),
                borderColor: colors[0],
                opacity: (0.3 - (index * 0.1)),
                transform: [
                  { 
                    scale: animatedValue.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.05, 1]
                    })
                  }
                ]
              }
            ]}
          />
        ))}
      </View>
      
      {/* Card content */}
      <View style={[
        styles.cardContent,
        {
          borderRadius: borderRadius - borderWidth,
          margin: borderWidth,
        }
      ]}>
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 10,
    marginHorizontal: 16,
  },
  borderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gradientWrapper: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    width: '150%',
    height: '150%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerMask: {
    width: '100%',
    height: '100%',
  },
  glowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 20,
    overflow: 'hidden',
  },
});

export default NeonBorderCard;