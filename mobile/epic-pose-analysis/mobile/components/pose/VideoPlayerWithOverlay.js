/**
 * Video Player with Pose Overlay Component
 * Advanced video player for pose analysis with real-time landmark overlays
 * 
 * Features:
 * - Video playback with custom controls optimized for analysis
 * - Real-time pose landmark rendering overlaid on video
 * - Interactive timeline with movement phases
 * - Specialized controls: slow motion, frame-by-frame navigation
 * - Performance optimized for 60fps smooth playback
 * - Responsive design for mobile portrait/landscape
 * - Glassmorphism design integration
 * - Accessibility compliant controls
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Slider from '@react-native-community/slider';
import { GlassContainer, BlurWrapper } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';
import PoseLandmarkRenderer from './PoseLandmarkRenderer';
import { 
  throttle, 
  debounce, 
  performanceMonitor,
  shouldSkipRender,
  MemoizedVideoPlayer
} from './PerformanceOptimizations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Playback speed options for analysis
const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5];
const DEFAULT_SPEED_INDEX = 3; // 1.0x speed

// Movement phase colors for timeline visualization
const PHASE_COLORS = {
  'descent': '#FF6B35',
  'bottom': '#FF9500',
  'ascent': '#4CAF50',
  'standing': '#2196F3',
  'windup': '#9C27B0',
  'stride': '#F44336',
  'cocking': '#FF5722',
  'acceleration': '#795548',
  'follow_through': '#607D8B',
};

const VideoPlayerWithOverlay = memo(function VideoPlayerWithOverlay({
  videoUri,
  poseSequence = [],
  analysisResult,
  exerciseType,
  onSeek,
  onPlaybackStateChange,
  showControls = true,
  enableLandmarks = true,
  enablePhaseTimeline = true,
  aspectRatio = 16/9,
  style,
}) {
  const { theme, isDarkMode } = useTheme();
  
  // Video player state
  const [status, setStatus] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentSpeedIndex, setCurrentSpeedIndex] = useState(DEFAULT_SPEED_INDEX);
  
  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isSeekingManually, setIsSeekingManually] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  
  // Animation and gesture refs
  const videoRef = useRef(null);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const controlsTimeout = useRef(null);
  const lastTapTime = useRef(0);
  
  // Calculated current pose data based on playback position
  const currentPoseData = useMemo(() => {
    if (!poseSequence.length || !position) return null;
    
    // Find the pose data closest to current playback time
    const currentTime = position;
    const closestPose = poseSequence.reduce((closest, pose) => {
      const timeDiff = Math.abs(pose.timestamp - currentTime);
      const closestTimeDiff = Math.abs(closest?.timestamp - currentTime);
      return timeDiff < closestTimeDiff ? pose : closest;
    }, poseSequence[0]);
    
    return closestPose;
  }, [poseSequence, position]);

  // Movement phases from analysis result
  const movementPhases = useMemo(() => {
    if (!analysisResult?.analysis?.keyPhases) return [];
    return analysisResult.analysis.keyPhases.map(phase => ({
      ...phase,
      startTime: (phase.startFrame / 30) * 1000, // Assuming 30fps
      endTime: ((phase.endFrame || phase.startFrame + 30) / 30) * 1000,
    }));
  }, [analysisResult]);

  // Performance tracking
  const lastRenderTime = useRef(0);
  
  // Throttled playback status handler for performance
  const handlePlaybackStatusUpdate = useCallback(throttle((newStatus) => {
    // Skip updates if too frequent
    if (shouldSkipRender(lastRenderTime.current)) {
      return;
    }
    lastRenderTime.current = Date.now();
    setStatus(newStatus);
    
    if (newStatus.isLoaded) {
      if (!isSeekingManually) {
        setPosition(newStatus.positionMillis || 0);
      }
      setDuration(newStatus.durationMillis || 0);
      setIsPlaying(newStatus.isPlaying || false);
      setIsBuffering(newStatus.isBuffering || false);
      
      // Update video dimensions for overlay scaling
      if (newStatus.naturalSize && 
          (newStatus.naturalSize.width !== videoDimensions.width || 
           newStatus.naturalSize.height !== videoDimensions.height)) {
        setVideoDimensions(newStatus.naturalSize);
      }
    }
    
    // Notify parent component of playback state changes
    if (onPlaybackStateChange) {
      onPlaybackStateChange({
        isPlaying: newStatus.isPlaying,
        position: newStatus.positionMillis,
        duration: newStatus.durationMillis,
      });
    }
  }, 16.67), [isSeekingManually, videoDimensions, onPlaybackStateChange]); // 60fps throttling

  // Toggle play/pause
  const handlePlayPause = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } catch (error) {
      console.error('Play/pause error:', error);
    }
  }, [isPlaying]);

  // Debounced seeking for performance
  const handleSeek = useCallback(debounce(async (value) => {
    if (!videoRef.current || !duration) return;
    
    const seekPosition = Math.max(0, Math.min(duration, value));
    setPosition(seekPosition);
    
    try {
      await videoRef.current.setPositionAsync(seekPosition);
      if (onSeek) {
        onSeek(seekPosition);
      }
    } catch (error) {
      console.error('Seek error:', error);
    }
  }, 100), [duration, onSeek]); // 100ms debounce

  // Frame-by-frame navigation
  const handleFrameStep = useCallback(async (direction) => {
    if (!videoRef.current || !duration) return;
    
    const frameTime = 1000 / 30; // 30fps assumption
    const newPosition = direction > 0 
      ? Math.min(duration, position + frameTime)
      : Math.max(0, position - frameTime);
    
    await handleSeek(newPosition);
  }, [position, duration, handleSeek]);

  // Playback speed control
  const handleSpeedChange = useCallback(async (speedIndex) => {
    if (!videoRef.current) return;
    
    const rate = PLAYBACK_SPEEDS[speedIndex];
    setCurrentSpeedIndex(speedIndex);
    setShowSpeedMenu(false);
    
    try {
      await videoRef.current.setRateAsync(rate, true);
    } catch (error) {
      console.error('Speed change error:', error);
    }
  }, []);

  // Toggle fullscreen mode
  const handleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
    if (Platform.OS === 'ios') {
      StatusBar.setHidden(!isFullscreen, 'slide');
    }
  }, [isFullscreen]);

  // Controls visibility management
  const hideControls = useCallback(() => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setControlsVisible(false));
  }, [controlsOpacity]);

  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Clear existing timeout
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }
    
    // Hide controls after 3 seconds of inactivity
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        hideControls();
      }
    }, 3000);
  }, [isPlaying, hideControls, controlsOpacity]);

  // Handle video container tap
  const handleVideoTap = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - lastTapTime.current;
    lastTapTime.current = now;
    
    // Double tap for play/pause
    if (timeDiff < 300) {
      handlePlayPause();
    } else {
      // Single tap to show/hide controls
      if (controlsVisible) {
        hideControls();
      } else {
        showControlsTemporarily();
      }
    }
  }, [controlsVisible, hideControls, showControlsTemporarily, handlePlayPause]);

  // Format time for display
  const formatTime = useCallback((timeMs) => {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Calculate container dimensions
  const containerStyle = useMemo(() => {
    const baseWidth = isFullscreen ? screenWidth : screenWidth;
    const baseHeight = isFullscreen 
      ? screenHeight 
      : Math.min(baseWidth / aspectRatio, screenHeight * 0.6);
    
    return {
      width: baseWidth,
      height: baseHeight,
      aspectRatio: isFullscreen ? undefined : aspectRatio,
    };
  }, [isFullscreen, aspectRatio]);

  // Timeline component for movement phases
  const renderPhaseTimeline = () => {
    if (!enablePhaseTimeline || !movementPhases.length || !duration) return null;

    return (
      <View style={styles.phaseTimeline}>
        <View style={styles.phaseTrack}>
          {movementPhases.map((phase, index) => {
            const startPercent = (phase.startTime / duration) * 100;
            const widthPercent = ((phase.endTime - phase.startTime) / duration) * 100;
            const phaseColor = PHASE_COLORS[phase.type] || theme.primary;
            
            return (
              <View
                key={`${phase.type}-${index}`}
                style={[
                  styles.phaseSegment,
                  {
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                    backgroundColor: phaseColor,
                  }
                ]}
              />
            );
          })}
        </View>
        <View style={styles.phaseLabels}>
          {movementPhases.map((phase, index) => (
            <Text 
              key={`label-${phase.type}-${index}`}
              style={[styles.phaseLabel, { color: theme.textSecondary }]}
            >
              {phase.type}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  useEffect(() => {
    // Show controls initially
    showControlsTemporarily();
    
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [showControlsTemporarily]);

  // Performance monitoring (development only)
  useEffect(() => {
    if (__DEV__) {
      const interval = setInterval(() => {
        const metrics = performanceMonitor.getPerformanceMetrics();
        if (metrics.performanceGrade === 'poor') {
          console.warn('Video player performance warning:', metrics);
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <GestureHandlerRootView style={[containerStyle, style]}>
      <View style={[styles.container, containerStyle]}>
        {/* Video Player */}
        <TouchableOpacity 
          style={styles.videoContainer}
          onPress={handleVideoTap}
          activeOpacity={1}
        >
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.video}
            resizeMode="contain"
            shouldPlay={isPlaying}
            isLooping={false}
            volume={0.8}
            rate={PLAYBACK_SPEEDS[currentSpeedIndex]}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            onLoad={(loadStatus) => {
              setVideoDimensions(loadStatus.naturalSize);
            }}
          />
          
          {/* Pose Landmarks Overlay */}
          {enableLandmarks && currentPoseData && videoDimensions.width > 0 && (
            <PoseLandmarkRenderer
              poseData={currentPoseData}
              videoDimensions={videoDimensions}
              containerDimensions={containerStyle}
              exerciseType={exerciseType}
              analysisResult={analysisResult}
              style={styles.landmarkOverlay}
            />
          )}
          
          {/* Buffering Indicator */}
          {isBuffering && (
            <BlurWrapper intensity="medium" style={styles.bufferingOverlay}>
              <View style={styles.bufferingContent}>
                <Animated.View
                  style={[
                    styles.bufferingSpinner,
                    {
                      transform: [{
                        rotate: controlsOpacity.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        })
                      }]
                    }
                  ]}
                >
                  <Ionicons name="refresh" size={32} color={theme.primary} />
                </Animated.View>
                <Text style={[styles.bufferingText, { color: theme.text }]}>
                  Loading...
                </Text>
              </View>
            </BlurWrapper>
          )}
        </TouchableOpacity>

        {/* Video Controls Overlay */}
        {showControls && controlsVisible && (
          <Animated.View 
            style={[
              styles.controlsOverlay,
              { opacity: controlsOpacity }
            ]}
          >
            {/* Top Controls */}
            <BlurWrapper intensity="strong" style={styles.topControls}>
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setShowSpeedMenu(!showSpeedMenu)}
                >
                  <Text style={[styles.speedButtonText, { color: theme.text }]}>
                    {PLAYBACK_SPEEDS[currentSpeedIndex]}×
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.controlsSpacer} />
                
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handleFullscreen}
                >
                  <Ionicons 
                    name={isFullscreen ? "contract" : "expand"} 
                    size={20} 
                    color={theme.text} 
                  />
                </TouchableOpacity>
              </View>

              {/* Speed Menu */}
              {showSpeedMenu && (
                <View style={styles.speedMenu}>
                  {PLAYBACK_SPEEDS.map((speed, index) => (
                    <TouchableOpacity
                      key={speed}
                      style={[
                        styles.speedMenuItem,
                        index === currentSpeedIndex && styles.speedMenuItemActive
                      ]}
                      onPress={() => handleSpeedChange(index)}
                    >
                      <Text style={[
                        styles.speedMenuText, 
                        { 
                          color: index === currentSpeedIndex ? theme.primary : theme.text 
                        }
                      ]}>
                        {speed}×
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </BlurWrapper>

            {/* Center Play/Pause Button */}
            <View style={styles.centerControls}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={handlePlayPause}
              >
                <BlurWrapper intensity="strong" style={styles.playButtonBlur}>
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={36}
                    color={theme.text}
                  />
                </BlurWrapper>
              </TouchableOpacity>
            </View>

            {/* Bottom Controls */}
            <BlurWrapper intensity="strong" style={styles.bottomControls}>
              {/* Frame-by-frame controls */}
              <View style={styles.frameControls}>
                <TouchableOpacity
                  style={styles.frameButton}
                  onPress={() => handleFrameStep(-1)}
                >
                  <Ionicons name="play-back" size={20} color={theme.text} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.frameButton}
                  onPress={() => handleFrameStep(1)}
                >
                  <Ionicons name="play-forward" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Progress Timeline */}
              <View style={styles.progressContainer}>
                <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                  {formatTime(position)}
                </Text>
                
                <View style={styles.sliderContainer}>
                  <Slider
                    style={styles.progressSlider}
                    minimumValue={0}
                    maximumValue={duration}
                    value={position}
                    onSlidingStart={() => setIsSeekingManually(true)}
                    onSlidingComplete={(value) => {
                      setIsSeekingManually(false);
                      handleSeek(value);
                    }}
                    onValueChange={setPosition}
                    minimumTrackTintColor={theme.primary}
                    maximumTrackTintColor={theme.textTertiary + '40'}
                    thumbStyle={[styles.sliderThumb, { backgroundColor: theme.primary }]}
                  />
                </View>
                
                <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                  {formatTime(duration)}
                </Text>
              </View>

              {/* Movement Phases Timeline */}
              {renderPhaseTimeline()}
            </BlurWrapper>
          </Animated.View>
        )}
      </View>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  landmarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bufferingContent: {
    alignItems: 'center',
  },
  bufferingSpinner: {
    marginBottom: 8,
  },
  bufferingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    padding: 8,
    borderRadius: 20,
  },
  controlsSpacer: {
    flex: 1,
  },
  speedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  speedMenu: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speedMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  speedMenuItemActive: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
  },
  speedMenuText: {
    fontSize: 14,
    fontWeight: '600',
  },
  centerControls: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  playButtonBlur: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
  frameControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 12,
  },
  frameButton: {
    padding: 8,
    borderRadius: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  sliderContainer: {
    flex: 1,
  },
  progressSlider: {
    height: 40,
  },
  sliderThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  phaseTimeline: {
    marginTop: 8,
  },
  phaseTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  phaseSegment: {
    position: 'absolute',
    height: '100%',
    borderRadius: 2,
  },
  phaseLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  phaseLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});

// Memoization with custom comparison for better performance
VideoPlayerWithOverlay.displayName = 'VideoPlayerWithOverlay';

export default memo(VideoPlayerWithOverlay, (prevProps, nextProps) => {
  // Custom comparison to avoid unnecessary re-renders
  return (
    prevProps.videoUri === nextProps.videoUri &&
    prevProps.exerciseType === nextProps.exerciseType &&
    prevProps.enableLandmarks === nextProps.enableLandmarks &&
    prevProps.enablePhaseTimeline === nextProps.enablePhaseTimeline &&
    prevProps.showControls === nextProps.showControls &&
    prevProps.aspectRatio === nextProps.aspectRatio &&
    // Only re-render if pose data actually changes
    prevProps.poseSequence?.length === nextProps.poseSequence?.length &&
    prevProps.analysisResult?.analysis?.overallScore === nextProps.analysisResult?.analysis?.overallScore
  );
});