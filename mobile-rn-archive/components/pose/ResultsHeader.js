/**
 * ResultsHeader - Header component for pose analysis results screen
 * Displays exercise name, score, and navigation/action buttons
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

export default function ResultsHeader({
  exerciseName,
  overallScore,
  onBackPress,
  onHomePress,
  onSharePress,
  onExportPress,
  navigation
}) {
  const themeContext = useTheme();
  const { colors: themeColors = {}, isDarkMode } = themeContext;
  const theme = themeColors;

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onBackPress || (() => navigation?.goBack?.())}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <BlurView intensity={20} style={styles.iconButtonBlur}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDarkMode ? '#FFFFFF' : '#000000'}
            />
          </BlurView>
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={[styles.exerciseName, { color: theme.text }]}>
            {exerciseName}
          </Text>
          {overallScore !== undefined && (
            <View style={styles.scoreContainer}>
              <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>
                Score:
              </Text>
              <Text style={[styles.scoreValue, { color: getScoreColor(overallScore) }]}>
                {overallScore}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          {onSharePress && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onSharePress}
              accessibilityLabel="Share results"
              accessibilityRole="button"
            >
              <BlurView intensity={20} style={styles.iconButtonBlur}>
                <Ionicons
                  name="share-outline"
                  size={22}
                  color={isDarkMode ? '#FFFFFF' : '#000000'}
                />
              </BlurView>
            </TouchableOpacity>
          )}

          {onExportPress && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onExportPress}
              accessibilityLabel="Export results"
              accessibilityRole="button"
            >
              <BlurView intensity={20} style={styles.iconButtonBlur}>
                <Ionicons
                  name="download-outline"
                  size={22}
                  color={isDarkMode ? '#FFFFFF' : '#000000'}
                />
              </BlurView>
            </TouchableOpacity>
          )}

          {onHomePress && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onHomePress}
              accessibilityLabel="Go to home"
              accessibilityRole="button"
            >
              <BlurView intensity={20} style={styles.iconButtonBlur}>
                <Ionicons
                  name="home-outline"
                  size={22}
                  color={isDarkMode ? '#FFFFFF' : '#000000'}
                />
              </BlurView>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  iconButtonBlur: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
});
