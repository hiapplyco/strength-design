import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import workoutSharing from '../utils/workoutSharing';

export default function ShareWorkoutModal({ workout, visible, onClose }) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [shareStats, setShareStats] = useState(null);

  const handleShare = async (method) => {
    setLoading(true);
    try {
      const result = await workoutSharing.shareWorkout(workout, method);
      
      if (result.success) {
        if (result.shareUrl) {
          setShareUrl(result.shareUrl);
        }
        
        // Show success feedback
        if (method !== 'link') {
          Alert.alert(
            '✅ Shared!',
            'Your workout has been shared successfully.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    setLoading(true);
    try {
      const result = await workoutSharing.copyToClipboard(workout);
      if (result.success) {
        setShareUrl(result.shareUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link.');
    } finally {
      setLoading(false);
    }
  };

  const ShareOption = ({ icon, title, subtitle, onPress, color = '#FF6B35' }) => (
    <TouchableOpacity
      style={styles.shareOption}
      onPress={onPress}
      disabled={loading}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.optionContent}>
        <Text style={styles.optionTitle}>{title}</Text>
        {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Share Workout</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.content}>
            {/* Workout Preview */}
            <View style={styles.workoutPreview}>
              <Text style={styles.workoutTitle}>{workout.title}</Text>
              {workout.summary && (
                <Text style={styles.workoutSummary} numberOfLines={2}>
                  {workout.summary}
                </Text>
              )}
              <View style={styles.workoutMeta}>
                {workout.duration && (
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#666" />
                    <Text style={styles.metaText}>{workout.duration}</Text>
                  </View>
                )}
                {workout.difficulty && (
                  <View style={styles.metaItem}>
                    <Ionicons name="fitness-outline" size={14} color="#666" />
                    <Text style={styles.metaText}>{workout.difficulty}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Share Options */}
            <View style={styles.shareOptions}>
              <ShareOption
                icon="share-social-outline"
                title="Share Link"
                subtitle="Share via apps and social media"
                onPress={() => handleShare('link')}
              />
              
              <ShareOption
                icon="copy-outline"
                title="Copy Link"
                subtitle="Copy shareable link to clipboard"
                onPress={handleCopyLink}
                color="#9C27B0"
              />
              
              <ShareOption
                icon="document-text-outline"
                title="Share as Text"
                subtitle="Share workout details as plain text"
                onPress={() => handleShare('text')}
                color="#4CAF50"
              />
              
              <ShareOption
                icon="download-outline"
                title="Export as File"
                subtitle="Save and share as JSON file"
                onPress={() => handleShare('file')}
                color="#2196F3"
              />
            </View>

            {/* Share URL Display */}
            {shareUrl && (
              <View style={styles.urlContainer}>
                <Text style={styles.urlLabel}>Share URL:</Text>
                <View style={styles.urlBox}>
                  <Text style={styles.urlText} numberOfLines={1}>
                    {shareUrl}
                  </Text>
                  <TouchableOpacity
                    onPress={handleCopyLink}
                    style={styles.copyButton}
                  >
                    <Ionicons name="copy" size={16} color="#FF6B35" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Share Stats */}
            {shareStats && (
              <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>Share Statistics</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{shareStats.viewCount}</Text>
                    <Text style={styles.statLabel}>Views</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{shareStats.downloads}</Text>
                    <Text style={styles.statLabel}>Downloads</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Privacy Note */}
            <View style={styles.privacyNote}>
              <Ionicons name="lock-closed-outline" size={16} color="#666" />
              <Text style={styles.privacyText}>
                Shared workouts can be viewed by anyone with the link. 
                Personal information is not included.
              </Text>
            </View>
          </ScrollView>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FF6B35" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  workoutPreview: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  workoutSummary: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
    lineHeight: 20,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    color: '#666',
    fontSize: 12,
  },
  shareOptions: {
    marginBottom: 20,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
    marginLeft: 15,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  urlContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  urlLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  urlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 10,
    borderRadius: 5,
  },
  urlText: {
    flex: 1,
    color: '#FF6B35',
    fontSize: 13,
  },
  copyButton: {
    padding: 5,
  },
  statsContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});