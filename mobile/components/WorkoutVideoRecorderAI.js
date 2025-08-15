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
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function WorkoutVideoRecorderAI({ 
  visible, 
  workout, 
  onClose, 
  onSave,
  onShare 
}) {
  const [hasPermission, setHasPermission] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [narrationSegments, setNarrationSegments] = useState([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isGeneratingNarration, setIsGeneratingNarration] = useState(false);
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [narrationTone, setNarrationTone] = useState('motivational');
  const [facingMode, setFacingMode] = useState('user');
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingTimer = useRef(null);

  useEffect(() => {
    if (visible && Platform.OS === 'web') {
      generateNarration();
    }
    return () => {
      stopCamera();
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, [visible]);

  useEffect(() => {
    // Update current segment based on recording time
    if (narrationSegments.length > 0 && !isPaused) {
      const currentSegment = narrationSegments.findIndex(
        segment => segment.time <= recordingTime && 
                  (narrationSegments[narrationSegments.indexOf(segment) + 1]?.time > recordingTime || 
                   narrationSegments.indexOf(segment) === narrationSegments.length - 1)
      );
      if (currentSegment !== -1) {
        setCurrentSegmentIndex(currentSegment);
      }
    }
  }, [recordingTime, narrationSegments, isPaused]);

  const generateNarration = async (regenerateWithPrompt = null) => {
    setIsGeneratingNarration(true);
    
    try {
      const requestBody = {
        workout: workout || {
          title: 'Custom Workout',
          duration: '4 weeks',
          difficulty: 'intermediate'
        },
        tone: narrationTone,
      };

      if (regenerateWithPrompt || customPrompt) {
        requestBody.customPrompt = regenerateWithPrompt || customPrompt;
      }

      const response = await fetch('https://us-central1-strength-design.cloudfunctions.net/generateVideoNarration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (data.success && data.narration) {
        setNarrationSegments(data.narration);
      } else {
        // Use fallback narration
        setNarrationSegments(getDefaultNarration());
      }
    } catch (error) {
      console.error('Error generating narration:', error);
      // Use fallback narration
      setNarrationSegments(getDefaultNarration());
    } finally {
      setIsGeneratingNarration(false);
      setShowCustomPrompt(false);
    }
  };

  const getDefaultNarration = () => [
    { time: 0, text: "Hey fitness fam! Check out this amazing workout!", emotion: "excited" },
    { time: 5, text: `${workout?.title || 'This workout'} will transform your fitness!`, emotion: "energetic" },
    { time: 10, text: "I've been following this program consistently", emotion: "informative" },
    { time: 15, text: "The results have been incredible!", emotion: "motivational" },
    { time: 20, text: "It targets all the right muscle groups", emotion: "informative" },
    { time: 25, text: "Perfect for any fitness level", emotion: "encouraging" },
    { time: 30, text: "You can do this at home or gym", emotion: "informative" },
    { time: 35, text: "The progressive overload is built in", emotion: "educational" },
    { time: 40, text: "Join me on this fitness journey", emotion: "inspiring" },
    { time: 45, text: "Your future self will thank you", emotion: "motivational" },
    { time: 50, text: "Save this workout for later!", emotion: "energetic" },
    { time: 55, text: "Drop a comment if you're ready to start!", emotion: "excited" }
  ];

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
    if (narrationSegments.length === 0) {
      Alert.alert('Generating Script', 'Please wait while we create your narration...');
      return;
    }
    
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
    if (!streamRef.current) {
      await requestPermissions();
      if (!streamRef.current) return;
    }

    chunksRef.current = [];
    setIsRecording(true);
    setRecordingTime(0);
    setCurrentSegmentIndex(0);
    setIsPaused(false);
    
    // Start recording timer
    recordingTimer.current = setInterval(() => {
      if (!isPaused) {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Stop at 60 seconds
          if (newTime >= 60) {
            stopRecording();
          }
          return newTime;
        });
      }
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
      
      mediaRecorderRef.current.start(100);
    } catch (err) {
      console.error('Error starting recording:', err);
      Alert.alert('Recording Error', 'Unable to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
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
    setCurrentSegmentIndex(0);
    requestPermissions();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEmotionColor = (emotion) => {
    switch(emotion) {
      case 'excited': return '#FFD700';
      case 'energetic': return '#FF6B35';
      case 'motivational': return '#4CAF50';
      case 'informative': return '#2196F3';
      case 'inspiring': return '#9C27B0';
      default: return '#FF6B35';
    }
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

      {/* AI Narration Display */}
      {isRecording && narrationSegments.length > 0 && !isPaused && (
        <View style={styles.narrationOverlay}>
          <View style={[
            styles.narrationCard,
            { borderColor: getEmotionColor(narrationSegments[currentSegmentIndex]?.emotion) }
          ]}>
            <View style={styles.narrationHeader}>
              <Text style={styles.narrationLabel}>
                {isPaused ? 'PAUSED' : 'READ THIS:'}
              </Text>
              <TouchableOpacity
                onPress={() => isPaused ? resumeRecording() : pauseRecording()}
                style={styles.pauseButton}
              >
                <Ionicons 
                  name={isPaused ? "play" : "pause"} 
                  size={16} 
                  color="white" 
                />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.narrationText}>
              {narrationSegments[currentSegmentIndex]?.text || "Keep going!"}
            </Text>
            
            {currentSegmentIndex < narrationSegments.length - 1 && (
              <View style={styles.nextPromptContainer}>
                <Text style={styles.nextPromptLabel}>
                  Coming up ({narrationSegments[currentSegmentIndex + 1]?.time}s):
                </Text>
                <Text style={styles.nextPromptText}>
                  {narrationSegments[currentSegmentIndex + 1]?.text}
                </Text>
              </View>
            )}
            
            <View style={styles.narrationControls}>
              <TouchableOpacity
                style={styles.narrationButton}
                onPress={() => setShowCustomPrompt(true)}
              >
                <Ionicons name="refresh" size={14} color="#FF6B35" />
                <Text style={styles.narrationButtonText}>Regenerate</Text>
              </TouchableOpacity>
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
          <View style={[styles.recordingDot, isPaused && styles.recordingDotPaused]} />
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
              disabled={isGeneratingNarration}
            >
              {isGeneratingNarration ? (
                <ActivityIndicator color="#FF6B35" />
              ) : (
                <View style={styles.recordButtonInner} />
              )}
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
          <Text style={styles.headerTitle}>AI-Powered Video Creator</Text>
          <TouchableOpacity 
            onPress={() => setShowCustomPrompt(true)}
            style={styles.settingsButton}
          >
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
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
        ) : hasPermission === null && !isGeneratingNarration ? (
          <TouchableOpacity onPress={requestPermissions} style={styles.startButton}>
            <LinearGradient
              colors={['#FF6B35', '#F7931E']}
              style={styles.startButtonGradient}
            >
              <Ionicons name="videocam" size={32} color="white" />
              <Text style={styles.startButtonText}>Start Recording</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          renderCamera()
        )}

        {isGeneratingNarration && (
          <View style={styles.generatingOverlay}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.generatingText}>Creating your personalized script...</Text>
          </View>
        )}

        {!videoBlob && (
          <View style={styles.tipsBar}>
            <Ionicons name="sparkles" size={16} color="#FFD700" />
            <Text style={styles.tipText}>
              AI generates a custom script based on your workout!
            </Text>
          </View>
        )}

        {/* Custom Prompt Modal */}
        <Modal
          visible={showCustomPrompt}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.promptModalOverlay}>
            <View style={styles.promptModalContent}>
              <Text style={styles.promptModalTitle}>Customize Your Script</Text>
              
              <Text style={styles.promptLabel}>Tone:</Text>
              <ScrollView horizontal style={styles.toneSelector}>
                {['motivational', 'educational', 'energetic', 'casual', 'professional'].map(tone => (
                  <TouchableOpacity
                    key={tone}
                    style={[
                      styles.toneButton,
                      narrationTone === tone && styles.toneButtonActive
                    ]}
                    onPress={() => setNarrationTone(tone)}
                  >
                    <Text style={[
                      styles.toneButtonText,
                      narrationTone === tone && styles.toneButtonTextActive
                    ]}>
                      {tone}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.promptLabel}>Custom Instructions:</Text>
              <TextInput
                style={styles.promptInput}
                placeholder="E.g., Focus on beginners, mention home equipment, add humor..."
                placeholderTextColor="#666"
                value={customPrompt}
                onChangeText={setCustomPrompt}
                multiline
              />

              <View style={styles.promptModalButtons}>
                <TouchableOpacity
                  style={styles.promptCancelButton}
                  onPress={() => setShowCustomPrompt(false)}
                >
                  <Text style={styles.promptCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.promptGenerateButton}
                  onPress={() => generateNarration(customPrompt)}
                >
                  <LinearGradient
                    colors={['#FF6B35', '#F7931E']}
                    style={styles.promptGenerateGradient}
                  >
                    <Text style={styles.promptGenerateText}>Generate</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  settingsButton: {
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
  },
  narrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  narrationLabel: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
  },
  pauseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 6,
    borderRadius: 12,
  },
  narrationText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 28,
  },
  nextPromptContainer: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 8,
    marginBottom: 8,
  },
  nextPromptLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  nextPromptText: {
    fontSize: 14,
    color: '#999',
  },
  narrationControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  narrationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  narrationButtonText: {
    fontSize: 12,
    color: '#FF6B35',
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
  recordingDotPaused: {
    backgroundColor: '#FFD700',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonInner: {
    width: 70,
    height: 70,
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
  startButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 30,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  generatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  generatingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
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
  promptModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  promptModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
  },
  promptModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  promptLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  toneSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  toneButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  toneButtonActive: {
    backgroundColor: '#FF6B35',
  },
  toneButtonText: {
    color: '#999',
    fontSize: 14,
  },
  toneButtonTextActive: {
    color: 'white',
  },
  promptInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    fontSize: 14,
    minHeight: 100,
    marginBottom: 20,
  },
  promptModalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  promptCancelButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  promptCancelText: {
    color: '#999',
    fontSize: 16,
  },
  promptGenerateButton: {
    flex: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  promptGenerateGradient: {
    padding: 15,
    alignItems: 'center',
  },
  promptGenerateText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});