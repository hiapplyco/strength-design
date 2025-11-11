/**
 * TutorialVideo Component
 * 
 * Interactive tutorial video component with advanced playback controls,
 * adaptive quality selection, progress tracking, and accessibility features
 * 
 * Features:
 * - Professional video demonstration playback
 * - Adaptive quality based on network conditions
 * - Interactive progress tracking with bookmarks
 * - Accessibility controls and subtitles
 * - Integration with tutorial service APIs
 * - Offline content support via content delivery service
 * - User engagement metrics tracking
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as ScreenOrientation from 'expo-screen-orientation';

import { GlassContainer, GlassButton } from '../GlassmorphismComponents';
import tutorialService from '../../services/tutorialService';
import contentDeliveryService from '../../services/contentDeliveryService';
import { useTheme } from '../../contexts/ThemeContext';
import { createThemedStyles, spacing, typography, borderRadius, colors } from '../../utils/designTokens';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Quality options for video playback
 */
const QUALITY_OPTIONS = [
  { key: 'auto', label: 'Auto', description: 'Adaptive quality based on connection' },
  { key: 'high', label: 'High (1080p)', description: 'Best quality, requires good connection' },
  { key: 'medium', label: 'Medium (720p)', description: 'Balanced quality and data usage' },
  { key: 'low', label: 'Low (480p)', description: 'Data saver mode' },
];

/**
 * Playback speed options
 */
const SPEED_OPTIONS = [
  { key: '0.5', label: '0.5x', value: 0.5 },
  { key: '0.75', label: '0.75x', value: 0.75 },
  { key: '1', label: '1x', value: 1.0 },
  { key: '1.25', label: '1.25x', value: 1.25 },
  { key: '1.5', label: '1.5x', value: 1.5 },
  { key: '2', label: '2x', value: 2.0 },
];

