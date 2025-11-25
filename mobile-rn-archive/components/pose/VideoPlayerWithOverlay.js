/**
 * VideoPlayerWithOverlay - Video playback with pose overlay visualization
 * Displays video with real-time pose detection landmarks and form feedback
 */

import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { GlassContainer } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export default function VideoPlayerWithOverlay({
  videoUri,
  poseSequence = [],
  exerciseType,
  analysisPhases = [],
  onVideoReady
}) {
  const themeContext = useTheme();
  const { colors: themeColors, isDarkMode } = themeContext;

  // Defensive: ensure colors are available
  const theme = themeColors || {
    primary: '#FF6B35',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#6E6E73',
    surface: '#1C1C1E',
    border: '#38383A',
    success: '#34C759',
    error: '#DC2626',
  };

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoLoad = (status) => {
    if (onVideoReady) {
      onVideoReady();
    }
  };

  const handlePlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);
    }
  };

  return (
    <GlassContainer variant="medium" style={styles.container}>
      <View style={styles.videoContainer}>
        {videoUri ? (
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.video}
            resizeMode="contain"
            shouldPlay={false}
            onLoad={handleVideoLoad}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
        ) : (
          <View style={styles.noVideo}>
            <Ionicons name="videocam-off-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.noVideoText, { color: theme.textSecondary }]}>
              No video available
            </Text>
          </View>
        )}

        {/* Pose Overlay would render here */}
        {poseSequence.length > 0 && (
          <View style={styles.overlay} pointerEvents="none">
            {/* Placeholder for pose landmarks visualization */}
          </View>
        )}

        {/* Video Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.playButton, { backgroundColor: theme.primary }]}
            onPress={handlePlayPause}
            accessibilityLabel={isPlaying ? "Pause video" : "Play video"}
            accessibilityRole="button"
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          {analysisPhases.length > 0 && (
            <Text style={[styles.phaseIndicator, { color: theme.text }]}>
              {analysisPhases[0]?.name || 'Analysis'}
            </Text>
          )}
        </View>
      </View>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  noVideo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVideoText: {
    marginTop: 12,
    fontSize: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  controls: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  phaseIndicator: {
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
});
