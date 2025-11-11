/**
 * Pose Upload Card Component - Beautiful Video Upload Interface
 * Glassmorphism card for uploading workout videos with progress tracking
 * 
 * Features:
 * - Drag and drop visual feedback
 * - Video preview with controls
 * - Upload progress animation
 * - File validation and error states
 * - Accessibility compliant
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Video } from 'expo-av';
import { GlassContainer } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export default function PoseUploadCard({
  videoUri,
  isUploading,
  uploadProgress,
  onUploadPress,
  onRetakePress,
  selectedExercise
}) {
  const { theme, isDarkMode } = useTheme();
  const [showVideo, setShowVideo] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  
  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for upload area
    if (!videoUri && !isUploading) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [videoUri, isUploading]);

  useEffect(() => {
    // Progress animation
    Animated.timing(progressAnim, {
      toValue: uploadProgress,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [uploadProgress]);

  useEffect(() => {
    // Video appearance animation
    if (videoUri) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
      setShowVideo(true);
    } else {
      setShowVideo(false);
      scaleAnim.setValue(0.9);
      fadeAnim.setValue(0);
    }
  }, [videoUri]);

  const handleVideoLoad = (status) => {
    if (status.naturalSize) {
      setVideoDimensions(status.naturalSize);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUploadInstructions = () => {
    if (!selectedExercise) {
      return 'Select an exercise first';
    }
    
    return `Record or upload a video of your ${selectedExercise.name}`;
  };

  if (videoUri && showVideo) {
    return (
      <Animated.View
        style={[
          styles.videoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <GlassContainer variant="medium" style={styles.videoCard}>
          {/* Video Preview */}
          <View style={styles.videoWrapper}>
            <Video
              source={{ uri: videoUri }}
              style={styles.video}
              useNativeControls
              resizeMode="contain"
              isLooping
              shouldPlay={false}
              onLoadStart={() => console.log('Video loading...')}
              onLoad={handleVideoLoad}
              onError={(error) => {
                console.error('Video load error:', error);
                Alert.alert('Video Error', 'Failed to load video preview');
              }}
            />
            
            {/* Upload Progress Overlay */}
            {isUploading && (
              <BlurView intensity={30} style={styles.progressOverlay}>
                <View style={styles.progressContent}>
                  <View style={styles.progressCircle}>
                    <Animated.View
                      style={[
                        styles.progressFill,
                        {
                          transform: [{
                            rotate: progressAnim.interpolate({
                              inputRange: [0, 100],
                              outputRange: ['0deg', '360deg'],
                            })
                          }]
                        }
                      ]}
                    />
                    <View style={styles.progressCenter}>
                      <Text style={[styles.progressText, { color: theme.text }]}>
                        {Math.round(uploadProgress)}%
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.progressLabel, { color: theme.text }]}>
                    Uploading video...
                  </Text>
                </View>
              </BlurView>
            )}
          </View>

          {/* Video Info */}
          <View style={styles.videoInfo}>
            <View style={styles.videoMeta}>
              <View style={styles.videoMetaItem}>
                <Ionicons name="film-outline" size={16} color={theme.textSecondary} />
                <Text style={[styles.videoMetaText, { color: theme.textSecondary }]}>
                  Video Ready
                </Text>
              </View>
              {videoDimensions.width > 0 && (
                <View style={styles.videoMetaItem}>
                  <Ionicons name="resize-outline" size={16} color={theme.textSecondary} />
                  <Text style={[styles.videoMetaText, { color: theme.textSecondary }]}>
                    {videoDimensions.width}x{videoDimensions.height}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Action Buttons */}
            <View style={styles.videoActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onRetakePress}
                disabled={isUploading}
                accessibilityLabel="Retake video"
                accessibilityRole="button"
              >
                <BlurView intensity={20} style={styles.actionButtonBlur}>
                  <Ionicons name="camera-outline" size={20} color={theme.textSecondary} />
                  <Text style={[styles.actionButtonText, { color: theme.textSecondary }]}>
                    Retake
                  </Text>
                </BlurView>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onUploadPress}
                disabled={isUploading}
                accessibilityLabel="Upload different video"
                accessibilityRole="button"
              >
                <BlurView intensity={20} style={styles.actionButtonBlur}>
                  <Ionicons name="cloud-upload-outline" size={20} color={theme.textSecondary} />
                  <Text style={[styles.actionButtonText, { color: theme.textSecondary }]}>
                    Replace
                  </Text>
                </BlurView>
              </TouchableOpacity>
            </View>
          </View>
        </GlassContainer>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.uploadContainer,
        { transform: [{ scale: pulseAnim }] }
      ]}
    >
      <TouchableOpacity
        style={styles.uploadArea}
        onPress={onUploadPress}
        disabled={isUploading || !selectedExercise}
        accessibilityLabel="Upload workout video"
        accessibilityRole="button"
        accessibilityHint="Tap to select or record a video of your exercise"
      >
        <GlassContainer 
          variant="subtle" 
          style={[
            styles.uploadCard,
            !selectedExercise && styles.uploadCardDisabled
          ]}
        >
          {isUploading ? (
            <View style={styles.uploadingContent}>
              <Animated.View
                style={[
                  styles.uploadingIcon,
                  {
                    transform: [{
                      rotate: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0deg', '360deg'],
                      })
                    }]
                  }
                ]}
              >
                <Ionicons name="cloud-upload-outline" size={48} color={theme.primary} />
              </Animated.View>
              <Text style={[styles.uploadingTitle, { color: theme.text }]}>
                Uploading Video...
              </Text>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: theme.primary
                    }
                  ]}
                />
              </View>
              <Text style={[styles.progressPercentage, { color: theme.textSecondary }]}>
                {Math.round(uploadProgress)}% complete
              </Text>
            </View>
          ) : (
            <View style={styles.uploadContent}>
              <View style={[
                styles.uploadIcon,
                { 
                  backgroundColor: selectedExercise ? theme.primary + '20' : theme.textTertiary + '20'
                }
              ]}>
                <Ionicons 
                  name="cloud-upload-outline" 
                  size={48} 
                  color={selectedExercise ? theme.primary : theme.textTertiary} 
                />
              </View>
              
              <Text style={[
                styles.uploadTitle,
                { 
                  color: selectedExercise ? theme.text : theme.textTertiary 
                }
              ]}>
                {selectedExercise ? 'Upload or Record Video' : 'Select Exercise First'}
              </Text>
              
              <Text style={[
                styles.uploadDescription,
                { 
                  color: selectedExercise ? theme.textSecondary : theme.textTertiary 
                }
              ]}>
                {getUploadInstructions()}
              </Text>
              
              {selectedExercise && (
                <View style={styles.uploadActions}>
                  <View style={styles.uploadActionItem}>
                    <Ionicons name="camera" size={20} color={theme.primary} />
                    <Text style={[styles.uploadActionText, { color: theme.textSecondary }]}>
                      Record Now
                    </Text>
                  </View>
                  <View style={styles.uploadActionDivider} />
                  <View style={styles.uploadActionItem}>
                    <Ionicons name="folder-open" size={20} color={theme.primary} />
                    <Text style={[styles.uploadActionText, { color: theme.textSecondary }]}>
                      Choose File
                    </Text>
                  </View>
                </View>
              )}
              
              {selectedExercise && (
                <View style={styles.uploadRequirements}>
                  <Text style={[styles.requirementsTitle, { color: theme.textSecondary }]}>
                    Video Requirements:
                  </Text>
                  <View style={styles.requirementsList}>
                    <Text style={[styles.requirement, { color: theme.textTertiary }]}>
                      • Maximum 30 seconds duration
                    </Text>
                    <Text style={[styles.requirement, { color: theme.textTertiary }]}>
                      • Clear view of full body
                    </Text>
                    <Text style={[styles.requirement, { color: theme.textTertiary }]}>
                      • Good lighting conditions
                    </Text>
                    <Text style={[styles.requirement, { color: theme.textTertiary }]}>
                      • File size under 100MB
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </GlassContainer>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  uploadContainer: {
    marginBottom: 20,
  },
  uploadArea: {
    width: '100%',
  },
  uploadCard: {
    padding: 24,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  uploadCardDisabled: {
    opacity: 0.6,
  },
  uploadContent: {
    alignItems: 'center',
    width: '100%',
  },
  uploadIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  uploadDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  uploadActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  uploadActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  uploadActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  uploadActionDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
  },
  uploadRequirements: {
    width: '100%',
    alignItems: 'flex-start',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  requirementsList: {
    gap: 4,
  },
  requirement: {
    fontSize: 12,
    lineHeight: 16,
  },
  uploadingContent: {
    alignItems: 'center',
    width: '100%',
  },
  uploadingIcon: {
    marginBottom: 16,
  },
  uploadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  videoContainer: {
    marginBottom: 20,
  },
  videoCard: {
    padding: 0,
    overflow: 'hidden',
  },
  videoWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContent: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    borderColor: '#FF6B35',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  progressCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  videoInfo: {
    padding: 16,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  videoMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  videoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionButtonBlur: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});