const TutorialVideo = memo(({
  tutorialContent,
  contentId,
  autoplay = false,
  showControls = true,
  enableFullscreen = true,
  enableBookmarks = true,
  onProgress,
  onComplete,
  onBookmark,
  onError,
  style,
  accessibilityLabel,
  testID,
}) => {
  // State management
  const [videoUri, setVideoUri] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(!autoplay);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState(null);
  
  // Video state
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [positionMillis, setPositionMillis] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [selectedQuality, setSelectedQuality] = useState('auto');
  
  // UI state
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  
  // Refs
  const videoRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const engagementStartTime = useRef(Date.now());
  const pauseCount = useRef(0);
  const rewindCount = useRef(0);
  const speedChangeCount = useRef(0);
  
  // Theme
  const { isDarkMode } = useTheme();
  const styles = createThemedStyles(styleSheet, isDarkMode ? 'dark' : 'light');

  /**
   * Initialize video content and setup
   */
  useEffect(() => {
    initializeVideoContent();
    return cleanup;
  }, [contentId, tutorialContent]);

  /**
   * Handle video progress tracking
   */
  useEffect(() => {
    if (isPlaying && !isPaused) {
      startProgressTracking();
    } else {
      stopProgressTracking();
    }
    return stopProgressTracking;
  }, [isPlaying, isPaused]);

  /**
   * Auto-hide controls after inactivity
   */
  useEffect(() => {
    if (showControlsOverlay && isPlaying) {
      const timeout = setTimeout(() => {
        setShowControlsOverlay(false);
      }, 3000);
      setControlsTimeout(timeout);
      
      return () => clearTimeout(timeout);
    }
  }, [showControlsOverlay, isPlaying]);

  /**
   * Initialize video content from tutorial service
   */
  const initializeVideoContent = async () => {
    try {
      setIsLoading(true);
      
      let content = tutorialContent;
      if (!content && contentId) {
        content = await tutorialService.getTutorialContent(contentId);
      }
      
      if (!content || !content.mediaUrls) {
        throw new Error('No video content available');
      }
      
      // Get optimized video URL based on selected quality
      const videoUrl = await getOptimizedVideoUrl(content, selectedQuality);
      setVideoUri(videoUrl);
      
      // Load existing bookmarks
      await loadBookmarks();
      
      // Track content view
      await trackContentView();
      
    } catch (error) {
      console.error('Error initializing video content:', error);
      onError?.(error);
      Alert.alert(
        'Video Error', 
        'Unable to load video content. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get optimized video URL based on quality selection
   */
  const getOptimizedVideoUrl = async (content, quality) => {
    try {
      // Use content delivery service for optimization
      const result = await contentDeliveryService.getContentUrl(
        content.videoUrl || content.mediaUrls.video,
        { 
          quality,
          allowCache: true,
          progressCallback: (progress) => {
            console.log('Video download progress:', progress.percentage + '%');
          }
        }
      );
      
      return result.url;
    } catch (error) {
      console.warn('Failed to optimize video URL, using fallback:', error);
      return content.videoUrl || content.mediaUrls.video;
    }
  };

  /**
   * Load existing bookmarks for this content
   */
  const loadBookmarks = async () => {
    try {
      const progress = await tutorialService.getContentProgress(contentId);
      if (progress && progress.bookmarks) {
        setBookmarks(progress.bookmarks);
      }
    } catch (error) {
      console.warn('Failed to load bookmarks:', error);
    }
  };

  /**
   * Track content view for analytics
   */
  const trackContentView = async () => {
    try {
      await tutorialService.trackContentView(contentId);
    } catch (error) {
      console.warn('Failed to track content view:', error);
    }
  };

  /**
   * Handle video load completion
   */
  const onVideoLoad = (loadData) => {
    setDuration(loadData.durationMillis || 0);
    setIsLoading(false);
    
    if (autoplay) {
      handlePlay();
    }
  };

  /**
   * Handle video playback status updates
   */
  const onPlaybackStatusUpdate = (status) => {
    if (!status.isLoaded) return;
    
    setPositionMillis(status.positionMillis || 0);
    setPosition((status.positionMillis || 0) / 1000);
    setIsBuffering(status.isBuffering || false);
    setIsPlaying(status.isPlaying || false);
    
    // Check for video completion
    if (status.didJustFinish) {
      handleVideoComplete();
    }
  };

  /**
   * Start progress tracking interval
   */
  const startProgressTracking = () => {
    if (progressIntervalRef.current) return;
    
    progressIntervalRef.current = setInterval(() => {
      updateProgress();
    }, 1000);
  };

  /**
   * Stop progress tracking interval
   */
  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  /**
   * Update progress in tutorial service
   */
  const updateProgress = async () => {
    try {
      const progressPercentage = duration > 0 ? (position / (duration / 1000)) * 100 : 0;
      const timeSpent = Math.floor((Date.now() - engagementStartTime.current) / 1000);
      
      await tutorialService.updateTutorialProgress(contentId, {
        progressPercentage: Math.min(progressPercentage, 100),
        timeSpent,
        currentSection: Math.floor(progressPercentage / 10), // 10% sections
        lastAccessedAt: new Date(),
      });
      
      onProgress?.({
        percentage: progressPercentage,
        position,
        duration: duration / 1000,
        timeSpent,
      });
    } catch (error) {
      console.warn('Failed to update progress:', error);
    }
  };

  /**
   * Handle video completion
   */
  const handleVideoComplete = async () => {
    try {
      setIsPlaying(false);
      setPosition(duration / 1000);
      
      // Track completion
      const totalTimeSpent = Math.floor((Date.now() - engagementStartTime.current) / 1000);
      await tutorialService.completeTutorial(contentId, {
        timeSpent: totalTimeSpent,
        completedAt: new Date(),
      });
      
      // Track engagement metrics
      await trackEngagementMetrics();
      
      onComplete?.({
        contentId,
        timeSpent: totalTimeSpent,
        engagementScore: calculateEngagementScore(),
      });
      
    } catch (error) {
      console.error('Error handling video completion:', error);
    }
  };

  /**
   * Track detailed engagement metrics
   */
  const trackEngagementMetrics = async () => {
    try {
      const totalTimeSpent = Math.floor((Date.now() - engagementStartTime.current) / 1000);
      const interactionCount = pauseCount.current + rewindCount.current + speedChangeCount.current + bookmarks.length;
      
      await tutorialService.trackEngagementMetrics(contentId, {
        timeSpent: totalTimeSpent,
        interactionCount,
        pauseCount: pauseCount.current,
        rewindCount: rewindCount.current,
        speedChanges: speedChangeCount.current,
        bookmarksAdded: bookmarks.length,
        completionPercentage: (position / (duration / 1000)) * 100,
      });
    } catch (error) {
      console.warn('Failed to track engagement metrics:', error);
    }
  };

  /**
   * Calculate engagement score based on interactions
   */
  const calculateEngagementScore = () => {
    const timeScore = Math.min(30, (position / 300) * 30); // Max 30 points for 5+ minutes
    const interactionScore = Math.min(25, (pauseCount.current + rewindCount.current) * 5);
    const bookmarkScore = Math.min(25, bookmarks.length * 10);
    const completionScore = (position / (duration / 1000)) * 20;
    
    return Math.round(timeScore + interactionScore + bookmarkScore + completionScore);
  };

  /**
   * Handle play/pause toggle
   */
  const handlePlayPause = async () => {
    try {
      if (!videoRef.current) return;
      
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        pauseCount.current += 1;
        setIsPaused(true);
      } else {
        await videoRef.current.playAsync();
        setIsPaused(false);
      }
      
      showControls();
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  /**
   * Handle play action
   */
  const handlePlay = async () => {
    try {
      if (videoRef.current) {
        await videoRef.current.playAsync();
        setIsPaused(false);
      }
    } catch (error) {
      console.error('Error playing video:', error);
    }
  };

  /**
   * Handle pause action
   */
  const handlePause = async () => {
    try {
      if (videoRef.current) {
        await videoRef.current.pauseAsync();
        pauseCount.current += 1;
        setIsPaused(true);
      }
    } catch (error) {
      console.error('Error pausing video:', error);
    }
  };

  /**
   * Handle video seeking
   */
  const handleSeek = async (value) => {
    try {
      if (!videoRef.current) return;
      
      const seekPosition = value * duration;
      await videoRef.current.setPositionAsync(seekPosition);
      
      if (value < position / (duration / 1000)) {
        rewindCount.current += 1;
      }
      
      showControls();
    } catch (error) {
      console.error('Error seeking video:', error);
    }
  };

  /**
   * Handle mute toggle
   */
  const handleMuteToggle = async () => {
    try {
      if (videoRef.current) {
        await videoRef.current.setIsMutedAsync(!isMuted);
        setIsMuted(!isMuted);
      }
      showControls();
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  /**
   * Handle fullscreen toggle
   */
  const handleFullscreenToggle = async () => {
    try {
      if (isFullscreen) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setIsFullscreen(false);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
        setIsFullscreen(true);
      }
      showControls();
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  /**
   * Handle quality selection
   */
  const handleQualityChange = async (quality) => {
    try {
      setSelectedQuality(quality);
      setShowQualityMenu(false);
      
      // Reload video with new quality
      const currentPosition = positionMillis;
      const wasPlaying = isPlaying;
      
      setIsLoading(true);
      const newVideoUrl = await getOptimizedVideoUrl(tutorialContent, quality);
      setVideoUri(newVideoUrl);
      
      // Restore playback state after loading
      setTimeout(async () => {
        if (videoRef.current) {
          await videoRef.current.setPositionAsync(currentPosition);
          if (wasPlaying) {
            await videoRef.current.playAsync();
          }
        }
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error changing quality:', error);
      setIsLoading(false);
    }
  };

  /**
   * Handle playback speed change
   */
  const handleSpeedChange = async (speed) => {
    try {
      if (videoRef.current) {
        await videoRef.current.setRateAsync(speed, true);
        setPlaybackSpeed(speed);
        speedChangeCount.current += 1;
      }
      setShowSpeedMenu(false);
      showControls();
    } catch (error) {
      console.error('Error changing playback speed:', error);
    }
  };

  /**
   * Handle bookmark creation
   */
  const handleBookmark = async () => {
    try {
      const bookmark = {
        id: Date.now().toString(),
        position: positionMillis,
        timestamp: position,
        note: '',
        createdAt: new Date(),
      };
      
      const newBookmarks = [...bookmarks, bookmark];
      setBookmarks(newBookmarks);
      
      // Save bookmark to tutorial service
      await tutorialService.updateTutorialProgress(contentId, {
        bookmarks: newBookmarks,
      });
      
      onBookmark?.(bookmark);
      showControls();
      
    } catch (error) {
      console.error('Error creating bookmark:', error);
      Alert.alert('Error', 'Failed to create bookmark');
    }
  };

  /**
   * Jump to bookmark position
   */
  const jumpToBookmark = async (bookmark) => {
    try {
      if (videoRef.current) {
        await videoRef.current.setPositionAsync(bookmark.position);
      }
      showControls();
    } catch (error) {
      console.error('Error jumping to bookmark:', error);
    }
  };

  /**
   * Show controls overlay temporarily
   */
  const showControls = () => {
    setShowControlsOverlay(true);
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
  };

  /**
   * Hide controls overlay
   */
  const hideControls = () => {
    if (isPlaying) {
      setShowControlsOverlay(false);
    }
  };

  /**
   * Format time for display
   */
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Cleanup function
   */
  const cleanup = () => {
    stopProgressTracking();
    if (controlsTimeout) {
      clearTimeout(controlsTimeout);
    }
  };

  // Loading state
  if (isLoading && !videoUri) {
    return (
      <GlassContainer style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text style={styles.loadingText}>Loading tutorial video...</Text>
        </View>
      </GlassContainer>
    );
  }

  // Error state
  if (!videoUri) {
    return (
      <GlassContainer style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Ionicons 
            name="videocam-off" 
            size={48} 
            color={isDarkMode ? colors.dark.text.tertiary : colors.light.text.tertiary} 
          />
          <Text style={styles.errorText}>Video content unavailable</Text>
          <GlassButton 
            title="Retry"
            onPress={initializeVideoContent}
            style={styles.retryButton}
          />
        </View>
      </GlassContainer>
    );
  }

  return (
    <GlassContainer 
      style={[styles.container, style]}
      accessibilityLabel={accessibilityLabel || "Tutorial video player"}
      testID={testID}
    >
      {/* Video Player */}
      <TouchableOpacity 
        style={styles.videoContainer}
        onPress={showControlsOverlay ? hideControls : showControls}
        activeOpacity={1}
      >
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          onLoad={onVideoLoad}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          shouldPlay={isPlaying}
          isLooping={false}
          isMuted={isMuted}
          rate={playbackSpeed}
          accessibilityLabel="Tutorial video content"
        />
        
        {/* Loading Overlay */}
        {(isLoading || isBuffering) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          </View>
        )}
        
        {/* Controls Overlay */}
        {showControlsOverlay && showControls && (
          <View style={styles.controlsOverlay}>
            {/* Top Controls */}
            <View style={styles.topControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setShowQualityMenu(true)}
                accessibilityLabel="Video quality settings"
              >
                <Ionicons name="settings" size={24} color="#FFFFFF" />
                <Text style={styles.controlLabel}>{selectedQuality.toUpperCase()}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setShowSpeedMenu(true)}
                accessibilityLabel="Playback speed settings"
              >
                <Ionicons name="speedometer" size={24} color="#FFFFFF" />
                <Text style={styles.controlLabel}>{playbackSpeed}x</Text>
              </TouchableOpacity>
              
              {enableFullscreen && (
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handleFullscreenToggle}
                  accessibilityLabel={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  <Ionicons 
                    name={isFullscreen ? "contract" : "expand"} 
                    size={24} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Center Play/Pause Button */}
            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={handlePlayPause}
              accessibilityLabel={isPlaying ? "Pause video" : "Play video"}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={48} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
            
            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Slider
                  style={styles.progressSlider}
                  value={duration > 0 ? position / (duration / 1000) : 0}
                  onValueChange={handleSeek}
                  minimumValue={0}
                  maximumValue={1}
                  minimumTrackTintColor={colors.primary.DEFAULT}
                  maximumTrackTintColor="rgba(255,255,255,0.3)"
                  thumbStyle={styles.progressThumb}
                  accessibilityLabel="Video progress"
                />
                <Text style={styles.timeText}>{formatTime(duration / 1000)}</Text>
              </View>
              
              {/* Bottom Right Controls */}
              <View style={styles.bottomRightControls}>
                {enableBookmarks && (
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleBookmark}
                    accessibilityLabel="Add bookmark"
                  >
                    <Ionicons name="bookmark" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={handleMuteToggle}
                  accessibilityLabel={isMuted ? "Unmute video" : "Mute video"}
                >
                  <Ionicons 
                    name={isMuted ? "volume-mute" : "volume-high"} 
                    size={24} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Bookmarks List */}
      {bookmarks.length > 0 && (
        <View style={styles.bookmarksContainer}>
          <Text style={styles.bookmarksTitle}>Bookmarks</Text>
          <View style={styles.bookmarksList}>
            {bookmarks.map((bookmark) => (
              <TouchableOpacity
                key={bookmark.id}
                style={styles.bookmarkItem}
                onPress={() => jumpToBookmark(bookmark)}
                accessibilityLabel={`Jump to bookmark at ${formatTime(bookmark.timestamp)}`}
              >
                <Ionicons name="bookmark" size={16} color={colors.primary.DEFAULT} />
                <Text style={styles.bookmarkTime}>{formatTime(bookmark.timestamp)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      
      {/* Quality Menu Modal */}
      {showQualityMenu && (
        <View style={styles.menuOverlay}>
          <GlassContainer style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Video Quality</Text>
            {QUALITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.menuItem,
                  selectedQuality === option.key && styles.selectedMenuItem
                ]}
                onPress={() => handleQualityChange(option.key)}
              >
                <Text style={styles.menuItemText}>{option.label}</Text>
                <Text style={styles.menuItemDescription}>{option.description}</Text>
                {selectedQuality === option.key && (
                  <Ionicons name="checkmark" size={20} color={colors.primary.DEFAULT} />
                )}
              </TouchableOpacity>
            ))}
            <GlassButton
              title="Cancel"
              onPress={() => setShowQualityMenu(false)}
              style={styles.menuCancelButton}
            />
          </GlassContainer>
        </View>
      )}
      
      {/* Speed Menu Modal */}
      {showSpeedMenu && (
        <View style={styles.menuOverlay}>
          <GlassContainer style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Playback Speed</Text>
            {SPEED_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.menuItem,
                  playbackSpeed === option.value && styles.selectedMenuItem
                ]}
                onPress={() => handleSpeedChange(option.value)}
              >
                <Text style={styles.menuItemText}>{option.label}</Text>
                {playbackSpeed === option.value && (
                  <Ionicons name="checkmark" size={20} color={colors.primary.DEFAULT} />
                )}
              </TouchableOpacity>
            ))}
            <GlassButton
              title="Cancel"
              onPress={() => setShowSpeedMenu(false)}
              style={styles.menuCancelButton}
            />
          </GlassContainer>
        </View>
      )}
    </GlassContainer>
  );
});

/**
 * Component styles
 */
const styleSheet = (theme) => StyleSheet.create({
  container: {
    borderRadius: borderRadius.component.card.lg,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  
  videoContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    borderRadius: borderRadius.component.card.lg,
    overflow: 'hidden',
  },
  
  video: {
    width: '100%',
    height: '100%',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
    padding: spacing[6],
  },
  
  loadingText: {
    color: theme.text.secondary,
    fontSize: typography.fontSize.base,
    marginTop: spacing[3],
    textAlign: 'center',
  },
  
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
    padding: spacing[6],
  },
  
  errorText: {
    color: theme.text.secondary,
    fontSize: typography.fontSize.base,
    marginTop: spacing[3],
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  
  retryButton: {
    marginTop: spacing[2],
  },
  
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  
  playPauseButton: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  bottomControls: {
    flexDirection: 'column',
  },
  
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  
  progressSlider: {
    flex: 1,
    height: 40,
    marginHorizontal: spacing[2],
  },
  
  progressThumb: {
    width: 16,
    height: 16,
    backgroundColor: colors.primary.DEFAULT,
  },
  
  timeText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    minWidth: 35,
    textAlign: 'center',
  },
  
  bottomRightControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
    marginHorizontal: spacing[1],
    borderRadius: borderRadius.base,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  
  controlLabel: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    marginLeft: spacing[1],
    fontWeight: typography.fontWeight.medium,
  },
  
  bookmarksContainer: {
    marginTop: spacing[4],
    padding: spacing[4],
  },
  
  bookmarksTitle: {
    color: theme.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[3],
  },
  
  bookmarksList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
    backgroundColor: theme.background.secondary,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: theme.border.light,
  },
  
  bookmarkTime: {
    color: theme.text.primary,
    fontSize: typography.fontSize.sm,
    marginLeft: spacing[1],
    fontWeight: typography.fontWeight.medium,
  },
  
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  
  menuContainer: {
    width: '90%',
    maxWidth: 320,
    padding: spacing[5],
    borderRadius: borderRadius.component.modal.lg,
  },
  
  menuTitle: {
    color: theme.text.primary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    borderRadius: borderRadius.base,
    marginBottom: spacing[2],
    backgroundColor: theme.background.secondary,
  },
  
  selectedMenuItem: {
    backgroundColor: colors.primary.light + '20',
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
  },
  
  menuItemText: {
    color: theme.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  
  menuItemDescription: {
    color: theme.text.secondary,
    fontSize: typography.fontSize.sm,
    marginRight: spacing[2],
  },
  
  menuCancelButton: {
    marginTop: spacing[4],
  },
});

TutorialVideo.displayName = 'TutorialVideo';

export default TutorialVideo;