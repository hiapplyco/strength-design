import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  PanResponder,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { Canvas, useCanvasRef, Circle, Group } from '@shopify/react-native-skia';

/**
 * PixelCanvas - High-performance canvas-based pixel shimmer effect
 * Implements the pixel-canvas web component pattern for React Native
 */
const PixelCanvas = ({
  colors = ['#e0e0e0', '#d0d0d0', '#c0c0c0'], // Default light gray shades
  gap = 5, // Pixel spacing (4-50)
  speed = 35, // Animation speed (0-100)
  noFocus = false, // Disable focus triggering
  style,
  onHoverStart,
  onHoverEnd,
  testID,
}) => {
  const canvasRef = useCanvasRef();
  const [isHovered, setIsHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const animationRef = useRef(null);
  const pixelsRef = useRef([]);
  const timeRef = useRef(0);
  
  // Clamp values
  const clampedGap = Math.min(Math.max(gap, 4), 50);
  const clampedSpeed = Math.min(Math.max(speed, 0), 100);
  
  // Get screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const containerWidth = style?.width || screenWidth;
  const containerHeight = style?.height || screenHeight;
  
  // Check for reduced motion preference
  useEffect(() => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    }
  }, []);
  
  // Calculate pixel grid
  const pixels = useMemo(() => {
    const pixelSize = 2;
    const totalGap = clampedGap + pixelSize;
    const cols = Math.floor(containerWidth / totalGap);
    const rows = Math.floor(containerHeight / totalGap);
    const pixelArray = [];
    
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        pixelArray.push({
          id: `${x}-${y}`,
          x: x * totalGap + pixelSize / 2,
          y: y * totalGap + pixelSize / 2,
          baseRadius: pixelSize / 2,
          maxRadius: pixelSize,
          color,
          phase: Math.random() * Math.PI * 2, // Random phase for organic movement
          frequency: 0.5 + Math.random() * 0.5, // Vary frequency
        });
      }
    }
    
    return pixelArray;
  }, [containerWidth, containerHeight, clampedGap, colors]);
  
  // Store pixels ref for animation
  useEffect(() => {
    pixelsRef.current = pixels;
  }, [pixels]);
  
  // Animation loop
  useEffect(() => {
    if (!isHovered || reducedMotion || clampedSpeed === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }
    
    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      // Update time
      timeRef.current += (clampedSpeed / 1000);
      
      // Clear canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, containerWidth, containerHeight);
        
        // Draw pixels with shimmer effect
        pixelsRef.current.forEach(pixel => {
          const shimmerScale = Math.sin(timeRef.current * pixel.frequency + pixel.phase) * 0.5 + 0.5;
          const radius = pixel.baseRadius + (pixel.maxRadius - pixel.baseRadius) * shimmerScale;
          const opacity = 0.3 + shimmerScale * 0.7;
          
          ctx.beginPath();
          ctx.arc(pixel.x, pixel.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = pixel.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
          ctx.fill();
        });
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovered, reducedMotion, clampedSpeed, containerWidth, containerHeight]);
  
  // Pan responder for hover simulation
  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsHovered(true);
        onHoverStart?.();
      },
      onPanResponderRelease: () => {
        setIsHovered(false);
        onHoverEnd?.();
      },
      onPanResponderTerminate: () => {
        setIsHovered(false);
        onHoverEnd?.();
      },
    }),
    [onHoverStart, onHoverEnd]
  );
  
  // Focus handling
  const handleFocus = () => {
    if (!noFocus) {
      setIsHovered(true);
      onHoverStart?.();
    }
  };
  
  const handleBlur = () => {
    if (!noFocus) {
      setIsHovered(false);
      onHoverEnd?.();
    }
  };
  
  // Render using Skia Canvas for optimal performance
  if (Platform.OS === 'web') {
    // Web canvas implementation
    return (
      <View
        style={[styles.container, style]}
        onMouseEnter={() => {
          setIsHovered(true);
          onHoverStart?.();
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          onHoverEnd?.();
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        testID={testID}
      >
        <canvas
          ref={canvasRef}
          width={containerWidth}
          height={containerHeight}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    );
  }
  
  // Native Skia canvas implementation
  return (
    <View
      style={[styles.container, style]}
      {...panResponder.panHandlers}
      onFocus={handleFocus}
      onBlur={handleBlur}
      testID={testID}
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          {pixels.map(pixel => {
            const shimmerScale = isHovered && !reducedMotion && clampedSpeed > 0
              ? Math.sin(timeRef.current * pixel.frequency + pixel.phase) * 0.5 + 0.5
              : 0;
            const radius = pixel.baseRadius + (pixel.maxRadius - pixel.baseRadius) * shimmerScale;
            
            return (
              <Circle
                key={pixel.id}
                cx={pixel.x}
                cy={pixel.y}
                r={radius}
                color={pixel.color}
                opacity={0.3 + shimmerScale * 0.7}
              />
            );
          })}
        </Group>
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});

export default PixelCanvas;