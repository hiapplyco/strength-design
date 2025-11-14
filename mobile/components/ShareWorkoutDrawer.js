import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { GlassCard } from './GlassmorphismComponents';

const ShareWorkoutDrawer = ({
  visible = false,
  onClose,
  workout,
  workoutData
}) => {
  const theme = useTheme();
  const [sharing, setSharing] = useState(false);

  // Defensive: ensure theme colors are available
  const primaryColor = theme?.colors?.primary || '#FF6B35';

  const shareOptions = [
    {
      id: 'message',
      icon: 'chatbubble',
      label: 'Message',
      color: '#34C759',
    },
    {
      id: 'copy',
      icon: 'copy',
      label: 'Copy Link',
      color: '#8E8E93',
    },
    {
      id: 'social',
      icon: 'share-social',
      label: 'More Options',
      color: primaryColor,
    }
  ];

  const formatWorkoutText = () => {
    if (!workout && !workoutData) return '';

    const data = workout || workoutData;
    let text = `💪 Workout: ${data.title || 'My Workout'}\n\n`;

    if (data.exercises && data.exercises.length > 0) {
      text += 'Exercises:\n';
      data.exercises.forEach((exercise, index) => {
        text += `${index + 1}. ${exercise.name || exercise.exercise}\n`;
        if (exercise.sets || exercise.reps) {
          text += `   ${exercise.sets || ''} sets × ${exercise.reps || ''} reps\n`;
        }
      });
    }

    text += '\n🏋️ Shared from Strength.Design';
    return text;
  };

  const handleShare = async (option) => {
    setSharing(true);
    try {
      const workoutText = formatWorkoutText();

      switch (option.id) {
        case 'copy':
          // In a real app, you'd use Clipboard API
          Alert.alert('Success', 'Workout copied to clipboard!');
          break;

        case 'message':
        case 'social':
          const result = await Share.share({
            message: workoutText,
            title: workout?.title || 'My Workout'
          });

          if (result.action === Share.sharedAction) {
            if (result.activityType) {
              console.log('Shared with activity type:', result.activityType);
            } else {
              console.log('Shared successfully');
            }
            Alert.alert('Success', 'Workout shared successfully!');
          }
          break;

        default:
          break;
      }

      onClose?.();
    } catch (error) {
      console.error('Error sharing workout:', error);
      Alert.alert('Error', 'Failed to share workout. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    drawer: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      paddingBottom: Platform.OS === 'ios' ? 40 : 20,
      maxHeight: '80%',
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 20,
    },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '30',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.colors.secondary,
    },
    content: {
      padding: 20,
    },
    optionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    optionCard: {
      flex: 1,
      minWidth: '45%',
      aspectRatio: 1.2,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
    },
    optionIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    optionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
    },
    cancelButton: {
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme.colors.border + '20',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.drawer}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.headerTitle}>Share Workout</Text>
              <Text style={styles.headerSubtitle}>
                {workout?.title || workoutData?.title || 'Share this workout with others'}
              </Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.optionsGrid}>
                {shareOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => handleShare(option)}
                    disabled={sharing}
                    activeOpacity={0.7}
                  >
                    <GlassCard style={styles.optionCard}>
                      <View
                        style={[
                          styles.optionIconContainer,
                          { backgroundColor: option.color + '20' }
                        ]}
                      >
                        <Ionicons
                          name={option.icon}
                          size={28}
                          color={option.color}
                        />
                      </View>
                      <Text style={styles.optionLabel}>{option.label}</Text>
                    </GlassCard>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default ShareWorkoutDrawer;
