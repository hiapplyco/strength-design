/**
 * Results Header Component
 * Cohesive header for pose analysis results screen with navigation and actions
 * 
 * Features:
 * - Clean navigation with back button and home link
 * - Exercise identification and context
 * - Action buttons for export/share functionality
 * - Glassmorphism design system integration
 * - Accessibility compliant controls
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GlassContainer } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';

const ResultsHeader = memo(({ 
  exerciseName = 'Unknown Exercise',
  overallScore = 0,
  onBackPress,
  onHomePress,
  onSharePress,
  onExportPress,
  navigation 
}) => {
  const { theme, isDarkMode } = useTheme();

  // Get score-based display information
  const getScoreInfo = (score) => {
    if (score >= 85) return { label: 'Excellent', color: '#4CAF50', icon: 'trophy' };
    if (score >= 70) return { label: 'Good', color: '#FF9800', icon: 'ribbon' };
    if (score >= 50) return { label: 'Fair', color: '#FF6B35', icon: 'medal' };
    return { label: 'Needs Work', color: '#FF6B6B', icon: 'fitness' };
  };

  const scoreInfo = getScoreInfo(overallScore);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  const handleHomePress = () => {
    if (onHomePress) {
      onHomePress();
    } else if (navigation) {
      navigation.navigate('Home');
    }
  };

  return (
    <View style={styles.container}>
      {/* Navigation Row */}
      <View style={styles.navigationRow}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleBackPress}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <BlurView intensity={20} style={styles.navButtonBlur}>
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isDarkMode ? '#FFFFFF' : '#000000'} 
            />
          </BlurView>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleHomePress}
          accessibilityLabel="Go home"
          accessibilityRole="button"
        >
          <BlurView intensity={20} style={styles.navButtonBlur}>
            <Ionicons 
              name="home" 
              size={24} 
              color={isDarkMode ? '#FFFFFF' : '#000000'} 
            />
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* Title and Context */}
      <GlassContainer variant="medium" style={styles.titleContainer}>
        <View style={styles.titleRow}>
          <View style={styles.titleContent}>
            <Text style={[styles.title, { color: theme.text }]}>
              Analysis Results
            </Text>
            <View style={styles.exerciseInfo}>
              <Ionicons 
                name={scoreInfo.icon} 
                size={16} 
                color={scoreInfo.color} 
                style={styles.exerciseIcon}
              />
              <Text style={[styles.exerciseName, { color: theme.textSecondary }]}>
                {exerciseName}
              </Text>
              <View style={[styles.scoreBadge, { backgroundColor: scoreInfo.color }]}>
                <Text style={styles.scoreBadgeText}>
                  {Math.round(overallScore)}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {onSharePress && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onSharePress}
                accessibilityLabel="Share results"
                accessibilityRole="button"
              >
                <BlurView intensity={15} style={styles.actionButtonBlur}>
                  <Ionicons name="share-outline" size={20} color={theme.textSecondary} />
                </BlurView>
              </TouchableOpacity>
            )}
            
            {onExportPress && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onExportPress}
                accessibilityLabel="Export results"
                accessibilityRole="button"
              >
                <BlurView intensity={15} style={styles.actionButtonBlur}>
                  <Ionicons name="download-outline" size={20} color={theme.textSecondary} />
                </BlurView>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Quick Status Indicator */}
        <View style={styles.statusRow}>
          <View style={[styles.statusIndicator, { backgroundColor: scoreInfo.color }]} />
          <Text style={[styles.statusText, { color: theme.textSecondary }]}>
            {scoreInfo.label} form analysis completed
          </Text>
        </View>
      </GlassContainer>
    </View>
  );
});

ResultsHeader.displayName = 'ResultsHeader';

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  navButtonBlur: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseIcon: {
    marginRight: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonBlur: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ResultsHeader;