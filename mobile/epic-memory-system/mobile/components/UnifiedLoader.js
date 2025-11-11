import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Platform,
  InteractionManager,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import PixelCanvasSimple from './PixelCanvasSimple';
import FullScreenPixelCanvas from './FullScreenPixelCanvas';

/**
 * UnifiedLoader - Single, optimized loader for the entire app
 * Replaces all other loaders with minimal performance impact
 */
const UnifiedLoader = ({ 
  duration = 2000,
  onComplete,
  variant = 'minimal', // 'minimal' | 'logo' | 'dots' | 'pixels' | 'fullscreen'
  pixelConfig = {}, // Configuration for pixel variant
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [showPixels, setShowPixels] = useState(false);
  const hasCompleted = useRef(false);
  
  useEffect(() => {
    // Skip animations for fullscreen variant
    if (variant === 'fullscreen') return;
    
    let animationHandle;
    
    // Run after interactions to prevent blocking
    animationHandle = InteractionManager.runAfterInteractions(() => {
      // Single haptic feedback for non-fullscreen variants
      if (Platform.OS === 'ios' && variant !== 'fullscreen') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      
      // Simple fade and scale animation
      const animations = [];
      
      // Fade in/out
      animations.push(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(duration - 400),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      );
      
      // Scale pulse
      animations.push(
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 40,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.delay(duration - 600),
          Animated.spring(scaleAnim, {
            toValue: 0.8,
            tension: 40,
            friction: 6,
            useNativeDriver: true,
          }),
        ])
      );
      
      // Gentle rotation for dots variant
      if (variant === 'dots') {
        animations.push(
          Animated.loop(
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: true,
            }),
            { iterations: Math.ceil(duration / 3000) }
          )
        );
      }
      
      Animated.parallel(animations).start(() => {
        if (!hasCompleted.current) {
          hasCompleted.current = true;
          onComplete?.();
        }
      });
    });
    
    // Cleanup
    return () => {
      if (animationHandle) {
        InteractionManager.clearInteractionHandle(animationHandle);
      }
      fadeAnim.stopAnimation();
      scaleAnim.stopAnimation();
      rotateAnim.stopAnimation();
    };
  }, [duration, onComplete, variant]);
  
  // Handle pixel variant activation
  useEffect(() => {
    if (variant === 'pixels') {
      setShowPixels(true);
    }
  }, [variant]);
  
  const renderContent = () => {
    switch (variant) {
      case 'fullscreen':
        return (
          <FullScreenPixelCanvas
            colors={pixelConfig.backgroundColors || ['#0a0a0a', '#1a1a1a', '#2a2a2a', '#333333', '#3a3a3a']}
            logoColors={pixelConfig.logoColors || ['#00F0FF', '#FF00FF']}
            gap={pixelConfig.gap || 12}
            speed={pixelConfig.speed || 35}
            duration={duration}
            onComplete={onComplete}
            autoStart={true}
          />
        );
        
      case 'pixels':
        return (
          <View style={styles.pixelContainer}>
            <PixelCanvasSimple
              colors={pixelConfig.colors || ['#00F0FF', '#FF00FF', '#FFD700']}
              gap={pixelConfig.gap || 8}
              speed={pixelConfig.speed || 50}
              noFocus={pixelConfig.noFocus}
              style={{ width: 300, height: 200 }}
              onHoverStart={() => setShowPixels(true)}
            />
          </View>
        );
        
      case 'logo':
        return (
          <View style={styles.logoContainer}>
            <View style={styles.logoS}>
              <View style={[styles.bar, styles.barTop]} />
              <View style={[styles.bar, styles.barMiddle]} />
              <View style={[styles.bar, styles.barBottom]} />
            </View>
            <View style={styles.logoDot} />
            <View style={styles.logoD}>
              <View style={[styles.bar, styles.barLeft]} />
              <View style={[styles.bar, styles.barTop]} />
              <View style={[styles.bar, styles.barBottom]} />
              <View style={[styles.bar, styles.barRight]} />
            </View>
          </View>
        );
        
      case 'dots':
        return (
          <Animated.View 
            style={[
              styles.dotsContainer,
              {
                transform: [{
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                }],
              },
            ]}
          >
            {[0, 1, 2].map(i => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: ['#00F0FF', '#FF00FF', '#FFD700'][i],
                    transform: [
                      { translateX: 20 * Math.cos((i * 120) * Math.PI / 180) },
                      { translateY: 20 * Math.sin((i * 120) * Math.PI / 180) },
                    ],
                  },
                ]}
              />
            ))}
          </Animated.View>
        );
        
      default: // minimal
        return (
          <View style={styles.minimalContainer}>
            <View style={styles.minimalBar} />
          </View>
        );
    }
  };
  
  // For fullscreen variant, render directly without wrapper animations
  if (variant === 'fullscreen') {
    return renderContent();
  }
  
  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {renderContent()}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Logo variant styles
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoS: {
    width: 40,
    height: 50,
    position: 'relative',
  },
  logoD: {
    width: 40,
    height: 50,
    position: 'relative',
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
  },
  bar: {
    position: 'absolute',
    backgroundColor: '#00F0FF',
    borderRadius: 2,
  },
  barTop: {
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  barMiddle: {
    top: 23,
    left: 0,
    right: 0,
    height: 4,
  },
  barBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  barLeft: {
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  barRight: {
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  
  // Dots variant styles
  dotsContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  
  // Minimal variant styles
  minimalContainer: {
    width: 60,
    height: 4,
  },
  minimalBar: {
    flex: 1,
    backgroundColor: '#00F0FF',
    borderRadius: 2,
  },
  
  // Pixel canvas styles
  pixelContainer: {
    width: 300,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 10,
  },
});

export default UnifiedLoader;