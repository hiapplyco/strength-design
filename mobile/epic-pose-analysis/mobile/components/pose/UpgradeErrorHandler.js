/**
 * Upgrade Error Handler Component
 * 
 * Comprehensive error handling and recovery for the upgrade flow.
 * Provides user-friendly error messages and actionable recovery options.
 * 
 * Features:
 * - Payment error handling with specific recovery actions
 * - Network error detection and retry mechanisms
 * - User-friendly error messages with clear next steps
 * - Error analytics and reporting
 * - Graceful fallback experiences
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-async-storage/async-storage';

// Services
import abTestingService from '../../services/abTestingService';

// Utils
import { colors, spacing, borderRadius, typography } from '../../utils/designTokens';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Error types and their configurations
const ERROR_TYPES = {
  PAYMENT_FAILED: {
    type: 'payment_failed',
    title: 'Payment Could Not Be Processed',
    icon: '💳',
    color: '#F44336',
    canRetry: true,
    severity: 'high'
  },
  PAYMENT_DECLINED: {
    type: 'payment_declined',
    title: 'Payment Method Declined',
    icon: '⚠️',
    color: '#FF9800',
    canRetry: true,
    severity: 'high'
  },
  NETWORK_ERROR: {
    type: 'network_error',
    title: 'Connection Problem',
    icon: '📡',
    color: '#9E9E9E',
    canRetry: true,
    severity: 'medium'
  },
  SUBSCRIPTION_ERROR: {
    type: 'subscription_error',
    title: 'Subscription Service Unavailable',
    icon: '⚙️',
    color: '#607D8B',
    canRetry: true,
    severity: 'high'
  },
  VALIDATION_ERROR: {
    type: 'validation_error',
    title: 'Invalid Information',
    icon: '📝',
    color: '#FF5722',
    canRetry: false,
    severity: 'medium'
  },
  AUTH_ERROR: {
    type: 'auth_error',
    title: 'Authentication Required',
    icon: '🔒',
    color: '#E91E63',
    canRetry: false,
    severity: 'high'
  },
  QUOTA_ERROR: {
    type: 'quota_error',
    title: 'Usage Limit Reached',
    icon: '📊',
    color: '#3F51B5',
    canRetry: false,
    severity: 'low'
  },
  UNKNOWN_ERROR: {
    type: 'unknown_error',
    title: 'Something Went Wrong',
    icon: '❌',
    color: '#795548',
    canRetry: true,
    severity: 'medium'
  }
};

// Error recovery actions
const RECOVERY_ACTIONS = {
  RETRY_PAYMENT: {
    id: 'retry_payment',
    title: 'Try Again',
    description: 'Retry the payment with the same method',
    icon: 'refresh',
    color: '#4CAF50',
    primary: true
  },
  CHANGE_PAYMENT: {
    id: 'change_payment',
    title: 'Use Different Payment',
    description: 'Try a different card or payment method',
    icon: 'card',
    color: '#2196F3',
    primary: false
  },
  CHECK_CONNECTION: {
    id: 'check_connection',
    title: 'Check Connection',
    description: 'Verify your internet connection',
    icon: 'wifi',
    color: '#FF9800',
    primary: true
  },
  CONTACT_SUPPORT: {
    id: 'contact_support',
    title: 'Get Help',
    description: 'Contact customer support',
    icon: 'help-circle',
    color: '#9C27B0',
    primary: false
  },
  LOGIN_AGAIN: {
    id: 'login_again',
    title: 'Sign In Again',
    description: 'Re-authenticate your account',
    icon: 'log-in',
    color: '#E91E63',
    primary: true
  },
  GO_BACK: {
    id: 'go_back',
    title: 'Go Back',
    description: 'Return to the previous screen',
    icon: 'arrow-back',
    color: '#607D8B',
    primary: false
  }
};

export default function UpgradeErrorHandler({
  error = null,
  visible = false,
  context = 'upgrade',
  onRetry,
  onAction,
  onClose,
  tier = null,
  style = {}
}) {
  const { theme } = useTheme();
  const [isRetrying, setIsRetrying] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setConnectionStatus(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  // Track error when it appears
  useEffect(() => {
    if (visible && error) {
      trackError();
    }
  }, [visible, error]);

  const trackError = async () => {
    try {
      await abTestingService.trackEvent('upgrade_error_occurred', {
        errorType: getErrorType(error).type,
        errorMessage: error?.message || 'Unknown error',
        context,
        tier,
        retryCount,
        connectionStatus,
        timestamp: new Date().toISOString()
      });
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
    }
  };

  const getErrorType = (error) => {
    if (!error) return ERROR_TYPES.UNKNOWN_ERROR;

    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toLowerCase() || '';

    // Payment specific errors
    if (message.includes('payment') && message.includes('failed')) {
      return ERROR_TYPES.PAYMENT_FAILED;
    }
    if (message.includes('declined') || message.includes('card')) {
      return ERROR_TYPES.PAYMENT_DECLINED;
    }
    
    // Network errors
    if (message.includes('network') || message.includes('connection') || 
        message.includes('timeout') || code.includes('network')) {
      return ERROR_TYPES.NETWORK_ERROR;
    }
    
    // Auth errors
    if (message.includes('auth') || message.includes('unauthorized') || 
        code.includes('auth')) {
      return ERROR_TYPES.AUTH_ERROR;
    }
    
    // Subscription errors
    if (message.includes('subscription') || message.includes('checkout')) {
      return ERROR_TYPES.SUBSCRIPTION_ERROR;
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return ERROR_TYPES.VALIDATION_ERROR;
    }
    
    // Quota errors
    if (message.includes('quota') || message.includes('limit')) {
      return ERROR_TYPES.QUOTA_ERROR;
    }

    return ERROR_TYPES.UNKNOWN_ERROR;
  };

  const getErrorMessage = (errorType, error) => {
    const baseMessages = {
      [ERROR_TYPES.PAYMENT_FAILED.type]: [
        "We couldn't process your payment right now.",
        "This might be a temporary issue with the payment system.",
        "Please try again or contact your bank if the problem persists."
      ],
      [ERROR_TYPES.PAYMENT_DECLINED.type]: [
        "Your payment method was declined.",
        "Please check with your bank or try a different payment method.",
        "Common reasons include insufficient funds or security holds."
      ],
      [ERROR_TYPES.NETWORK_ERROR.type]: [
        "We're having trouble connecting to our servers.",
        "Please check your internet connection and try again.",
        connectionStatus ? "Connection detected but request failed." : "No internet connection detected."
      ],
      [ERROR_TYPES.SUBSCRIPTION_ERROR.type]: [
        "Our subscription service is temporarily unavailable.",
        "We're working to resolve this as quickly as possible.",
        "Please try again in a few minutes."
      ],
      [ERROR_TYPES.AUTH_ERROR.type]: [
        "We need to verify your identity to continue.",
        "Please sign in again to complete your upgrade.",
        "Your security is important to us."
      ],
      [ERROR_TYPES.VALIDATION_ERROR.type]: [
        "Some information appears to be incorrect.",
        "Please review your details and try again.",
        error?.details || "Check all required fields are completed."
      ],
      [ERROR_TYPES.QUOTA_ERROR.type]: [
        "You've reached your current usage limit.",
        "Upgrade to continue using pose analysis features.",
        "Your quota will reset at the next billing period."
      ]
    };

    return baseMessages[errorType.type] || [
      "An unexpected error occurred.",
      "We're sorry for the inconvenience.",
      "Please try again or contact support if this continues."
    ];
  };

  const getRecoveryActions = (errorType) => {
    const actionMap = {
      [ERROR_TYPES.PAYMENT_FAILED.type]: [
        RECOVERY_ACTIONS.RETRY_PAYMENT,
        RECOVERY_ACTIONS.CHANGE_PAYMENT,
        RECOVERY_ACTIONS.CONTACT_SUPPORT
      ],
      [ERROR_TYPES.PAYMENT_DECLINED.type]: [
        RECOVERY_ACTIONS.CHANGE_PAYMENT,
        RECOVERY_ACTIONS.RETRY_PAYMENT,
        RECOVERY_ACTIONS.CONTACT_SUPPORT
      ],
      [ERROR_TYPES.NETWORK_ERROR.type]: [
        RECOVERY_ACTIONS.CHECK_CONNECTION,
        RECOVERY_ACTIONS.RETRY_PAYMENT,
        RECOVERY_ACTIONS.GO_BACK
      ],
      [ERROR_TYPES.SUBSCRIPTION_ERROR.type]: [
        RECOVERY_ACTIONS.RETRY_PAYMENT,
        RECOVERY_ACTIONS.CONTACT_SUPPORT,
        RECOVERY_ACTIONS.GO_BACK
      ],
      [ERROR_TYPES.AUTH_ERROR.type]: [
        RECOVERY_ACTIONS.LOGIN_AGAIN,
        RECOVERY_ACTIONS.GO_BACK
      ],
      [ERROR_TYPES.VALIDATION_ERROR.type]: [
        RECOVERY_ACTIONS.GO_BACK,
        RECOVERY_ACTIONS.CONTACT_SUPPORT
      ],
      [ERROR_TYPES.QUOTA_ERROR.type]: [
        RECOVERY_ACTIONS.RETRY_PAYMENT,
        RECOVERY_ACTIONS.GO_BACK
      ]
    };

    return actionMap[errorType.type] || [
      RECOVERY_ACTIONS.RETRY_PAYMENT,
      RECOVERY_ACTIONS.GO_BACK,
      RECOVERY_ACTIONS.CONTACT_SUPPORT
    ];
  };

  const handleRetry = async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      await abTestingService.trackEvent('upgrade_error_retry_attempted', {
        errorType: getErrorType(error).type,
        retryCount: retryCount + 1,
        context,
        tier
      });

      await onRetry?.();
      
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleAction = async (action) => {
    await abTestingService.trackEvent('upgrade_error_action_taken', {
      actionId: action.id,
      errorType: getErrorType(error).type,
      context,
      tier
    });

    switch (action.id) {
      case 'retry_payment':
        handleRetry();
        break;
      case 'check_connection':
        Alert.alert(
          'Connection Status',
          connectionStatus ? 
            'Internet connection detected. The issue may be temporary.' :
            'No internet connection. Please check your wifi or cellular data.',
          [
            { text: 'OK' },
            { text: 'Try Again', onPress: handleRetry }
          ]
        );
        break;
      case 'contact_support':
        // Would integrate with support system
        Alert.alert(
          'Contact Support',
          'Email: support@strengthdesign.ai\nWe typically respond within 2 hours.',
          [{ text: 'OK' }]
        );
        break;
      case 'login_again':
        // Would trigger re-authentication
        onAction?.('re_authenticate');
        break;
      default:
        onAction?.(action.id);
        break;
    }
  };

  const handleClose = async () => {
    await abTestingService.trackEvent('upgrade_error_dismissed', {
      errorType: getErrorType(error).type,
      retryCount,
      context,
      tier
    });

    onClose?.();
  };

  if (!visible || !error) return null;

  const errorType = getErrorType(error);
  const errorMessages = getErrorMessage(errorType, error);
  const recoveryActions = getRecoveryActions(errorType);

  const styles = createStyleSheet(theme);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={90} style={styles.modalBlur}>
          <View style={styles.errorContainer}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Error Icon and Title */}
            <View style={styles.errorHeader}>
              <View style={[styles.errorIconContainer, { backgroundColor: `${errorType.color}20` }]}>
                <Text style={styles.errorIcon}>{errorType.icon}</Text>
              </View>
              <Text style={styles.errorTitle}>{errorType.title}</Text>
            </View>

            {/* Error Messages */}
            <View style={styles.errorMessages}>
              {errorMessages.map((message, index) => (
                <Text key={index} style={styles.errorMessage}>
                  {message}
                </Text>
              ))}
            </View>

            {/* Connection Status */}
            {errorType.type === ERROR_TYPES.NETWORK_ERROR.type && (
              <View style={styles.connectionStatus}>
                <Ionicons 
                  name={connectionStatus ? "wifi" : "wifi-off"} 
                  size={20} 
                  color={connectionStatus ? colors.success : colors.error}
                />
                <Text style={[
                  styles.connectionText,
                  { color: connectionStatus ? colors.success : colors.error }
                ]}>
                  {connectionStatus ? 'Connected to internet' : 'No internet connection'}
                </Text>
              </View>
            )}

            {/* Recovery Actions */}
            <View style={styles.actionsContainer}>
              {recoveryActions.map((action, index) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.actionButton,
                    action.primary && styles.primaryActionButton,
                    isRetrying && action.id === 'retry_payment' && styles.actionButtonDisabled
                  ]}
                  onPress={() => handleAction(action)}
                  disabled={isRetrying && action.id === 'retry_payment'}
                >
                  {action.primary ? (
                    <LinearGradient
                      colors={[action.color, `${action.color}CC`]}
                      style={styles.actionGradient}
                    >
                      <Ionicons 
                        name={isRetrying && action.id === 'retry_payment' ? 'hourglass' : action.icon} 
                        size={20} 
                        color="white" 
                      />
                      <Text style={styles.primaryActionText}>
                        {isRetrying && action.id === 'retry_payment' ? 'Retrying...' : action.title}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.secondaryActionContent}>
                      <Ionicons name={action.icon} size={20} color={action.color} />
                      <View style={styles.secondaryActionText}>
                        <Text style={styles.actionTitle}>{action.title}</Text>
                        <Text style={styles.actionDescription}>{action.description}</Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Retry Counter */}
            {retryCount > 0 && (
              <Text style={styles.retryCounter}>
                {retryCount === 1 ? '1 retry attempted' : `${retryCount} retries attempted`}
              </Text>
            )}
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

const createStyleSheet = (theme) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalBlur: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.7,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: spacing.xl,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    padding: spacing.sm,
  },
  errorHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  errorIcon: {
    fontSize: 40,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  errorMessages: {
    marginBottom: spacing.lg,
  },
  errorMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.md,
  },
  connectionText: {
    ...typography.body,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  actionsContainer: {
    gap: spacing.md,
  },
  actionButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  primaryActionButton: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  primaryActionText: {
    ...typography.button,
    color: 'white',
    marginLeft: spacing.sm,
    fontWeight: 'bold',
  },
  secondaryActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryActionText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  actionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  actionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  retryCounter: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});