/**
 * Upgrade Prompts Component
 * 
 * Contextual upgrade prompts optimized for conversion with A/B testing framework.
 * Displays targeted messaging based on user behavior and feature usage patterns.
 * 
 * Features:
 * - Context-aware messaging
 * - A/B testing framework integration
 * - Conversion-optimized designs
 * - Usage pattern analysis
 * - Behavioral triggers
 * - Analytics tracking
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
  withSequence,
  withDelay,
  Easing,
  interpolate,
  interpolateColor,
  runOnJS
} from 'react-native-reanimated';

// Services
import poseSubscriptionService, { POSE_SUBSCRIPTION_TIERS, POSE_TIER_CONFIG } from '../../services/poseSubscriptionService';
import usageTrackingService from '../../services/usageTrackingService';
import { createThemedStyles, colors, spacing, borderRadius, typography } from '../../utils/designTokens';

// Components
import FeatureComparison from './FeatureComparison';

// Icons
const Icons = {
  // Motivational
  rocket: '🚀',
  fire: '🔥',
  lightning: '⚡',
  star: '⭐',
  trophy: '🏆',
  target: '🎯',
  muscle: '💪',
  crown: '👑',
  diamond: '💎',
  magic: '✨',
  sparkle: '💫',
  gem: '🔮',
  
  // Actions
  upgrade: '⬆️',
  unlock: '🔓',
  gift: '🎁',
  celebration: '🎉',
  confetti: '🎊',
  
  // Progress
  chart: '📈',
  trending: '📊',
  progress: '🏃‍♂️',
  growth: '🌱',
  
  // Features
  unlimited: '∞',
  fast: '⚡',
  premium: '💎',
  professional: '👨‍💼',
  
  // Emotions
  love: '❤️',
  excited: '🤩',
  amazed: '😍',
  thumbsup: '👍',
  
  // Close/dismiss
  close: '❌',
  later: '⏰'
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Upgrade Prompts Component
 * 
 * @param {Object} props
 * @param {string} props.context - Context where prompt is shown
 * @param {string} props.trigger - What triggered the prompt
 * @param {Object} props.userStats - User usage statistics
 * @param {string} props.variant - Prompt variant ('banner', 'modal', 'card', 'toast', 'fullscreen')
 * @param {Function} props.onUpgrade - Upgrade handler
 * @param {Function} props.onDismiss - Dismiss handler
 * @param {Function} props.onLater - Remind later handler
 * @param {boolean} props.visible - Whether prompt is visible
 * @param {Object} props.abTestVariant - A/B testing configuration
 * @param {number} props.urgency - Urgency level (0-10)
 * @param {string} props.customMessage - Custom message override
 * @param {Object} props.style - Custom styling
 */
