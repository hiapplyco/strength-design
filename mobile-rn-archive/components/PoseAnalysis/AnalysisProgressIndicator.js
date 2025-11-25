import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const AnalysisProgressIndicator = ({
  stage = 'uploading',
  progress = 0,
  message = 'Processing...',
  isComplete = false,
  hasError = false
}) => {
  const theme = useTheme();

  // Defensive: ensure colors are available, fallback to defaults
  const primaryColor = theme?.colors?.primary || '#FF6B35';
  const successColor = theme?.colors?.success || '#34C759';
  const errorColor = theme?.colors?.error || '#FF3B30';

  const stages = {
    uploading: { icon: 'cloud-upload', label: 'Uploading', color: primaryColor },
    processing: { icon: 'cog', label: 'Processing', color: primaryColor },
    analyzing: { icon: 'analytics', label: 'Analyzing', color: primaryColor },
    complete: { icon: 'checkmark-circle', label: 'Complete', color: successColor },
    error: { icon: 'alert-circle', label: 'Error', color: errorColor }
  };

  const currentStage = hasError ? stages.error : (isComplete ? stages.complete : stages[stage] || stages.processing);

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: currentStage.color + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    progressRing: {
      position: 'absolute',
      width: 88,
      height: 88,
      borderRadius: 44,
      borderWidth: 3,
      borderColor: currentStage.color + '30',
    },
    label: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    message: {
      fontSize: 14,
      color: theme.colors.secondary,
      textAlign: 'center',
      maxWidth: 300,
    },
    progressBar: {
      width: 200,
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      marginTop: 16,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: currentStage.color,
      borderRadius: 2,
    },
    percentage: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.secondary,
      marginTop: 8,
    },
  });

  return (
    <View style={styles.container}>
      <View>
        {!isComplete && !hasError && (
          <View style={styles.progressRing} />
        )}
        <View style={styles.iconContainer}>
          {!isComplete && !hasError ? (
            <ActivityIndicator size="large" color={currentStage.color} />
          ) : (
            <Ionicons name={currentStage.icon} size={40} color={currentStage.color} />
          )}
        </View>
      </View>

      <Text style={styles.label}>{currentStage.label}</Text>
      <Text style={styles.message}>{message}</Text>

      {!isComplete && !hasError && progress > 0 && (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          <Text style={styles.percentage}>{Math.round(progress)}%</Text>
        </>
      )}
    </View>
  );
};

export default AnalysisProgressIndicator;