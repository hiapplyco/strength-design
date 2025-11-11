import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function WorkoutVideoRecorder({ 
  visible, 
  workout, 
  onClose, 
  onSave,
  onShare 
}) {
  const [hasPermission, setHasPermission] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const [cameraType, setCameraType] = useState(CameraType.front);
  const [showOverlay, setShowOverlay] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const cameraRef = useRef(null);
  const recordingTimer = useRef(null);

  useEffect(() => {
    if (visible) {
      requestPermissions();
    }
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, [visible]);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: audioStatus } = await Camera.requestMicrophonePermissionsAsync();
    const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
    
    setHasPermission(
      cameraStatus === 'granted' && 
      audioStatus === 'granted' && 
      mediaStatus === 'granted'
    );
  };

  const startCountdown = () => {
    let count = 3;
    setCountdown(count);
    
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        // Haptics only work on native platforms
        if (Platform.OS !== 'web') {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch (e) {
            // Haptics not available
          }
        }
      } else {
        setCountdown(null);
        clearInterval(countdownInterval);
        startRecording();
      }
    }, 1000);
  };

  const startRecording = async () => {
    if (cameraRef.current) {
      try {
        // Haptics only work on native platforms
        if (Platform.OS !== 'web') {
          try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } catch (e) {
            // Haptics not available
          }
        }
        setIsRecording(true);
        setRecordingTime(0);
        
        // Start recording timer
        recordingTimer.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
        
        const video = await cameraRef.current.recordAsync({
          maxDuration: 60, // 1 minute max
          quality: Camera.Constants.VideoQuality['720p'],
        });
        
        setVideoUri(video.uri);
      } catch (error) {
        console.error('Recording error:', error);
        Alert.alert('Recording Failed', 'Unable to start recording');
      }
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      // Haptics only work on native platforms
      if (Platform.OS !== 'web') {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {
          // Haptics not available
        }
      }
      setIsRecording(false);
      
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      
      cameraRef.current.stopRecording();
    }
  };

  const saveVideo = async () => {
    if (videoUri) {
      try {
        const asset = await MediaLibrary.createAssetAsync(videoUri);
        Alert.alert('Success', 'Video saved to your gallery!');
        onSave?.(asset);
      } catch (error) {
        Alert.alert('Error', 'Failed to save video');
      }
    }
  };

  const shareVideo = async () => {
    if (videoUri && onShare) {
      onShare(videoUri, workout);
    }
  };

  const retakeVideo = () => {
    setVideoUri(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCamera = () => (
    <Camera 
      style={styles.camera} 
      type={cameraType}
      ref={cameraRef}
    >
      {/* Overlay with workout info */}
      {showOverlay && (
        <BlurView intensity={80} tint="dark" style={styles.overlay}>
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutTitle}>{workout?.title}</Text>
            <Text style={styles.workoutSubtitle}>
              {workout?.duration} • {workout?.difficulty}
            </Text>
          </View>
        </BlurView>
      )}

      {/* Countdown */}
      {countdown && (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
        </View>
      )}

      {/* Camera controls */}
      <View style={styles.controls}>
        {/* Flip camera */}
        <TouchableOpacity
          style={styles.flipButton}
          onPress={() => {
            setCameraType(current => 
              current === CameraType.back ? CameraType.front : CameraType.back
            );
          }}
        >
          <Ionicons name="camera-reverse" size={30} color="white" />
        </TouchableOpacity>

        {/* Toggle overlay */}
        <TouchableOpacity
          style={styles.overlayToggle}
          onPress={() => setShowOverlay(!showOverlay)}
        >
          <Ionicons 
            name={showOverlay ? "eye" : "eye-off"} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </View>

      {/* Record button */}
      <View style={styles.bottomControls}>
        {!isRecording ? (
          <TouchableOpacity
            style={styles.recordButton}
            onPress={startCountdown}
          >
            <View style={styles.recordButtonInner} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopRecording}
          >
            <View style={styles.stopButtonInner} />
          </TouchableOpacity>
        )}
      </View>

      {/* Prompts */}
      <View style={styles.promptsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <PromptChip text="Introduce yourself" />
          <PromptChip text="Explain the workout" />
          <PromptChip text="Share your goals" />
          <PromptChip text="Give tips" />
        </ScrollView>
      </View>
    </Camera>
  );

  const PromptChip = ({ text }) => (
    <View style={styles.promptChip}>
      <Text style={styles.promptText}>{text}</Text>
    </View>
  );

  const renderPreview = () => (
    <View style={styles.previewContainer}>
      <Video
        source={{ uri: videoUri }}
        style={styles.video}
        useNativeControls
        resizeMode="cover"
        shouldPlay
        isLooping
      />
      
      <View style={styles.previewControls}>
        <TouchableOpacity
          style={styles.previewButton}
          onPress={retakeVideo}
        >
          <Ionicons name="refresh" size={24} color="white" />
          <Text style={styles.previewButtonText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.previewButton}
          onPress={saveVideo}
        >
          <Ionicons name="download" size={24} color="white" />
          <Text style={styles.previewButtonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.previewButton, styles.shareButton]}
          onPress={shareVideo}
        >
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            style={styles.shareGradient}
          >
            <Ionicons name="share-social" size={24} color="white" />
            <Text style={styles.previewButtonText}>Share</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Your Workout</Text>
          <View style={{ width: 30 }} />
        </View>

        {/* Camera or Preview */}
        {hasPermission === false ? (
          <View style={styles.noPermission}>
            <Ionicons name="videocam-off" size={48} color="#666" />
            <Text style={styles.noPermissionText}>
              Camera access is required to record videos
            </Text>
            <TouchableOpacity
              style={styles.requestPermissionButton}
              onPress={requestPermissions}
            >
              <Text style={styles.requestPermissionText}>Grant Access</Text>
            </TouchableOpacity>
          </View>
        ) : hasPermission === null ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#FF6B35" />
          </View>
        ) : videoUri ? (
          renderPreview()
        ) : (
          renderCamera()
        )}

        {/* Tips */}
        {!videoUri && (
          <View style={styles.tipsBar}>
            <Ionicons name="bulb-outline" size={16} color="#FFD700" />
            <Text style={styles.tipText}>
              Record a 15-60 second video explaining your new workout!
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
  },
  workoutInfo: {
    alignItems: 'center',
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  workoutSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  countdownContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  countdownText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: 'white',
    textShadow: '0px 2px 10px rgba(0, 0, 0, 0.75)',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 8,
  },
  recordingTime: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  controls: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -50 }],
  },
  flipButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 25,
    marginBottom: 20,
  },
  overlayToggle: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 25,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 5,
  },
  recordButtonInner: {
    flex: 1,
    borderRadius: 35,
    backgroundColor: '#FF6B35',
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 20,
  },
  stopButtonInner: {
    flex: 1,
    borderRadius: 5,
    backgroundColor: '#FF0000',
  },
  promptsContainer: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  promptChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
  },
  promptText: {
    color: 'white',
    fontSize: 12,
  },
  previewContainer: {
    flex: 1,
  },
  video: {
    flex: 1,
  },
  previewControls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  previewButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareButton: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  previewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  noPermission: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noPermissionText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  requestPermissionButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  requestPermissionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  tipText: {
    flex: 1,
    color: '#999',
    fontSize: 12,
  },
});