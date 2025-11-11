/**
 * Premium Gate Component
 * 
 * Controls access to premium pose analysis features based on subscription status.
 * Provides elegant feature gating with clear upgrade paths and compelling messaging.
 * 
 * Features:
 * - Real-time subscription status checking
 * - Feature-specific access control
 * - Contextual upgrade messaging
 * - A/B testing framework integration
 * - Glassmorphism design system compliance
 * - Analytics tracking for conversion optimization
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  ScrollView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  interpolate
} from 'react-native-reanimated';

// Services
import poseSubscriptionService, { POSE_SUBSCRIPTION_TIERS, POSE_TIER_CONFIG } from '../../services/poseSubscriptionService';
import { createThemedStyles, colors, spacing, borderRadius, typography } from '../../utils/designTokens';

// Components
import FeatureComparison from './FeatureComparison';

// Icons - Premium themed
const Icons = {
  lock: '🔒',
  unlock: '🔓',
  crown: '👑',
  star: '⭐',
  rocket: '🚀',
  diamond: '💎',
  lightning: '⚡',
  fire: '🔥',
  magic: '✨',
  trophy: '🏆',
  target: '🎯',
  check: '✅',
  cross: '❌',
  upgrade: '⬆️',
  gift: '🎁'
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Premium Gate Component
 * 
 * @param {Object} props
 * @param {string} props.feature - Feature name to gate (e.g., 'advancedInsights', 'pdfReports')
 * @param {React.ReactNode} props.children - Component to render if access granted
 * @param {React.ReactNode} props.fallback - Component to render if access denied (optional)
 * @param {string} props.variant - Gate display variant ('card', 'modal', 'inline', 'overlay')
 * @param {string} props.upgradeContext - Context for upgrade tracking ('analysis', 'results', 'export')
 * @param {Function} props.onUpgrade - Custom upgrade handler
 * @param {Function} props.onAccessGranted - Callback when access is granted
 * @param {Function} props.onAccessDenied - Callback when access is denied
 * @param {Object} props.style - Custom styling
 * @param {boolean} props.showComparison - Whether to show feature comparison table
 * @param {string} props.customMessage - Custom upgrade message override
 * @param {Object} props.abTestVariant - A/B testing variant configuration
 */
