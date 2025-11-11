import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing, borderRadius } from '../utils/designTokens';

/**
 * Production-grade Error Boundary for React Native
 * Catches JavaScript errors anywhere in the component tree
 * Provides user-friendly error UI and recovery options
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  async componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Increment error count
    const errorCount = this.state.errorCount + 1;
    
    // Store error details
    this.setState({
      error,
      errorInfo,
      errorCount,
    });

    // Log to crash reporting service (e.g., Sentry, Crashlytics)
    await this.logErrorToService(error, errorInfo);

    // Save error to local storage for debugging
    await this.saveErrorToStorage(error, errorInfo);

    // If too many errors, suggest app restart
    if (errorCount >= 3) {
      Alert.alert(
        'Multiple Errors Detected',
        'The app is experiencing issues. Would you like to restart?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Restart', onPress: this.handleRestart },
        ]
      );
    }
  }

  async logErrorToService(error, errorInfo) {
    try {
      // In production, this would send to Sentry or similar service
      // For now, we'll just log the structure
      const errorReport = {
        message: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
        version: Updates.manifest?.version || 'unknown',
      };

      // TODO: Integrate with Sentry
      // Sentry.captureException(error, {
      //   contexts: { react: { componentStack: errorInfo.componentStack } }
      // });

      console.log('Error report prepared:', errorReport);
    } catch (reportingError) {
      console.error('Failed to log error:', reportingError);
    }
  }

  async saveErrorToStorage(error, errorInfo) {
    try {
      const errorLog = {
        message: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      };

      // Get existing errors
      const existingErrors = await AsyncStorage.getItem('error_logs');
      const errors = existingErrors ? JSON.parse(existingErrors) : [];
      
      // Add new error (keep only last 10)
      errors.unshift(errorLog);
      if (errors.length > 10) {
        errors.pop();
      }

      await AsyncStorage.setItem('error_logs', JSON.stringify(errors));
    } catch (storageError) {
      console.error('Failed to save error to storage:', storageError);
    }
  }

  handleRestart = async () => {
    try {
      // Clear error state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorCount: 0,
      });

      // In Expo, we can reload the app
      if (Updates.reloadAsync) {
        await Updates.reloadAsync();
      }
    } catch (reloadError) {
      console.error('Failed to restart app:', reloadError);
      Alert.alert(
        'Restart Failed',
        'Please close and reopen the app manually.'
      );
    }
  };

  handleReset = () => {
    // Reset error state without full restart
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReportIssue = () => {
    const subject = encodeURIComponent('Error Report - Strength Design App');
    const body = encodeURIComponent(
      `Error Details:\n\n${this.state.error?.toString()}\n\nStack Trace:\n${this.state.error?.stack}`
    );
    const mailto = `mailto:support@strength.design?subject=${subject}&body=${body}`;
    
    Linking.openURL(mailto).catch(() => {
      Alert.alert(
        'Email Not Available',
        'Please email support@strength.design with the error details.'
      );
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <Ionicons 
                name="warning-outline" 
                size={80} 
                color={colors.warning.DEFAULT} 
              />
            </View>

            {/* Error Title */}
            <Text style={styles.title}>Oops! Something went wrong</Text>
            
            {/* Error Description */}
            <Text style={styles.description}>
              We're sorry, but something unexpected happened. 
              Don't worry, your workout data is safe!
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]}
                onPress={this.handleReset}
              >
                <Ionicons name="refresh" size={20} color="#FFF" />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]}
                onPress={this.handleRestart}
              >
                <Ionicons name="reload" size={20} color={colors.primary.DEFAULT} />
                <Text style={styles.secondaryButtonText}>Restart App</Text>
              </TouchableOpacity>
            </View>

            {/* Report Issue Link */}
            <TouchableOpacity 
              style={styles.reportButton}
              onPress={this.handleReportIssue}
            >
              <Text style={styles.reportButtonText}>Report This Issue</Text>
            </TouchableOpacity>

            {/* Error Details (Dev Mode Only) */}
            {__DEV__ && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>Error Details (Dev Mode)</Text>
                <ScrollView style={styles.errorDetailsScroll}>
                  <Text style={styles.errorDetailsText}>
                    {this.state.error?.toString()}
                  </Text>
                  {this.state.error?.stack && (
                    <Text style={styles.errorDetailsStack}>
                      {'\n'}Stack Trace:{'\n'}
                      {this.state.error.stack}
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: spacing.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary.DEFAULT,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
  },
  secondaryButtonText: {
    color: colors.primary.DEFAULT,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  reportButton: {
    paddingVertical: spacing.sm,
  },
  reportButtonText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    textDecorationLine: 'underline',
  },
  errorDetails: {
    width: '100%',
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    maxHeight: 200,
  },
  errorDetailsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.error.DEFAULT,
    marginBottom: spacing.sm,
  },
  errorDetailsScroll: {
    maxHeight: 150,
  },
  errorDetailsText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: 'Courier',
  },
  errorDetailsStack: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontFamily: 'Courier',
  },
});

// HOC to wrap components with error boundary
export const withErrorBoundary = (Component) => {
  return (props) => (
    <ErrorBoundary>
      <Component {...props} />
    </ErrorBoundary>
  );
};

export default ErrorBoundary;