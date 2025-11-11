import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * FullScreenPixelCanvas - Full-screen pixel animation with S.D. logo
 * Optimized to prevent stack overflow with limited pixel count
 */
const FullScreenPixelCanvas = ({
  colors = ['#0a0a0a', '#1a1a1a', '#2a2a2a', '#333333', '#3a3a3a'], // Rich texture gradient
  logoColors = ['#00F0FF', '#FF00FF'], // S.D. logo colors
  gap = 12, // Increased gap for fewer pixels
  speed = 35,
  duration = 2500,
  onComplete,
  autoStart = true,
}) => {
  const [pixels, setPixels] = useState([]);
  const animationRefs = useRef({});
  const hasInitialized = useRef(false);
  const completionTimeout = useRef(null);
  
  // Initialize pixels only once
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    const pixelSize = 6;
    const totalGap = gap;
    
    // Calculate grid with limits
    const maxCols = 40; // Limit columns
    const maxRows = 80; // Limit rows
    const cols = Math.min(Math.floor(SCREEN_WIDTH / totalGap), maxCols);
    const rows = Math.min(Math.floor(SCREEN_HEIGHT / totalGap), maxRows);
    
    const centerX = Math.floor(cols / 2);
    const centerY = Math.floor(rows / 2);
    
    // S.D. logo shape check
    const isSDLogo = (col, row) => {
      const x = col - centerX;
      const y = row - centerY;
      
      // Simplified S shape
      if (x >= -10 && x <= -4) {
        if (y >= -4 && y <= -2) return 'S'; // Top
        if (y >= -1 && y <= 1) return 'S'; // Middle
        if (y >= 3 && y <= 5) return 'S'; // Bottom
        if (x >= -10 && x <= -8 && y >= -2 && y <= -1) return 'S'; // Top connector
        if (x >= -6 && x <= -4 && y >= 1 && y <= 3) return 'S'; // Bottom connector
      }
      
      // Period
      if (x >= -2 && x <= 0 && y >= 3 && y <= 5) return 'dot';
      
      // Simplified D shape
      if (x >= 2 && x <= 8) {
        if (x >= 2 && x <= 3 && y >= -4 && y <= 5) return 'D'; // Left bar
        if (x >= 7 && x <= 8 && y >= -4 && y <= 5) return 'D'; // Right bar
        if (y >= -4 && y <= -2 && x >= 2 && x <= 8) return 'D'; // Top
        if (y >= 3 && y <= 5 && x >= 2 && x <= 8) return 'D'; // Bottom
      }
      
      return null;
    };
    
    const pixelArray = [];
    const maxPixels = 800; // Hard limit on pixel count
    let pixelCount = 0;
    
    // Create pixel grid with sampling
    for (let col = 0; col < cols; col += 1) {
      for (let row = 0; row < rows; row += 1) {
        if (pixelCount >= maxPixels) break;
        
        // Sample every nth pixel based on distance from center
        const dx = col - centerX;
        const dy = row - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
        const normalizedDistance = distance / maxDistance;
        
        // Skip some pixels far from center for performance
        if (normalizedDistance > 0.7 && pixelCount % 2 !== 0) continue;
        
        const logoType = isSDLogo(col, row);
        const isLogo = logoType !== null;
        
        let color;
        if (isLogo) {
          if (logoType === 'S') {
            color = logoColors[0] || '#00F0FF';
          } else if (logoType === 'dot') {
            color = '#FFD700';
          } else {
            color = logoColors[1] || '#FF00FF';
          }
        } else {
          const colorIndex = Math.floor(normalizedDistance * colors.length) % colors.length;
          color = colors[colorIndex];
        }
        
        const pixelId = `p${col}_${row}`;
        const animValue = new Animated.Value(0);
        animationRefs.current[pixelId] = animValue;
        
        pixelArray.push({
          id: pixelId,
          x: col * totalGap,
          y: row * totalGap,
          size: pixelSize,
          maxSize: isLogo ? pixelSize * 2.5 : pixelSize * 1.8,
          color,
          isLogo,
          animValue,
          delay: Math.min(normalizedDistance * 400, 800), // Cap delay
        });
        
        pixelCount++;
      }
      if (pixelCount >= maxPixels) break;
    }
    
    setPixels(pixelArray);
  }, []); // Empty deps - run once
  
  // Start animations when pixels are ready
  useEffect(() => {
    if (!autoStart || pixels.length === 0) return;
    
    // Start animations with delay
    const startTimeout = setTimeout(() => {
      pixels.forEach((pixel) => {
        // Simple fade in animation
        Animated.timing(pixel.animValue, {
          toValue: 1,
          duration: 600,
          delay: pixel.delay,
          useNativeDriver: true,
        }).start(() => {
          // Add gentle pulse for logo pixels only
          if (pixel.isLogo) {
            Animated.loop(
              Animated.sequence([
                Animated.timing(pixel.animValue, {
                  toValue: 1.1,
                  duration: 2000,
                  useNativeDriver: true,
                }),
                Animated.timing(pixel.animValue, {
                  toValue: 1,
                  duration: 2000,
                  useNativeDriver: true,
                }),
              ])
            ).start();
          }
        });
      });
      
      // Schedule disappear
      if (duration && onComplete) {
        completionTimeout.current = setTimeout(() => {
          // Fade out all pixels
          pixels.forEach((pixel) => {
            Animated.timing(pixel.animValue, {
              toValue: 0,
              duration: 300,
              delay: pixel.delay * 0.3,
              useNativeDriver: true,
            }).start();
          });
          
          // Call completion after fade out
          setTimeout(onComplete, 500);
        }, duration);
      }
    }, 100);
    
    // Cleanup
    return () => {
      clearTimeout(startTimeout);
      if (completionTimeout.current) {
        clearTimeout(completionTimeout.current);
      }
      // Stop all animations
      Object.values(animationRefs.current).forEach(anim => {
        if (anim && anim.stopAnimation) {
          anim.stopAnimation();
        }
      });
    };
  }, [pixels.length, autoStart, duration, onComplete]);
  
  // Don't render until pixels are ready
  if (pixels.length === 0) {
    return <View style={styles.container} />;
  }
  
  return (
    <View style={styles.container}>
      {/* Background layer */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0a0a0a' }]} />
      
      {/* Render pixels in chunks to prevent overflow */}
      {pixels.map(pixel => (
        <Animated.View
          key={pixel.id}
          style={[
            styles.pixel,
            {
              position: 'absolute',
              left: pixel.x,
              top: pixel.y,
              width: pixel.maxSize,
              height: pixel.maxSize,
              backgroundColor: pixel.color,
              opacity: pixel.animValue.interpolate({
                inputRange: [0, 1, 1.1],
                outputRange: [0, pixel.isLogo ? 0.95 : 0.5, pixel.isLogo ? 1 : 0.6],
              }),
              transform: [
                {
                  scale: pixel.animValue.interpolate({
                    inputRange: [0, 1, 1.1],
                    outputRange: [0, 1, pixel.isLogo ? 1.1 : 1.05],
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
    backgroundColor: '#0a0a0a',
    zIndex: 9999,
  },
  pixel: {
    borderRadius: 1,
  },
});

export default FullScreenPixelCanvas;