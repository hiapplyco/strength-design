/**
 * ExportResultsModal - Modal for exporting pose analysis results
 * Provides options to save, share, or export analysis data
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Share,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GlassContainer } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';

const EXPORT_OPTIONS = [
  {
    id: 'history',
    title: 'Save to History',
    description: 'Save this analysis to your workout history',
    icon: 'save-outline',
    color: '#10B981',
  },
  {
    id: 'social-share',
    title: 'Share Results',
    description: 'Share your progress on social media',
    icon: 'share-social-outline',
    color: '#3B82F6',
  },
  {
    id: 'pdf',
    title: 'Export as PDF',
    description: 'Generate a detailed PDF report',
    icon: 'document-text-outline',
    color: '#F59E0B',
    premium: true,
  },
  {
    id: 'video',
    title: 'Export Video',
    description: 'Save video with overlay annotations',
    icon: 'videocam-outline',
    color: '#8B5CF6',
    premium: true,
  },
  {
    id: 'data',
    title: 'Export Data',
    description: 'Download raw analysis data (JSON)',
    icon: 'code-download-outline',
    color: '#6366F1',
  },
];

export default function ExportResultsModal({
  visible,
  onClose,
  analysisResult,
  exerciseName,
  videoUri,
  onExport
}) {
  const themeContext = useTheme();
  const { colors: themeColors = {} } = themeContext;
  const theme = themeColors;
  const [selectedOption, setSelectedOption] = useState(null);

  const handleExport = async (option) => {
    if (option.premium) {
      Alert.alert(
        'Premium Feature',
        `${option.title} requires a premium subscription. Upgrade to unlock this feature.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => console.log('Navigate to upgrade') }
        ]
      );
      return;
    }

    setSelectedOption(option.id);

    if (option.id === 'social-share') {
      try {
        const message = `Check out my ${exerciseName} form analysis!\n\nScore: ${analysisResult?.analysis?.overallScore || 0}%\n\nImproving my fitness form with AI-powered analysis.`;
        await Share.share({
          message,
          title: `${exerciseName} Analysis`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else if (option.id === 'history') {
      Alert.alert('Saved', 'Analysis saved to your history!');
    }

    if (onExport) {
      onExport(option.id, {
        analysisResult,
        exerciseName,
        videoUri,
        timestamp: new Date().toISOString(),
      });
    }

    setSelectedOption(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={styles.overlay}>
        <View style={styles.modalContainer}>
          <GlassContainer variant="strong" style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>
                Export Results
              </Text>
              <TouchableOpacity
                onPress={onClose}
                accessibilityLabel="Close modal"
                accessibilityRole="button"
              >
                <Ionicons
                  name="close"
                  size={28}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Export Options */}
            <View style={styles.optionsContainer}>
              {EXPORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.optionButton}
                  onPress={() => handleExport(option)}
                  disabled={selectedOption === option.id}
                >
                  <GlassContainer
                    variant="subtle"
                    style={[
                      styles.optionCard,
                      selectedOption === option.id && styles.optionCardActive
                    ]}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                      <Ionicons name={option.icon} size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.optionContent}>
                      <View style={styles.optionHeader}>
                        <Text style={[styles.optionTitle, { color: theme.text }]}>
                          {option.title}
                        </Text>
                        {option.premium && (
                          <View style={[styles.premiumBadge, { backgroundColor: theme.primary }]}>
                            <Ionicons name="star" size={12} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                      <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                        {option.description}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={theme.textSecondary}
                    />
                  </GlassContainer>
                </TouchableOpacity>
              ))}
            </View>
          </GlassContainer>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
  },
  modal: {
    padding: 24,
    borderRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    width: '100%',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  optionCardActive: {
    opacity: 0.5,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  premiumBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
});
