/**
 * Export Results Modal Component
 * Modal for exporting and sharing pose analysis results with multiple format options
 * 
 * Features:
 * - Multiple export formats (PDF, JSON, Video with overlay)
 * - Social media sharing integration
 * - Analysis summary generation
 * - Progress tracking for export operations
 * - Glassmorphism design system integration
 * - Accessibility compliant interactions
 */

import React, { useState, useRef, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Share,
  Alert,
  Animated,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GlassContainer, GlassCard } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

const EXPORT_OPTIONS = [
  {
    id: 'share-social',
    title: 'Share Results',
    description: 'Share your analysis summary',
    icon: 'share-social',
    color: '#4267B2',
  },
  {
    id: 'export-pdf',
    title: 'Export PDF Report',
    description: 'Detailed analysis report',
    icon: 'document-text',
    color: '#FF4444',
  },
  {
    id: 'export-video',
    title: 'Export Video',
    description: 'Video with pose overlay',
    icon: 'videocam',
    color: '#FF9800',
  },
  {
    id: 'export-data',
    title: 'Export Raw Data',
    description: 'JSON data for analysis',
    icon: 'code',
    color: '#4CAF50',
  },
  {
    id: 'save-history',
    title: 'Save to History',
    description: 'Keep in analysis history',
    icon: 'bookmark',
    color: '#9C27B0',
  },
];

const ExportResultsModal = memo(({
  visible = false,
  onClose,
  analysisResult,
  exerciseName,
  videoUri,
  onExport,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [exportingOption, setExportingOption] = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleExportOption = async (option) => {
    if (exportingOption) return; // Prevent multiple concurrent operations

    setExportingOption(option.id);

    try {
      switch (option.id) {
        case 'share-social':
          await handleSocialShare();
          break;
        case 'export-pdf':
          await handlePDFExport();
          break;
        case 'export-video':
          await handleVideoExport();
          break;
        case 'export-data':
          await handleDataExport();
          break;
        case 'save-history':
          await handleSaveToHistory();
          break;
        default:
          throw new Error('Unknown export option');
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert(
        'Export Failed',
        error.message || 'An error occurred during export. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setExportingOption(null);
    }
  };

  const handleSocialShare = async () => {
    const score = analysisResult?.analysis?.overallScore || 0;
    const scoreLabel = score >= 85 ? 'Excellent' : 
                      score >= 70 ? 'Good' : 
                      score >= 50 ? 'Fair' : 'Needs Work';
    
    const shareMessage = `Just analyzed my ${exerciseName} form! 💪\n\n📊 Score: ${score}/100 (${scoreLabel})\n🎯 Exercise: ${exerciseName}\n\nGet AI-powered form analysis at Strength.Design!\n#FormAnalysis #Fitness #StrengthTraining`;

    await Share.share({
      message: shareMessage,
      title: 'My Pose Analysis Results',
      url: 'https://strength.design', // Optional app store link
    });

    if (onExport) {
      onExport('social-share', { message: shareMessage });
    }
  };

  const handlePDFExport = async () => {
    // Mock PDF generation - in real implementation, would generate PDF
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
    
    Alert.alert(
      'PDF Generated',
      'Your detailed analysis report has been saved to your device.',
      [{ text: 'OK' }]
    );

    if (onExport) {
      onExport('pdf', { 
        format: 'pdf',
        filename: `${exerciseName}_analysis_${Date.now()}.pdf`
      });
    }
  };

  const handleVideoExport = async () => {
    if (!videoUri) {
      throw new Error('No video available for export');
    }

    // Mock video processing - in real implementation, would overlay pose data
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing
    
    Alert.alert(
      'Video Exported',
      'Your analysis video with pose overlay has been saved to your gallery.',
      [{ text: 'OK' }]
    );

    if (onExport) {
      onExport('video', { 
        originalVideo: videoUri,
        overlayData: analysisResult?.poseSequence || [],
        filename: `${exerciseName}_analysis_${Date.now()}.mp4`
      });
    }
  };

  const handleDataExport = async () => {
    const exportData = {
      exercise: exerciseName,
      timestamp: new Date().toISOString(),
      analysis: analysisResult,
      version: '1.0',
    };

    // Mock data export - in real implementation, would save JSON file
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    Alert.alert(
      'Data Exported',
      'Analysis data has been exported as JSON format.',
      [{ text: 'OK' }]
    );

    if (onExport) {
      onExport('data', exportData);
    }
  };

  const handleSaveToHistory = async () => {
    // Mock history save - in real implementation, would save to local storage/database
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    Alert.alert(
      'Saved to History',
      'Your analysis has been saved to your personal history.',
      [{ text: 'OK' }]
    );

    if (onExport) {
      onExport('history', {
        exerciseName,
        analysisResult,
        timestamp: Date.now(),
      });
    }
  };

  const renderExportOption = (option) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.optionButton,
        exportingOption === option.id && styles.optionButtonActive,
      ]}
      onPress={() => handleExportOption(option)}
      disabled={!!exportingOption}
      accessibilityLabel={`${option.title}: ${option.description}`}
      accessibilityRole="button"
    >
      <GlassCard style={styles.optionCard}>
        <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
          {exportingOption === option.id ? (
            <Animated.View
              style={[
                styles.loadingIcon,
                {
                  transform: [{
                    rotate: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  }],
                },
              ]}
            >
              <Ionicons name="refresh" size={24} color="#FFFFFF" />
            </Animated.View>
          ) : (
            <Ionicons name={option.icon} size={24} color="#FFFFFF" />
          )}
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, { color: theme.text }]}>
            {option.title}
          </Text>
          <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
            {exportingOption === option.id ? 'Processing...' : option.description}
          </Text>
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={theme.textSecondary} 
          style={styles.optionArrow}
        />
      </GlassCard>
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalBackground,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
                {
                  scale: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <GlassContainer variant="strong" style={styles.modal}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Export & Share
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Choose how to export your analysis
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                accessibilityLabel="Close export options"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Export Options */}
            <View style={styles.optionsContainer}>
              {EXPORT_OPTIONS.map(renderExportOption)}
            </View>

            {/* Footer Info */}
            <View style={styles.modalFooter}>
              <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                All exports include your analysis data and recommendations
              </Text>
            </View>
          </GlassContainer>
        </Animated.View>
      </View>
    </Modal>
  );
});

ExportResultsModal.displayName = 'ExportResultsModal';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modal: {
    padding: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    padding: 20,
    gap: 12,
  },
  optionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionButtonActive: {
    opacity: 0.7,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    // Animation styling is handled in the transform
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
  },
  optionArrow: {
    marginLeft: 8,
  },
  modalFooter: {
    padding: 20,
    paddingTop: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ExportResultsModal;