const PremiumGate = ({
  feature,
  children,
  fallback = null,
  variant = 'card',
  upgradeContext = 'feature',
  onUpgrade,
  onAccessGranted,
  onAccessDenied,
  style,
  showComparison = false,
  customMessage,
  abTestVariant = {},
  ...props
}) => {
  // State
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  // Animation values
  const fadeValue = useSharedValue(0);
  const scaleValue = useSharedValue(0.8);
  const lockRotation = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  // Feature configuration
  const featureConfig = useMemo(() => {
    const configs = {
      basicFeedback: {
        name: 'Basic Form Feedback',
        description: 'Essential form analysis and scoring',
        icon: Icons.target,
        requiredTier: POSE_SUBSCRIPTION_TIERS.FREE,
        upgradeMessage: 'Get instant feedback on your exercise form',
        benefits: ['Form scoring', 'Basic recommendations', 'Error highlighting']
      },
      advancedInsights: {
        name: 'Advanced Insights',
        description: 'Detailed biomechanical analysis with actionable recommendations',
        icon: Icons.lightning,
        requiredTier: POSE_SUBSCRIPTION_TIERS.PREMIUM,
        upgradeMessage: 'Unlock detailed biomechanical insights and advanced form analysis',
        benefits: ['Detailed muscle activation', 'Movement efficiency analysis', 'Personalized corrections', 'Injury risk assessment']
      },
      unlimitedAnalyses: {
        name: 'Unlimited Analyses',
        description: 'Analyze as many videos as you want',
        icon: Icons.rocket,
        requiredTier: POSE_SUBSCRIPTION_TIERS.PREMIUM,
        upgradeMessage: 'Remove monthly limits and analyze unlimited videos',
        benefits: ['No monthly quota', 'Instant processing', 'Batch analysis support']
      },
      pdfReports: {
        name: 'PDF Reports',
        description: 'Professional downloadable analysis reports',
        icon: Icons.diamond,
        requiredTier: POSE_SUBSCRIPTION_TIERS.COACHING,
        upgradeMessage: 'Generate professional PDF reports for your clients and trainers',
        benefits: ['Detailed analysis reports', 'Progress tracking charts', 'Shareable with trainers', 'Print-ready format']
      },
      priorityProcessing: {
        name: 'Priority Processing',
        description: 'Faster analysis with priority queue',
        icon: Icons.fire,
        requiredTier: POSE_SUBSCRIPTION_TIERS.COACHING,
        upgradeMessage: 'Get your analysis results faster with priority processing',
        benefits: ['Skip the queue', '50% faster processing', 'Real-time notifications']
      },
      trainerSharing: {
        name: 'Trainer Sharing',
        description: 'Share analyses with trainers and coaches',
        icon: Icons.trophy,
        requiredTier: POSE_SUBSCRIPTION_TIERS.COACHING,
        upgradeMessage: 'Collaborate with trainers and share your progress',
        benefits: ['Secure sharing links', 'Trainer collaboration tools', 'Progress tracking', 'Feedback system']
      },
      videoStorage: {
        name: 'Video Storage',
        description: 'Cloud storage for your analysis videos',
        icon: Icons.magic,
        requiredTier: POSE_SUBSCRIPTION_TIERS.PREMIUM,
        upgradeMessage: 'Store your videos in the cloud for easy access',
        benefits: ['Cloud backup', 'Cross-device access', 'Extended storage', 'Video history']
      },
      formComparison: {
        name: 'Form Comparison',
        description: 'Compare form across multiple sessions',
        icon: Icons.star,
        requiredTier: POSE_SUBSCRIPTION_TIERS.PREMIUM,
        upgradeMessage: 'Track your progress by comparing form over time',
        benefits: ['Side-by-side comparisons', 'Progress visualization', 'Improvement tracking', 'Performance trends']
      }
    };

    return configs[feature] || {
      name: 'Premium Feature',
      description: 'This feature requires a premium subscription',
      icon: Icons.crown,
      requiredTier: POSE_SUBSCRIPTION_TIERS.PREMIUM,
      upgradeMessage: 'Upgrade to access this premium feature',
      benefits: ['Enhanced functionality', 'Professional tools', 'Advanced features']
    };
  }, [feature]);

  /**
   * Check subscription status and feature access
   */
  const checkAccess = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const subscriptionStatus = await poseSubscriptionService.getSubscriptionStatus();
      setSubscription(subscriptionStatus);

      const hasFeature = await poseSubscriptionService.hasFeature(feature);
      setHasAccess(hasFeature);

      // Callback notifications
      if (hasFeature) {
        onAccessGranted?.();
      } else {
        onAccessDenied?.({ 
          feature, 
          requiredTier: featureConfig.requiredTier, 
          currentTier: subscriptionStatus.poseAnalysisTier 
        });
      }

      // Animate entrance
      fadeValue.value = withTiming(1, { duration: 500 });
      scaleValue.value = withSpring(1, { damping: 15, stiffness: 150 });

      // Lock animation for blocked features
      if (!hasFeature) {
        lockRotation.value = withTiming(
          lockRotation.value + 360, 
          { duration: 1000, easing: Easing.inOut(Easing.cubic) }
        );
        
        // Pulsing glow effect
        glowIntensity.value = withTiming(1, 
          { duration: 1000, easing: Easing.inOut(Easing.sine) },
          () => {
            glowIntensity.value = withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.sine) });
          }
        );
      }

    } catch (err) {
      console.error('PremiumGate: Error checking access:', err);
      setError(err.message);
      setHasAccess(false);
      onAccessDenied?.({ error: err.message });
    } finally {
      setLoading(false);
    }
  }, [feature, featureConfig.requiredTier, onAccessGranted, onAccessDenied, fadeValue, scaleValue, lockRotation, glowIntensity]);

  /**
   * Handle upgrade button press
   */
  const handleUpgrade = useCallback(async () => {
    try {
      if (onUpgrade) {
        await onUpgrade({
          feature,
          context: upgradeContext,
          requiredTier: featureConfig.requiredTier,
          currentTier: subscription?.poseAnalysisTier,
          abTestVariant
        });
        return;
      }

      // Track conversion event
      console.log('PremiumGate: Upgrade initiated', {
        feature,
        context: upgradeContext,
        variant: abTestVariant,
        currentTier: subscription?.poseAnalysisTier,
        targetTier: featureConfig.requiredTier
      });

      // Get available upgrade options
      const upgradeOptions = await poseSubscriptionService.getUpgradeOptions();
      
      if (upgradeOptions.availableUpgrades.length === 0) {
        Alert.alert(
          'Already Premium',
          'You already have access to all available features.',
          [{ text: 'OK' }]
        );
        return;
      }

      setShowUpgradeModal(true);

    } catch (err) {
      Alert.alert('Error', 'Failed to process upgrade. Please try again.');
      console.error('PremiumGate: Upgrade error:', err);
    }
  }, [onUpgrade, feature, upgradeContext, featureConfig.requiredTier, subscription, abTestVariant]);

  /**
   * Handle upgrade selection
   */
  const handleUpgradeSelection = useCallback((upgradeOption) => {
    setShowUpgradeModal(false);
    
    Alert.alert(
      `Upgrade to ${upgradeOption.name}`,
      `Unlock ${featureConfig.name} and more with ${upgradeOption.name} plan.\n\nPrice: $${upgradeOption.price}/${upgradeOption.interval}\n\nNew features:\n${upgradeOption.benefits.slice(0, 3).map(b => `• ${b.description || b.name}`).join('\n')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Upgrade Now', 
          style: 'default',
          onPress: () => {
            // Track final conversion
            console.log('PremiumGate: Conversion completed', {
              feature,
              selectedPlan: upgradeOption.tier,
              price: upgradeOption.price,
              context: upgradeContext
            });

            Alert.alert(
              'Upgrade Processing',
              'Your upgrade is being processed. You will receive an email confirmation shortly.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  }, [featureConfig.name, feature, upgradeContext]);

  // Initial load
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ scale: scaleValue.value }]
  }));

  const lockStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${lockRotation.value}deg` }]
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowIntensity.value, [0, 1], [0, 0.3]),
    shadowRadius: interpolate(glowIntensity.value, [0, 1], [0, 20])
  }));

  // Get theme-aware styles
  const styles = useMemo(() => createThemedStyles((theme) => ({
    // Container variants
    cardContainer: {
      backgroundColor: theme.colors.background.glass.medium,
      borderRadius: borderRadius.component.card.lg,
      padding: spacing[5],
      margin: spacing[4],
      borderWidth: 1,
      borderColor: theme.colors.border.medium,
      ...theme.shadows.md,
      overflow: 'hidden'
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center'
    },
    modalContent: {
      backgroundColor: theme.colors.background.glass.modal,
      borderRadius: borderRadius.component.modal.lg,
      padding: spacing[6],
      margin: spacing[4],
      maxHeight: SCREEN_HEIGHT * 0.8,
      maxWidth: SCREEN_WIDTH * 0.9,
      borderWidth: 1,
      borderColor: theme.colors.border.medium,
      ...theme.shadows.xl
    },
    inlineContainer: {
      backgroundColor: theme.colors.background.glass.subtle,
      borderRadius: borderRadius.component.card.md,
      padding: spacing[4],
      borderWidth: 1,
      borderColor: theme.colors.border.light
    },
    overlayContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },

    // Content styles
    header: {
      alignItems: 'center',
      marginBottom: spacing[5]
    },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing[3],
      shadowColor: theme.isDark ? colors.primary[400] : colors.primary[500],
      shadowRadius: 10,
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 0 }
    },
    featureIcon: {
      fontSize: 28
    },
    lockIcon: {
      fontSize: 24,
      color: theme.colors.text.tertiary,
      position: 'absolute',
      bottom: -2,
      right: -2
    },
    title: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginBottom: spacing[2]
    },
    description: {
      fontSize: typography.fontSize.base,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
      marginBottom: spacing[4]
    },

    // Benefits list
    benefitsList: {
      marginBottom: spacing[5]
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing[2]
    },
    benefitIcon: {
      fontSize: 16,
      marginRight: spacing[3],
      width: 20
    },
    benefitText: {
      flex: 1,
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.primary,
      lineHeight: typography.lineHeight.normal * typography.fontSize.sm
    },

    // Tier badges
    tierBadge: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: borderRadius.base,
      marginBottom: spacing[4],
      alignSelf: 'center'
    },
    tierBadgeText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
      color: '#FFFFFF',
      textAlign: 'center'
    },

    // Action buttons
    actionButtons: {
      flexDirection: 'column',
      gap: spacing[3]
    },
    upgradeButton: {
      borderRadius: borderRadius.component.button.md,
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[5],
      alignItems: 'center',
      ...theme.shadows.md
    },
    upgradeButtonText: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      color: '#FFFFFF'
    },
    comparisonButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border.medium,
      borderRadius: borderRadius.component.button.md,
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[5],
      alignItems: 'center'
    },
    comparisonButtonText: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.primary,
      fontWeight: typography.fontWeight.medium
    },

    // Loading and error states
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing[8]
    },
    loadingText: {
      fontSize: typography.fontSize.base,
      color: theme.colors.text.tertiary,
      marginTop: spacing[3]
    },
    errorContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing[6]
    },
    errorText: {
      fontSize: typography.fontSize.base,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
      marginBottom: spacing[4]
    },
    retryButton: {
      backgroundColor: theme.colors.background.elevated,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
      borderRadius: borderRadius.base,
      borderWidth: 1,
      borderColor: theme.colors.border.medium
    },
    retryButtonText: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.primary,
      fontWeight: typography.fontWeight.medium
    }
  })), []);

  /**
   * Get tier-specific gradient colors
   */
  const getTierGradient = useCallback((tier) => {
    const gradients = {
      [POSE_SUBSCRIPTION_TIERS.FREE]: ['#94A3B8', '#64748B'],
      [POSE_SUBSCRIPTION_TIERS.PREMIUM]: ['#F59E0B', '#D97706'],
      [POSE_SUBSCRIPTION_TIERS.COACHING]: ['#8B5CF6', '#7C3AED']
    };
    return gradients[tier] || gradients[POSE_SUBSCRIPTION_TIERS.PREMIUM];
  }, []);

  /**
   * Get tier badge color
   */
  const getTierBadgeColor = useCallback((tier) => {
    const colors = {
      [POSE_SUBSCRIPTION_TIERS.FREE]: '#64748B',
      [POSE_SUBSCRIPTION_TIERS.PREMIUM]: '#D97706',
      [POSE_SUBSCRIPTION_TIERS.COACHING]: '#7C3AED'
    };
    return colors[tier] || colors[POSE_SUBSCRIPTION_TIERS.PREMIUM];
  }, []);

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <Text style={styles.loadingText}>
          {Icons.magic} Checking access...
        </Text>
      </View>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <View style={[styles.errorContainer, style]}>
        <Text style={styles.errorText}>
          {Icons.cross} Failed to check access
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={checkAccess}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * Grant access - render children
   */
  if (hasAccess) {
    return children;
  }

  /**
   * Render fallback if provided
   */
  if (fallback && !hasAccess) {
    return fallback;
  }

  /**
   * Get container style based on variant
   */
  const getContainerStyle = () => {
    switch (variant) {
      case 'modal':
        return styles.modalContent;
      case 'inline':
        return styles.inlineContainer;
      case 'overlay':
        return styles.overlayContainer;
      default:
        return styles.cardContainer;
    }
  };

  /**
   * Render premium gate content
   */
  const renderGateContent = () => (
    <Animated.View style={[getContainerStyle(), containerStyle, glowStyle]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={getTierGradient(featureConfig.requiredTier)}
            style={styles.iconContainer}
          >
            <Text style={styles.featureIcon}>{featureConfig.icon}</Text>
            <Animated.Text style={[styles.lockIcon, lockStyle]}>
              {Icons.lock}
            </Animated.Text>
          </LinearGradient>

          <Text style={styles.title}>{featureConfig.name}</Text>
          <Text style={styles.description}>
            {customMessage || featureConfig.upgradeMessage}
          </Text>

          {/* Required Tier Badge */}
          <View style={[
            styles.tierBadge,
            { backgroundColor: getTierBadgeColor(featureConfig.requiredTier) }
          ]}>
            <Text style={styles.tierBadgeText}>
              {POSE_TIER_CONFIG[featureConfig.requiredTier].name.toUpperCase()} REQUIRED
            </Text>
          </View>
        </View>

        {/* Benefits List */}
        <View style={styles.benefitsList}>
          {featureConfig.benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>{Icons.check}</Text>
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={handleUpgrade}>
            <LinearGradient
              colors={getTierGradient(featureConfig.requiredTier)}
              style={styles.upgradeButton}
            >
              <Text style={styles.upgradeButtonText}>
                {Icons.upgrade} Upgrade Now
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {showComparison && (
            <TouchableOpacity
              style={styles.comparisonButton}
              onPress={() => setShowUpgradeModal(true)}
            >
              <Text style={styles.comparisonButtonText}>
                Compare Plans
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );

  /**
   * Render modal variant
   */
  if (variant === 'modal' || variant === 'overlay') {
    return (
      <Modal
        visible={!hasAccess}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalContainer}>
          {renderGateContent()}
        </View>
      </Modal>
    );
  }

  /**
   * Render inline variants
   */
  return renderGateContent();
};

/**
 * Higher-order component for easy feature gating
 */
export const withPremiumGate = (Component, gateProps = {}) => {
  return React.forwardRef((props, ref) => (
    <PremiumGate {...gateProps} {...props}>
      <Component ref={ref} {...props} />
    </PremiumGate>
  ));
};

/**
 * Hook for subscription status
 */
export const usePremiumGate = (feature) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setLoading(true);
        const subscriptionStatus = await poseSubscriptionService.getSubscriptionStatus();
        setSubscription(subscriptionStatus);
        
        const access = await poseSubscriptionService.hasFeature(feature);
        setHasAccess(access);
      } catch (error) {
        console.error('usePremiumGate error:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [feature]);

  return { hasAccess, loading, subscription };
};

export default PremiumGate;