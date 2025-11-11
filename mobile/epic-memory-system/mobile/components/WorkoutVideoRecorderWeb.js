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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function WorkoutVideoRecorderWeb({ 
  visible, 
  workout, 
  onClose, 
  onSave,
  onShare 
}) {
  const [hasPermission, setHasPermission] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [narrationStep, setNarrationStep] = useState(0);
  const [facingMode, setFacingMode] = useState('user'); // 'user' for front, 'environment' for back
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingTimer = useRef(null);
  const narrationTimer = useRef(null);

  // Narration prompts based on workout
  const narrationPrompts = [
    { time: 0, text: "Introduce yourself and your fitness journey" },
    { time: 5, text: `Today's workout: ${workout?.title || 'Custom Workout'}` },
    { time: 10, text: "Share your main fitness goals" },
    { time: 15, text: `This is a ${workout?.duration || '4-week'} program` },
    { time: 20, text: "Explain what makes this workout special" },
    { time: 25, text: "Share tips for beginners" },
    { time: 30, text: "Talk about your favorite exercise" },
    { time: 35, text: "Mention the equipment needed" },
    { time: 40, text: "Share your motivation tips" },
    { time: 45, text: "Wrap up with encouragement" },
  ];

  useEffect(() => {
    if (visible && Platform.OS === 'web') {
      requestPermissions();
    }
    return () => {
      stopCamera();
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
      if (narrationTimer.current) {
        clearInterval(narrationTimer.current);
      }
    };
  }, [visible]);

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode }, 
        audio: true 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
      setCameraActive(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setHasPermission(false);
      Alert.alert(
        'Camera Access Required',
        'Please allow camera and microphone access to record videos.',
        [{ text: 'OK' }]
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const switchCamera = async () => {
    stopCamera();
    setFacingMode(current => current === 'user' ? 'environment' : 'user');
    setTimeout(() => requestPermissions(), 100);
  };

  const startCountdown = () => {
    let count = 3;
    setCountdown(count);
    
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        setCountdown(null);
        clearInterval(countdownInterval);
        startRecording();
      }
    }, 1000);
  };

  const startRecording = async () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setIsRecording(true);
    setRecordingTime(0);
    setNarrationStep(0);
    
    // Start recording timer
    recordingTimer.current = setInterval(() => {
      setRecordingTime(prev => {
        const newTime = prev + 1;
        // Update narration prompts
        const currentPrompt = narrationPrompts.findIndex(p => p.time === newTime);
        if (currentPrompt !== -1) {
          setNarrationStep(currentPrompt);
        }
        // Stop at 60 seconds
        if (newTime >= 60) {
          stopRecording();
        }
        return newTime;
      });
    }, 1000);

    // Setup MediaRecorder
    const options = {
      mimeType: 'video/webm;codecs=vp8,opus'
    };
    
    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        const url = URL.createObjectURL(blob);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = url;
          videoRef.current.controls = true;
        }
      };
      
      mediaRecorderRef.current.start(100); // Collect data every 100ms
    } catch (err) {
      console.error('Error starting recording:', err);
      Alert.alert('Recording Error', 'Unable to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopCamera();
      
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    }
  };

  const saveVideo = () => {
    if (videoBlob) {
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workout_${Date.now()}.webm`;
      a.click();
      Alert.alert('Success', 'Video saved to your downloads!');
      onSave?.(videoBlob);
    }
  };

  const shareVideo = () => {
    if (videoBlob && onShare) {
      onShare(videoBlob, workout);
    }
  };

  const retakeVideo = () => {
    setVideoBlob(null);
    setRecordingTime(0);
    setNarrationStep(0);
    requestPermissions();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCamera = () => (
    <View style={styles.cameraContainer}>
      <video
        ref={videoRef}
        style={styles.video}
        autoPlay
        playsInline
        muted={!videoBlob}
      />
      
      {/* Workout Overlay */}
      {showOverlay && !videoBlob && (
        <View style={styles.overlay}>
          <BlurView intensity={80} tint="dark" style={styles.overlayContent}>
            <Text style={styles.workoutTitle}>{workout?.title || 'Custom Workout'}</Text>
            <Text style={styles.workoutSubtitle}>
              {workout?.duration} • {workout?.difficulty}
            </Text>
          </BlurView>
        </View>
      )}

      {/* Narration Prompts */}
      {isRecording && (
        <View style={styles.narrationOverlay}>
          <View style={styles.narrationCard}>
            <Text style={styles.narrationLabel}>Talk about:</Text>
            <Text style={styles.narrationText}>
              {narrationPrompts[narrationStep]?.text || "Share your thoughts!"}
            </Text>
            <View style={styles.nextPromptContainer}>
              <Text style={styles.nextPromptLabel}>Next in {5 - (recordingTime % 5)}s:</Text>
              <Text style={styles.nextPromptText}>
                {narrationPrompts[narrationStep + 1]?.text || "Wrap up your video"}
              </Text>
            </View>
          </View>
        </View>
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
      {cameraActive && !isRecording && !videoBlob && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={switchCamera}
          >
            <Ionicons name="camera-reverse" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowOverlay(!showOverlay)}
          >
            <Ionicons 
              name={showOverlay ? "eye" : "eye-off"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Record/Stop button */}
      {cameraActive && !videoBlob && (
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
      )}

      {/* Preview controls */}
      {videoBlob && (
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
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Your Workout Story</Text>
          <View style={{ width: 30 }} />
        </View>

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
        ) : (
          renderCamera()
        )}

        {!videoBlob && (
          <View style={styles.tipsBar}>
            <Ionicons name="bulb-outline" size={16} color="#FFD700" />
            <Text style={styles.tipText}>
              Follow the prompts to create an engaging workout video!
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
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
  },
  overlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  overlayContent: {
    padding: 15,
    borderRadius: 10,
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
  narrationOverlay: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    zIndex: 15,
  },
  narrationCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  narrationLabel: {
    fontSize: 12,
    color: '#FF6B35',
    marginBottom: 4,
    fontWeight: '600',
  },
  narrationText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  nextPromptContainer: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 8,
  },
  nextPromptLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  nextPromptText: {
    fontSize: 13,
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
    zIndex: 100,
  },
  countdownText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: 'white',
    textShadow: '0px 2px 10px rgba(0, 0, 0, 0.75)',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 20,
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
    zIndex: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 25,
    marginBottom: 20,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    zIndex: 20,
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
  previewControls: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 20,
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