import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

export default function WorkoutActionBar({ 
  visible, 
  workout, 
  onSave,
  onSchedule,
  onShare,
  onStartWorkout,
  onRecord,
  isSaved = false,
  isScheduled = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: false, // Set to false for web compatibility
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false, // Set to false for web compatibility
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 10,
          useNativeDriver: false, // Set to false for web compatibility
        }),
      ]).start();

      // Auto-expand after a delay
      setTimeout(() => {
        if (!expanded) {
          setExpanded(true);
        }
      }, 1500);
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: false, // Set to false for web compatibility
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false, // Set to false for web compatibility
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    // Rotate animation for expand button
    Animated.timing(rotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // Set to false for web compatibility
    }).start();
  }, [expanded]);

  const handleAction = async (action) => {
    // Haptics only work on native platforms
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Haptics not available
      }
    }
    setSelectedAction(action);
    
    switch (action) {
      case 'save':
        onSave?.();
        break;
      case 'schedule':
        onSchedule?.();
        break;
      case 'share':
        onShare?.();
        break;
      case 'start':
        onStartWorkout?.();
        break;
      case 'record':
        onRecord?.();
        break;
    }
  };

  const ActionButton = ({ icon, label, onPress, primary = false, completed = false, badge = null }) => (
    <TouchableOpacity 
      style={[styles.actionButton, primary && styles.primaryButton]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {primary ? (
        <LinearGradient
          colors={['#FF6B35', '#F7931E']}
          style={styles.primaryGradient}
        >
          <Ionicons name={icon} size={24} color="white" />
          <Text style={styles.primaryButtonText}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.secondaryButton}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={icon} 
              size={20} 
              color={completed ? '#4CAF50' : '#FF6B35'} 
            />
            {completed && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
              </View>
            )}
            {badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.buttonText, completed && styles.completedText]}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const SocialShareButton = ({ platform, icon, color, onPress }) => (
    <TouchableOpacity 
      style={[styles.socialButton, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={20} color="white" />
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
          opacity: fadeAnim,
        }
      ]}
    >
      <BlurView intensity={95} tint="dark" style={styles.blurContainer}>
        {/* Header */}
        <TouchableOpacity 
          style={styles.header}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.8}
        >
          <View style={styles.headerContent}>
            <View style={styles.successIndicator}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.headerTitle}>Workout Ready!</Text>
            </View>
            <Animated.View 
              style={{
                transform: [{
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg']
                  })
                }]
              }}
            >
              <Ionicons name="chevron-up" size={20} color="#999" />
            </Animated.View>
          </View>
          <Text style={styles.headerSubtitle}>
            {workout?.title || 'Your personalized workout plan is ready'}
          </Text>
        </TouchableOpacity>

        {expanded && (
          <Animated.View style={styles.expandedContent}>
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressSteps}>
                <View style={[styles.progressStep, styles.progressStepComplete]}>
                  <Ionicons name="checkmark" size={12} color="white" />
                </View>
                <View style={styles.progressLine} />
                <View style={[
                  styles.progressStep, 
                  isSaved && styles.progressStepComplete
                ]}>
                  {isSaved ? (
                    <Ionicons name="checkmark" size={12} color="white" />
                  ) : (
                    <Text style={styles.progressStepNumber}>2</Text>
                  )}
                </View>
                <View style={styles.progressLine} />
                <View style={[
                  styles.progressStep,
                  isScheduled && styles.progressStepComplete
                ]}>
                  {isScheduled ? (
                    <Ionicons name="checkmark" size={12} color="white" />
                  ) : (
                    <Text style={styles.progressStepNumber}>3</Text>
                  )}
                </View>
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>Created</Text>
                <Text style={styles.progressLabel}>Saved</Text>
                <Text style={styles.progressLabel}>Scheduled</Text>
              </View>
            </View>

            {/* Primary Actions */}
            <View style={styles.primaryActions}>
              {!isSaved ? (
                <ActionButton
                  icon="save-outline"
                  label="Save Workout"
                  onPress={() => handleAction('save')}
                  primary
                />
              ) : !isScheduled ? (
                <ActionButton
                  icon="calendar-outline"
                  label="Schedule"
                  onPress={() => handleAction('schedule')}
                  primary
                />
              ) : (
                <ActionButton
                  icon="play-circle-outline"
                  label="Start Workout"
                  onPress={() => handleAction('start')}
                  primary
                />
              )}
            </View>

            {/* Secondary Actions */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.secondaryActions}
            >
              <ActionButton
                icon="save-outline"
                label="Save"
                onPress={() => handleAction('save')}
                completed={isSaved}
              />
              <ActionButton
                icon="calendar-outline"
                label="Schedule"
                onPress={() => handleAction('schedule')}
                completed={isScheduled}
              />
              <ActionButton
                icon="share-social-outline"
                label="Share"
                onPress={() => handleAction('share')}
              />
              <ActionButton
                icon="videocam-outline"
                label="Record"
                onPress={() => handleAction('record')}
                badge="NEW"
              />
            </ScrollView>

            {/* Social Sharing Section */}
            <View style={styles.socialSection}>
              <Text style={styles.sectionTitle}>Share Your Success</Text>
              <View style={styles.socialButtons}>
                <SocialShareButton
                  platform="instagram"
                  icon="logo-instagram"
                  color="#E4405F"
                  onPress={() => handleAction('share-instagram')}
                />
                <SocialShareButton
                  platform="tiktok"
                  icon="logo-tiktok"
                  color="#000000"
                  onPress={() => handleAction('share-tiktok')}
                />
                <SocialShareButton
                  platform="twitter"
                  icon="logo-twitter"
                  color="#1DA1F2"
                  onPress={() => handleAction('share-twitter')}
                />
                <SocialShareButton
                  platform="facebook"
                  icon="logo-facebook"
                  color="#1877F2"
                  onPress={() => handleAction('share-facebook')}
                />
                <TouchableOpacity 
                  style={styles.recordVideoButton}
                  onPress={() => handleAction('record')}
                >
                  <LinearGradient
                    colors={['#FF6B35', '#F7931E']}
                    style={styles.recordGradient}
                  >
                    <Ionicons name="videocam" size={20} color="white" />
                    <Text style={styles.recordText}>Record Video</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Tips */}
            <View style={styles.tipsSection}>
              <View style={styles.tip}>
                <Ionicons name="bulb-outline" size={16} color="#FFD700" />
                <Text style={styles.tipText}>
                  Record a video explaining your workout to share with friends!
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  blurContainer: {
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  successIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  expandedContent: {
    paddingBottom: 20,
  },
  progressContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressStep: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepComplete: {
    backgroundColor: '#4CAF50',
  },
  progressStepNumber: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  progressLabel: {
    fontSize: 11,
    color: '#666',
  },
  primaryActions: {
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  actionButton: {
    marginHorizontal: 5,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  checkmark: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B35',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 8,
    color: 'white',
    fontWeight: 'bold',
  },
  buttonText: {
    color: '#999',
    fontSize: 12,
  },
  completedText: {
    color: '#4CAF50',
  },
  secondaryActions: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  socialSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordVideoButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  recordGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  recordText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  tipsSection: {
    paddingHorizontal: 20,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
});