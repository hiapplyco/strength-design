/**
 * Pose Landmark Renderer Component
 * High-performance pose landmark visualization overlay for video analysis
 * 
 * Features:
 * - Real-time pose landmark rendering with skeleton connections
 * - Exercise-specific landmark highlighting and error visualization
 * - Performance optimized for 60fps smooth animation
 * - Confidence-based landmark opacity and styling
 * - Form feedback integration with color-coded visual cues
 * - Responsive scaling for different video dimensions
 * - Memory-efficient Canvas-based rendering
 * - Accessibility features for landmark identification
 */

import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  Text,
} from 'react-native';
import { Svg, Circle, Line, Path, G, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import {
  POSE_LANDMARKS,
  POSE_CONNECTIONS,
  EXERCISE_CRITICAL_LANDMARKS,
  LANDMARK_GROUPS,
  POSE_COLORS,
} from '../../services/poseDetection/constants';
import { 
  processLandmarksEfficiently, 
  transformCoordinates,
  memoryManager 
} from './PerformanceOptimizations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Landmark rendering configuration
const LANDMARK_CONFIG = {
  DEFAULT_SIZE: 4,
  CRITICAL_SIZE: 6,
  ERROR_SIZE: 8,
  MIN_CONFIDENCE: 0.5,
  CONNECTION_WIDTH: 2,
  ERROR_CONNECTION_WIDTH: 3,
};

// Animation and interaction constants
const ANIMATION_DURATION = 100; // ms for smooth transitions
const PULSE_FREQUENCY = 1000; // ms for error highlighting

const PoseLandmarkRenderer = memo(function PoseLandmarkRenderer({
  poseData,
  videoDimensions,
  containerDimensions,
  exerciseType,
  analysisResult,
  showLandmarkLabels = false,
  highlightCriticalPoints = true,
  showFormErrors = true,
  confidenceThreshold = 0.5,
  style,
}) {
  const { theme, isDarkMode } = useTheme();
  
  // Animation state
  const [pulsePhase, setPulsePhase] = useState(0);
  const animationRef = useRef(null);
  
  // Calculate scaling factors for coordinate transformation
  const scalingFactors = useMemo(() => {
    if (!videoDimensions || !containerDimensions) {
      return { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };
    }

    const videoAspectRatio = videoDimensions.width / videoDimensions.height;
    const containerAspectRatio = containerDimensions.width / containerDimensions.height;
    
    let scaleX, scaleY, offsetX = 0, offsetY = 0;
    
    if (videoAspectRatio > containerAspectRatio) {
      // Video is wider - fit to container width
      scaleX = containerDimensions.width / videoDimensions.width;
      scaleY = scaleX;
      offsetY = (containerDimensions.height - (videoDimensions.height * scaleY)) / 2;
    } else {
      // Video is taller - fit to container height
      scaleY = containerDimensions.height / videoDimensions.height;
      scaleX = scaleY;
      offsetX = (containerDimensions.width - (videoDimensions.width * scaleX)) / 2;
    }
    
    return { scaleX, scaleY, offsetX, offsetY };
  }, [videoDimensions, containerDimensions]);

  // Transform landmark coordinates from normalized to screen coordinates
  const transformLandmark = useMemo(() => {
    return (landmark, index) => {
      if (!landmark || landmark.inFrameLikelihood < confidenceThreshold) {
        return null;
      }

      const { scaleX, scaleY, offsetX, offsetY } = scalingFactors;
      
      return {
        ...landmark,
        screenX: (landmark.x * videoDimensions.width * scaleX) + offsetX,
        screenY: (landmark.y * videoDimensions.height * scaleY) + offsetY,
        index,
      };
    };
  }, [scalingFactors, videoDimensions, confidenceThreshold]);

  // Get transformed landmarks with performance optimization
  const transformedLandmarks = useMemo(() => {
    if (!poseData?.landmarks) return [];
    
    // Use cached processing for better performance
    const cacheKey = `landmarks-${poseData.timestamp}-${confidenceThreshold}`;
    const cached = memoryManager.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const processed = processLandmarksEfficiently(poseData.landmarks, confidenceThreshold);
    const transformed = transformCoordinates(
      processed,
      scalingFactors.scaleX,
      scalingFactors.scaleY,
      scalingFactors.offsetX,
      scalingFactors.offsetY,
      videoDimensions.width,
      videoDimensions.height
    );
    
    memoryManager.set(cacheKey, transformed, 1000); // Cache for 1 second
    return transformed;
  }, [poseData, scalingFactors, videoDimensions, confidenceThreshold]);

  // Get critical landmarks for the current exercise
  const criticalLandmarkIndices = useMemo(() => {
    const exerciseKey = exerciseType?.toUpperCase().replace(' ', '_');
    return EXERCISE_CRITICAL_LANDMARKS[exerciseKey] || [];
  }, [exerciseType]);

  // Get form errors that affect landmarks
  const landmarkErrors = useMemo(() => {
    if (!analysisResult?.analysis?.criticalErrors || !showFormErrors) return [];
    
    return analysisResult.analysis.criticalErrors.filter(error => 
      error.affectedLandmarks && error.affectedLandmarks.length > 0
    );
  }, [analysisResult, showFormErrors]);

  // Determine landmark styling based on state
  const getLandmarkStyle = (landmark, isError = false, isCritical = false) => {
    const baseOpacity = Math.max(0.4, landmark.inFrameLikelihood);
    
    if (isError) {
      return {
        fill: POSE_COLORS.ANALYSIS_FEEDBACK.CRITICAL,
        size: LANDMARK_CONFIG.ERROR_SIZE,
        opacity: Math.min(1, baseOpacity + 0.3),
        pulse: true,
      };
    }
    
    if (isCritical && highlightCriticalPoints) {
      return {
        fill: POSE_COLORS.ANALYSIS_FEEDBACK.GOOD,
        size: LANDMARK_CONFIG.CRITICAL_SIZE,
        opacity: Math.min(1, baseOpacity + 0.2),
        pulse: false,
      };
    }
    
    // Default styling based on landmark group
    const group = Object.entries(LANDMARK_GROUPS).find(([key, indices]) =>
      indices.includes(landmark.index)
    );
    
    const groupColor = group ? POSE_COLORS.LANDMARKS[group[0]] : POSE_COLORS.LANDMARKS.UPPER_BODY;
    
    return {
      fill: groupColor,
      size: LANDMARK_CONFIG.DEFAULT_SIZE,
      opacity: baseOpacity,
      pulse: false,
    };
  };

  // Render skeleton connections
  const renderConnections = () => {
    const connections = [];
    
    POSE_CONNECTIONS.forEach(([startIdx, endIdx], connectionIdx) => {
      const startLandmark = transformedLandmarks.find(l => l.index === startIdx);
      const endLandmark = transformedLandmarks.find(l => l.index === endIdx);
      
      if (!startLandmark || !endLandmark) return;
      
      // Check if this connection is part of an error
      const isErrorConnection = landmarkErrors.some(error =>
        error.affectedLandmarks.includes(startIdx) || 
        error.affectedLandmarks.includes(endIdx)
      );
      
      const strokeColor = isErrorConnection 
        ? POSE_COLORS.SKELETON_CONNECTIONS.ERROR
        : POSE_COLORS.SKELETON_CONNECTIONS.GOOD;
      
      const strokeWidth = isErrorConnection 
        ? LANDMARK_CONFIG.ERROR_CONNECTION_WIDTH
        : LANDMARK_CONFIG.CONNECTION_WIDTH;
      
      const opacity = Math.min(
        startLandmark.inFrameLikelihood,
        endLandmark.inFrameLikelihood
      ) * 0.8;
      
      connections.push(
        <Line
          key={`connection-${connectionIdx}`}
          x1={startLandmark.screenX}
          y1={startLandmark.screenY}
          x2={endLandmark.screenX}
          y2={endLandmark.screenY}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeOpacity={opacity}
          strokeLinecap="round"
        />
      );
    });
    
    return connections;
  };

  // Render individual landmarks
  const renderLandmarks = () => {
    return transformedLandmarks.map((landmark, idx) => {
      const isError = landmarkErrors.some(error =>
        error.affectedLandmarks.includes(landmark.index)
      );
      const isCritical = criticalLandmarkIndices.includes(landmark.index);
      
      const style = getLandmarkStyle(landmark, isError, isCritical);
      const size = style.size;
      const opacity = style.pulse 
        ? style.opacity * (0.7 + 0.3 * Math.sin(pulsePhase * 2 * Math.PI))
        : style.opacity;
      
      return (
        <G key={`landmark-${landmark.index}-${idx}`}>
          {/* Landmark glow effect for errors */}
          {isError && (
            <Circle
              cx={landmark.screenX}
              cy={landmark.screenY}
              r={size * 2}
              fill="url(#errorGlow)"
              fillOpacity={opacity * 0.3}
            />
          )}
          
          {/* Main landmark circle */}
          <Circle
            cx={landmark.screenX}
            cy={landmark.screenY}
            r={size}
            fill={style.fill}
            fillOpacity={opacity}
            stroke={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
            strokeWidth={0.5}
          />
          
          {/* Landmark label (if enabled) */}
          {showLandmarkLabels && (
            <Text
              x={landmark.screenX + size + 4}
              y={landmark.screenY - size}
              fill={theme.textSecondary}
              fontSize={10}
              fontWeight="500"
            >
              {landmark.index}
            </Text>
          )}
        </G>
      );
    });
  };

  // Animation loop for pulsing effects
  useEffect(() => {
    if (landmarkErrors.length === 0) return;
    
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      setPulsePhase((elapsed / PULSE_FREQUENCY) % 1);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [landmarkErrors]);

  // Don't render if no pose data or invalid dimensions
  if (!poseData?.landmarks || !videoDimensions || !containerDimensions) {
    return null;
  }

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Svg
        width={containerDimensions.width}
        height={containerDimensions.height}
        style={styles.svg}
      >
        <Defs>
          {/* Gradient for error highlighting */}
          <RadialGradient id="errorGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={POSE_COLORS.ANALYSIS_FEEDBACK.CRITICAL} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={POSE_COLORS.ANALYSIS_FEEDBACK.CRITICAL} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        
        {/* Render skeleton connections first (behind landmarks) */}
        {renderConnections()}
        
        {/* Render landmarks on top */}
        {renderLandmarks()}
      </Svg>
      
      {/* Debug information (development only) */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={[styles.debugText, { color: theme.textSecondary }]}>
            Landmarks: {transformedLandmarks.length}
          </Text>
          <Text style={[styles.debugText, { color: theme.textSecondary }]}>
            Errors: {landmarkErrors.length}
          </Text>
          <Text style={[styles.debugText, { color: theme.textSecondary }]}>
            Scale: {scalingFactors.scaleX.toFixed(2)}×{scalingFactors.scaleY.toFixed(2)}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  svg: {
    flex: 1,
  },
  debugInfo: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 4,
    minWidth: 120,
  },
  debugText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

// Memoization with optimized comparison
PoseLandmarkRenderer.displayName = 'PoseLandmarkRenderer';

export default memo(PoseLandmarkRenderer, (prevProps, nextProps) => {
  // Optimized comparison for pose landmark renderer
  return (
    prevProps.poseData?.timestamp === nextProps.poseData?.timestamp &&
    prevProps.videoDimensions?.width === nextProps.videoDimensions?.width &&
    prevProps.videoDimensions?.height === nextProps.videoDimensions?.height &&
    prevProps.containerDimensions?.width === nextProps.containerDimensions?.width &&
    prevProps.containerDimensions?.height === nextProps.containerDimensions?.height &&
    prevProps.exerciseType === nextProps.exerciseType &&
    prevProps.showLandmarkLabels === nextProps.showLandmarkLabels &&
    prevProps.highlightCriticalPoints === nextProps.highlightCriticalPoints &&
    prevProps.showFormErrors === nextProps.showFormErrors &&
    prevProps.confidenceThreshold === nextProps.confidenceThreshold
  );
});