const UpgradePrompts = ({
  context = 'general',
  trigger = 'usage',
  userStats = {},
  variant = 'modal',
  onUpgrade,
  onDismiss,
  onLater,
  visible = false,
  abTestVariant = {},
  urgency = 5,
  customMessage,
  style,
  ...props
}) => {
  // State
  const [subscription, setSubscription] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [promptConfig, setPromptConfig] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  
  // Animation values
  const fadeValue = useSharedValue(0);
  const slideValue = useSharedValue(variant === 'modal' ? SCREEN_HEIGHT : 100);
  const scaleValue = useSharedValue(0.8);
  const pulseValue = useSharedValue(1);
  const sparkleOpacity = useSharedValue(0);
  const progressValue = useSharedValue(0);
  
  // Context-specific prompt configurations
  const promptConfigs = useMemo(() => ({
    // Quota-related prompts
    quota_approaching: {
      title: `${Icons.fire} You're on Fire!`,
      subtitle: 'Only 1 analysis left this month',
      message: 'Your dedication is incredible! Upgrade to Premium for unlimited analyses and keep the momentum going.',
      primaryAction: 'Get Unlimited',
      secondaryAction: 'View Plans',
      urgencyLevel: 8,
      benefits: ['Unlimited analyses', 'Advanced insights', 'Progress tracking'],
      gradient: ['#FF6B35', '#FF8F65'],
      icon: Icons.rocket,
      targetTier: POSE_SUBSCRIPTION_TIERS.PREMIUM
    },
    quota_exceeded: {
      title: `${Icons.target} Mission Accomplished!`,
      subtitle: 'You\'ve maxed out your monthly limit',
      message: 'Your commitment to perfect form is amazing! Upgrade now to continue your analysis streak without interruption.',
      primaryAction: 'Continue Journey',
      secondaryAction: 'Compare Plans',
      urgencyLevel: 9,
      benefits: ['Never hit limits again', 'Analyze immediately', 'Track progress continuously'],
      gradient: ['#DC2626', '#EF4444'],
      icon: Icons.fire,
      targetTier: POSE_SUBSCRIPTION_TIERS.PREMIUM
    },
    
    // Feature-specific prompts
    advanced_insights_blocked: {
      title: `${Icons.lightning} Unlock Your Potential`,
      subtitle: 'Advanced insights available',
      message: 'Get detailed biomechanical analysis and personalized recommendations to perfect your form.',
      primaryAction: 'Get Insights',
      secondaryAction: 'Learn More',
      urgencyLevel: 6,
      benefits: ['Detailed muscle activation', 'Movement efficiency', 'Injury prevention tips'],
      gradient: ['#8B5CF6', '#A855F7'],
      icon: Icons.lightning,
      targetTier: POSE_SUBSCRIPTION_TIERS.PREMIUM
    },
    pdf_reports_blocked: {
      title: `${Icons.diamond} Professional Reports`,
      subtitle: 'Share your progress professionally',
      message: 'Generate beautiful PDF reports perfect for trainers, coaches, or personal tracking.',
      primaryAction: 'Get Reports',
      secondaryAction: 'See Examples',
      urgencyLevel: 4,
      benefits: ['Professional formatting', 'Shareable reports', 'Progress charts'],
      gradient: ['#059669', '#10B981'],
      icon: Icons.diamond,
      targetTier: POSE_SUBSCRIPTION_TIERS.COACHING
    },
    
    // Progress-based prompts
    consistent_user: {
      title: `${Icons.trophy} Consistency Champion!`,
      subtitle: 'You\'ve analyzed 10+ times this month',
      message: 'Your dedication deserves unlimited access. Join Premium and never worry about limits again.',
      primaryAction: 'Go Premium',
      secondaryAction: 'Maybe Later',
      urgencyLevel: 7,
      benefits: ['Unlimited everything', 'Advanced tracking', 'Priority support'],
      gradient: ['#F59E0B', '#D97706'],
      icon: Icons.trophy,
      targetTier: POSE_SUBSCRIPTION_TIERS.PREMIUM
    },
    improvement_detected: {
      title: `${Icons.chart} Amazing Progress!`,
      subtitle: 'Your form has improved 25%',
      message: 'You\'re crushing it! Unlock advanced insights to accelerate your improvement even more.',
      primaryAction: 'Supercharge Growth',
      secondaryAction: 'Keep Going',
      urgencyLevel: 6,
      benefits: ['Detailed progress analytics', 'Advanced form comparison', 'Personalized tips'],
      gradient: ['#10B981', '#059669'],
      icon: Icons.chart,
      targetTier: POSE_SUBSCRIPTION_TIERS.PREMIUM
    },
    
    // Time-based prompts
    week_streak: {
      title: `${Icons.fire} 7-Day Streak!`,
      subtitle: 'You\'re building an incredible habit',
      message: 'Keep the momentum going with unlimited analyses and advanced insights.',
      primaryAction: 'Fuel the Fire',
      secondaryAction: 'Continue Free',
      urgencyLevel: 5,
      benefits: ['Never break your streak', 'Advanced progress tracking', 'Unlimited motivation'],
      gradient: ['#EF4444', '#F87171'],
      icon: Icons.fire,
      targetTier: POSE_SUBSCRIPTION_TIERS.PREMIUM
    },
    
    // Special occasions
    first_analysis: {
      title: `${Icons.sparkle} Welcome to Excellence!`,
      subtitle: 'Your fitness journey starts here',
      message: 'Get the most out of every workout with advanced pose analysis and unlimited access.',
      primaryAction: 'Start Premium',
      secondaryAction: 'Explore Free',
      urgencyLevel: 3,
      benefits: ['Best first impression', 'Advanced guidance', 'Unlimited learning'],
      gradient: ['#8B5CF6', '#A855F7'],
      icon: Icons.sparkle,
      targetTier: POSE_SUBSCRIPTION_TIERS.PREMIUM
    },
    
    // Default fallback
    general: {
      title: `${Icons.rocket} Take Your Fitness Further`,
      subtitle: 'Unlock premium features',
      message: 'Get unlimited analyses, advanced insights, and professional tools to accelerate your progress.',
      primaryAction: 'Upgrade Now',
      secondaryAction: 'Learn More',
      urgencyLevel: 5,
      benefits: ['Unlimited analyses', 'Advanced insights', 'Professional tools'],
      gradient: ['#FF6B35', '#FF8F65'],
      icon: Icons.rocket,
      targetTier: POSE_SUBSCRIPTION_TIERS.PREMIUM
    }
  }), []);

  /**
   * Determine the most appropriate prompt based on context and user data
   */
  const determinePromptConfig = useCallback(() => {
    // Custom context override
    if (promptConfigs[context]) {
      return promptConfigs[context];
    }

    // Usage-based logic
    if (userStats.quotaUsagePercentage >= 90) {
      return userStats.quotaUsagePercentage >= 100 ? 
        promptConfigs.quota_exceeded : 
        promptConfigs.quota_approaching;
    }

    if (userStats.analysisCount >= 10) {
      return promptConfigs.consistent_user;
    }

    if (userStats.streakDays >= 7) {
      return promptConfigs.week_streak;
    }

    if (userStats.improvementPercentage >= 25) {
      return promptConfigs.improvement_detected;
    }

    if (userStats.analysisCount === 1) {
      return promptConfigs.first_analysis;
    }

    // Trigger-based logic
    if (trigger === 'advanced_insights_blocked') {
      return promptConfigs.advanced_insights_blocked;
    }

    if (trigger === 'pdf_reports_blocked') {
      return promptConfigs.pdf_reports_blocked;
    }

    // Default
    return promptConfigs.general;
  }, [context, trigger, userStats, promptConfigs]);

  /**
   * Load user data and determine prompt configuration
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [subscriptionData, usageStats] = await Promise.all([
          poseSubscriptionService.getSubscriptionStatus(),
          usageTrackingService.getUsageStatus()
        ]);
        
        setSubscription(subscriptionData);
        setUsageData(usageStats);
        
        // Determine best prompt configuration
        const config = determinePromptConfig();
        setPromptConfig({
          ...config,
          ...abTestVariant, // A/B test overrides
          urgencyLevel: urgency || config.urgencyLevel
        });

        console.log('UpgradePrompts: Configured', {
          context,
          trigger,
          selectedConfig: config,
          abTestVariant
        });

      } catch (error) {
        console.error('UpgradePrompts: Error loading data', error);
        setPromptConfig(promptConfigs.general);
      }
    };

    if (visible) {
      loadData();
    }
  }, [visible, context, trigger, userStats, urgency, abTestVariant, determinePromptConfig, promptConfigs.general]);

  /**
   * Animate prompt entrance
   */
  useEffect(() => {
    if (visible && promptConfig) {
      // Entrance animations
      fadeValue.value = withTiming(1, { duration: 400 });
      slideValue.value = withSpring(0, { damping: 20, stiffness: 150 });
      scaleValue.value = withSpring(1, { damping: 15, stiffness: 200 });
      
      // Progress bar animation
      progressValue.value = withDelay(
        500,
        withTiming(userStats.quotaUsagePercentage / 100 || 0.5, { duration: 1000 })
      );
      
      // Sparkle effect
      sparkleOpacity.value = withSequence(
        withDelay(800, withTiming(1, { duration: 300 })),
        withTiming(0, { duration: 300 }),
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 300 })
      );
      
      // Pulse effect for high urgency
      if (promptConfig.urgencyLevel >= 8) {
        const pulse = () => {
          pulseValue.value = withSequence(
            withTiming(1.05, { duration: 600 }),
            withTiming(1, { duration: 600 })
          );
        };
        pulse();
        const interval = setInterval(pulse, 2000);
        return () => clearInterval(interval);
      }
    } else {
      // Exit animations
      fadeValue.value = withTiming(0, { duration: 300 });
      slideValue.value = withTiming(variant === 'modal' ? SCREEN_HEIGHT : 100, { duration: 300 });
      scaleValue.value = withTiming(0.8, { duration: 300 });
    }
  }, [visible, promptConfig, fadeValue, slideValue, scaleValue, progressValue, sparkleOpacity, pulseValue, variant, userStats.quotaUsagePercentage]);

  /**
   * Handle upgrade action
   */
  const handleUpgrade = useCallback(async () => {
    try {
      console.log('UpgradePrompts: Upgrade initiated', {
        context,
        trigger,
        targetTier: promptConfig?.targetTier,
        variant: selectedVariant || variant,
        abTestVariant
      });

      if (onUpgrade) {
        await onUpgrade({
          context,
          trigger,
          targetTier: promptConfig?.targetTier,
          promptConfig,
          abTestVariant
        });
        return;
      }

      // Default upgrade flow
      const tierConfig = POSE_TIER_CONFIG[promptConfig.targetTier];
      
      Alert.alert(
        promptConfig.title.replace(/[^\w\s]/gi, ''), // Remove emojis for alert
        `${promptConfig.message}\n\nPrice: $${tierConfig.price}/${tierConfig.interval}\n\nBenefits:\n${promptConfig.benefits.map(b => `• ${b}`).join('\n')}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade Now',
            style: 'default',
            onPress: () => {
              Alert.alert(
                'Upgrade Processing',
                'Your upgrade is being processed. You will receive confirmation shortly.',
                [{ text: 'OK', onPress: onDismiss }]
              );
            }
          }
        ]
      );

    } catch (error) {
      Alert.alert('Error', 'Failed to process upgrade. Please try again.');
      console.error('UpgradePrompts: Upgrade error', error);
    }
  }, [context, trigger, promptConfig, selectedVariant, variant, abTestVariant, onUpgrade, onDismiss]);

  /**
   * Handle dismiss
   */
  const handleDismiss = useCallback(() => {
    console.log('UpgradePrompts: Dismissed', { context, trigger, variant });
    onDismiss?.({ context, trigger, variant, reason: 'dismissed' });
  }, [context, trigger, variant, onDismiss]);

  /**
   * Handle later
   */
  const handleLater = useCallback(() => {
    console.log('UpgradePrompts: Postponed', { context, trigger, variant });
    onLater?.({ context, trigger, variant, reason: 'postponed' });
  }, [context, trigger, variant, onLater]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [
      { translateY: slideValue.value },
      { scale: scaleValue.value }
    ]
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }]
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`
  }));

  // Get theme-aware styles
  const styles = useMemo(() => createThemedStyles((theme) => ({
    // Modal container
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing[4]
    },
    modalContent: {
      backgroundColor: theme.colors.background.glass.modal,
      borderRadius: borderRadius.component.modal.lg,
      padding: spacing[6],
      maxWidth: SCREEN_WIDTH * 0.9,
      borderWidth: 1,
      borderColor: theme.colors.border.medium,
      ...theme.shadows.xl
    },

    // Banner container
    bannerContainer: {
      backgroundColor: theme.colors.background.glass.strong,
      padding: spacing[4],
      borderRadius: borderRadius.component.card.md,
      margin: spacing[3],
      borderWidth: 1,
      borderColor: theme.colors.border.medium,
      ...theme.shadows.md
    },

    // Card container
    cardContainer: {
      backgroundColor: theme.colors.background.glass.medium,
      borderRadius: borderRadius.component.card.lg,
      padding: spacing[5],
      margin: spacing[4],
      borderWidth: 1,
      borderColor: theme.colors.border.medium,
      ...theme.shadows.lg,
      position: 'relative',
      overflow: 'hidden'
    },

    // Toast container
    toastContainer: {
      position: 'absolute',
      top: spacing[12],
      left: spacing[4],
      right: spacing[4],
      backgroundColor: theme.colors.background.glass.strong,
      borderRadius: borderRadius.component.card.md,
      padding: spacing[4],
      borderWidth: 1,
      borderColor: theme.colors.border.medium,
      ...theme.shadows.lg,
      zIndex: 1000
    },

    // Fullscreen container
    fullscreenContainer: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
      padding: spacing[6],
      justifyContent: 'center'
    },

    // Header components
    header: {
      alignItems: 'center',
      marginBottom: spacing[5],
      position: 'relative'
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing[3],
      position: 'relative'
    },
    icon: {
      fontSize: 36
    },
    sparkleOverlay: {
      position: 'absolute',
      top: -10,
      right: -10,
      fontSize: 20
    },
    title: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginBottom: spacing[2]
    },
    subtitle: {
      fontSize: typography.fontSize.base,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      fontWeight: typography.fontWeight.medium,
      marginBottom: spacing[3]
    },
    message: {
      fontSize: typography.fontSize.base,
      color: theme.colors.text.primary,
      textAlign: 'center',
      lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
      marginBottom: spacing[4]
    },

    // Progress indicator
    progressContainer: {
      marginBottom: spacing[5]
    },
    progressLabel: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
      marginBottom: spacing[2]
    },
    progressTrack: {
      height: 6,
      backgroundColor: theme.colors.border.light,
      borderRadius: 3,
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      borderRadius: 3
    },
    progressText: {
      fontSize: typography.fontSize.xs,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
      marginTop: spacing[1]
    },

    // Benefits list
    benefitsList: {
      marginBottom: spacing[5]
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing[2],
      paddingHorizontal: spacing[2]
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
      fontWeight: typography.fontWeight.medium
    },

    // Action buttons
    actionContainer: {
      gap: spacing[3]
    },
    primaryButton: {
      borderRadius: borderRadius.component.button.md,
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[5],
      alignItems: 'center',
      ...theme.shadows.md
    },
    primaryButtonText: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      color: '#FFFFFF'
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.colors.border.medium,
      borderRadius: borderRadius.component.button.md,
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[5],
      alignItems: 'center'
    },
    secondaryButtonText: {
      fontSize: typography.fontSize.base,
      color: theme.colors.text.primary,
      fontWeight: typography.fontWeight.medium
    },

    // Dismiss controls
    dismissButton: {
      position: 'absolute',
      top: spacing[2],
      right: spacing[2],
      padding: spacing[2],
      borderRadius: borderRadius.base,
      backgroundColor: theme.colors.background.elevated
    },
    dismissIcon: {
      fontSize: 16,
      color: theme.colors.text.tertiary
    },

    // Urgency indicators
    urgencyHigh: {
      borderWidth: 2,
      borderColor: '#EF4444'
    },
    urgencyMedium: {
      borderWidth: 1,
      borderColor: '#F59E0B'
    },
    urgencyLow: {
      borderWidth: 1,
      borderColor: theme.colors.border.medium
    },

    // Compact variants
    compactHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing[3]
    },
    compactIcon: {
      fontSize: 24,
      marginRight: spacing[3]
    },
    compactTitle: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.text.primary,
      flex: 1
    },
    compactActions: {
      flexDirection: 'row',
      gap: spacing[3]
    },
    compactButton: {
      flex: 1,
      paddingVertical: spacing[2],
      paddingHorizontal: spacing[3],
      borderRadius: borderRadius.component.button.sm,
      alignItems: 'center'
    }
  })), []);

  // Don't render if not visible or no config
  if (!visible || !promptConfig) {
    return null;
  }

  /**
   * Get container style based on variant and urgency
   */
  const getContainerStyle = () => {
    const baseStyle = (() => {
      switch (variant) {
        case 'banner': return styles.bannerContainer;
        case 'card': return styles.cardContainer;
        case 'toast': return styles.toastContainer;
        case 'fullscreen': return styles.fullscreenContainer;
        default: return styles.modalContent;
      }
    })();

    const urgencyStyle = (() => {
      if (promptConfig.urgencyLevel >= 8) return styles.urgencyHigh;
      if (promptConfig.urgencyLevel >= 6) return styles.urgencyMedium;
      return styles.urgencyLow;
    })();

    return [baseStyle, urgencyStyle];
  };

  /**
   * Render compact variant
   */
  const renderCompact = () => (
    <View style={styles.compactHeader}>
      <Text style={styles.compactIcon}>{promptConfig.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.compactTitle}>{promptConfig.title}</Text>
        <Text style={styles.subtitle}>{promptConfig.subtitle}</Text>
      </View>
    </View>
  );

  /**
   * Render full header
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <Animated.View style={[pulseStyle]}>
        <LinearGradient
          colors={promptConfig.gradient}
          style={styles.iconContainer}
        >
          <Text style={styles.icon}>{promptConfig.icon}</Text>
          <Animated.Text style={[styles.sparkleOverlay, sparkleStyle]}>
            {Icons.sparkle}
          </Animated.Text>
        </LinearGradient>
      </Animated.View>
      
      <Text style={styles.title}>{promptConfig.title}</Text>
      <Text style={styles.subtitle}>{promptConfig.subtitle}</Text>
      <Text style={styles.message}>
        {customMessage || promptConfig.message}
      </Text>
    </View>
  );

  /**
   * Render progress indicator
   */
  const renderProgress = () => {
    if (!userStats.quotaUsagePercentage) return null;
    
    return (
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>Monthly Usage</Text>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]}>
            <LinearGradient
              colors={promptConfig.gradient}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>
        <Text style={styles.progressText}>
          {Math.round(userStats.quotaUsagePercentage)}% used
        </Text>
      </View>
    );
  };

  /**
   * Render benefits list
   */
  const renderBenefits = () => (
    <View style={styles.benefitsList}>
      {promptConfig.benefits.map((benefit, index) => (
        <View key={index} style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>{Icons.star}</Text>
          <Text style={styles.benefitText}>{benefit}</Text>
        </View>
      ))}
    </View>
  );

  /**
   * Render action buttons
   */
  const renderActions = () => (
    <View style={variant === 'banner' ? styles.compactActions : styles.actionContainer}>
      <TouchableOpacity onPress={handleUpgrade}>
        <LinearGradient
          colors={promptConfig.gradient}
          style={variant === 'banner' ? styles.compactButton : styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            {promptConfig.primaryAction}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={variant === 'banner' ? styles.compactButton : styles.secondaryButton}
        onPress={() => setShowComparison(true)}
      >
        <Text style={styles.secondaryButtonText}>
          {promptConfig.secondaryAction}
        </Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render dismiss button
   */
  const renderDismiss = () => (
    <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
      <Text style={styles.dismissIcon}>{Icons.close}</Text>
    </TouchableOpacity>
  );

  /**
   * Render main content
   */
  const renderContent = () => (
    <Animated.View style={[getContainerStyle(), containerStyle]}>
      {variant !== 'fullscreen' && renderDismiss()}
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {variant === 'banner' ? renderCompact() : renderHeader()}
        {renderProgress()}
        {variant !== 'banner' && renderBenefits()}
        {renderActions()}
      </ScrollView>
    </Animated.View>
  );

  // Render based on variant
  if (variant === 'modal') {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleDismiss}
      >
        <View style={styles.modalContainer}>
          {renderContent()}
        </View>
      </Modal>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={handleDismiss}
      >
        {renderContent()}
      </Modal>
    );
  }

  return (
    <>
      {renderContent()}
      
      {/* Feature Comparison Modal */}
      <Modal
        visible={showComparison}
        animationType="slide"
        onRequestClose={() => setShowComparison(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'white' }}>
          <FeatureComparison
            variant="hero"
            currentTier={subscription?.poseAnalysisTier}
            onUpgrade={handleUpgrade}
            context={`${context}_comparison`}
            abTestVariant={abTestVariant}
          />
          <TouchableOpacity
            style={[styles.dismissButton, { top: 50 }]}
            onPress={() => setShowComparison(false)}
          >
            <Text style={styles.dismissIcon}>{Icons.close}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

/**
 * Hook for contextual upgrade prompts
 */
export const useUpgradePrompts = () => {
  const [promptData, setPromptData] = useState(null);
  
  const showPrompt = useCallback((config) => {
    setPromptData({ ...config, visible: true });
  }, []);
  
  const hidePrompt = useCallback(() => {
    setPromptData(prev => prev ? { ...prev, visible: false } : null);
  }, []);
  
  return {
    promptData,
    showPrompt,
    hidePrompt
  };
};

export default UpgradePrompts;