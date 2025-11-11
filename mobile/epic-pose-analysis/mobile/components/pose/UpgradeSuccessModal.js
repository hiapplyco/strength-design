/**
 * Upgrade Success Modal Component
 * 
 * Post-upgrade success flow with immediate feature access and onboarding.
 * Celebrates the successful upgrade and guides users to start using premium features.
 * 
 * Features:
 * - Celebration animation and congratulatory messaging
 * - Immediate feature access demonstration
 * - Quick start guide for premium features
 * - Analytics tracking for post-upgrade engagement
 * - Seamless transition back to pose analysis
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

// Services
import { POSE_SUBSCRIPTION_TIERS } from '../../services/poseSubscriptionService';
import abTestingService from '../../services/abTestingService';

// Utils
import { createThemedStyles, colors, spacing, borderRadius, typography } from '../../utils/designTokens';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Premium features by tier for onboarding
const TIER_FEATURES = {
  [POSE_SUBSCRIPTION_TIERS.PREMIUM]: [
    {
      id: 'unlimited_analyses',
      icon: '∞',
      title: 'Unlimited Analyses',
      description: 'No more quotas! Analyze every workout',
      action: 'Start analyzing',
      actionIcon: 'play-circle'
    },
    {
      id: 'advanced_insights',
      icon: '🧠',
      title: 'Advanced AI Insights',
      description: 'Get detailed biomechanical feedback',
      action: 'See example',
      actionIcon: 'eye'
    },
    {
      id: 'progress_tracking',
      icon: '📈',
      title: 'Progress Tracking',
      description: 'Watch your form improve over time',
      action: 'View progress',
      actionIcon: 'trending-up'
    }
  ],
  [POSE_SUBSCRIPTION_TIERS.COACHING]: [
    {
      id: 'priority_processing',
      icon: '⚡',
      title: 'Priority Processing',
      description: 'Get results 2x faster',
      action: 'Try now',
      actionIcon: 'flash'
    },
    {
      id: 'pdf_reports',
      icon: '📄',
      title: 'PDF Reports',
      description: 'Professional reports to share',
      action: 'Generate report',
      actionIcon: 'document-text'
    },
    {
      id: 'trainer_sharing',
      icon: '🤝',
      title: 'Trainer Collaboration',
      description: 'Share analyses with your coach',
      action: 'Invite trainer',
      actionIcon: 'person-add'
    }
  ]
};

// Success messages by tier
const SUCCESS_MESSAGES = {
  [POSE_SUBSCRIPTION_TIERS.PREMIUM]: {
    title: 'Welcome to Premium!',
    subtitle: 'You now have unlimited access to advanced pose analysis',
    celebration: '🎉',
    benefits: 'Unlimited analyses • Advanced insights • Progress tracking'
  },
  [POSE_SUBSCRIPTION_TIERS.COACHING]: {
    title: 'Welcome to Coaching Pro!',
    subtitle: 'You have unlocked professional-grade pose analysis',
    celebration: '👑',
    benefits: 'Everything in Premium • PDF reports • Trainer sharing • Priority support'
  }
};

export default function UpgradeSuccessModal({
  visible = false,
  tier = POSE_SUBSCRIPTION_TIERS.PREMIUM,
  subscriptionDetails = {},
  onClose,
  onFeatureAction,
  onStartAnalyzing,
  autoCloseDelay = 10000, // 10 seconds
  style = {}
}) {
  const { theme, isDarkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState('celebration'); // celebration, features, complete
  const [selectedFeature, setSelectedFeature] = useState(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const celebrationAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const featureAnims = useRef(
    (TIER_FEATURES[tier] || []).map(() => new Animated.Value(0))
  ).current;

  const successMessage = SUCCESS_MESSAGES[tier] || SUCCESS_MESSAGES[POSE_SUBSCRIPTION_TIERS.PREMIUM];
  const tierFeatures = TIER_FEATURES[tier] || [];

  useEffect(() => {
    if (visible) {
      startEntranceAnimation();
      trackSuccessView();
      
      // Auto-progress through steps
      setTimeout(() => setCurrentStep('features'), 3000);
      
      // Auto-close if specified
      if (autoCloseDelay > 0) {
        setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
      }
    }
  }, [visible, tier, autoCloseDelay]);

  useEffect(() => {
    if (currentStep === 'features') {
      animateFeatures();
    }
  }, [currentStep]);

  const startEntranceAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(celebrationAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(celebrationAnim, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true
          })
        ])
      )
    ]).start();
  };

  const animateFeatures = () => {
    Animated.staggered(200, [
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      }),
      ...featureAnims.map(anim => 
        Animated.spring(anim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true
        })
      )
    ]).start();
  };

  const trackSuccessView = async () => {
    await abTestingService.trackEvent('upgrade_success_modal_viewed', {
      tier,
      subscriptionDetails: {
        amount: subscriptionDetails.amount,
        currency: subscriptionDetails.currency
      },
      timestamp: new Date().toISOString()
    });
  };

  const handleFeatureAction = async (feature) => {
    setSelectedFeature(feature.id);
    
    await abTestingService.trackEvent('upgrade_success_feature_explored', {
      featureId: feature.id,
      featureTitle: feature.title,
      tier,
      step: currentStep
    });

    onFeatureAction?.(feature);
  };

  const handleStartAnalyzing = async () => {
    await abTestingService.trackEvent('upgrade_success_start_analyzing', {
      tier,
      fromStep: currentStep
    });

    onStartAnalyzing?.();
    handleClose();
  };

  const handleClose = async () => {
    await abTestingService.trackEvent('upgrade_success_modal_closed', {
      tier,
      finalStep: currentStep,
      timeSpent: Date.now() - (visible ? 0 : 0) // Would need proper timing
    });

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      onClose?.();
      // Reset state for next time
      setCurrentStep('celebration');
      setSelectedFeature(null);
    });
  };

  const renderCelebrationStep = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      {/* Celebration Icon */}
      <Animated.View
        style={[
          styles.celebrationContainer,
          {
            transform: [{ scale: celebrationAnim }]
          }
        ]}
      >
        <Text style={styles.celebrationIcon}>{successMessage.celebration}</Text>
        <View style={styles.celebrationRings}>
          <View style={[styles.ring, styles.ring1]} />
          <View style={[styles.ring, styles.ring2]} />
          <View style={[styles.ring, styles.ring3]} />
        </View>
      </Animated.View>

      {/* Success Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.successTitle}>{successMessage.title}</Text>
        <Text style={styles.successSubtitle}>{successMessage.subtitle}</Text>
        <Text style={styles.benefitsList}>{successMessage.benefits}</Text>
      </View>

      {/* Quick Action */}
      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={handleStartAnalyzing}
      >
        <LinearGradient
          colors={['#4CAF50', '#45A049']}
          style={styles.quickActionGradient}
        >
          <Ionicons name="play-circle" size={24} color="white" />
          <Text style={styles.quickActionText}>Start Analyzing Now</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFeaturesStep = () => (
    <Animated.View
      style={[
        styles.stepContainer,
        { opacity: progressAnim }
      ]}
    >
      {/* Step Header */}
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Explore Your New Features</Text>
        <Text style={styles.stepSubtitle}>
          Discover what's now available to you
        </Text>
      </View>

      {/* Features List */}
      <ScrollView style={styles.featuresList} showsVerticalScrollIndicator={false}>
        {tierFeatures.map((feature, index) => (
          <Animated.View
            key={feature.id}
            style={[
              styles.featureCard,
              {
                opacity: featureAnims[index],
                transform: [
                  {
                    translateY: featureAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0]
                    })
                  }
                ]
              }
            ]}
          >
            <TouchableOpacity
              onPress={() => handleFeatureAction(feature)}
              activeOpacity={0.8}
              style={[
                styles.featureTouch,
                selectedFeature === feature.id && styles.featureSelected
              ]}
            >
              <BlurView intensity={15} style={styles.featureBlur}>
                <View style={styles.featureContent}>
                  <View style={styles.featureIcon}>
                    <Text style={styles.featureIconText}>{feature.icon}</Text>
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.featureAction}
                    onPress={() => handleFeatureAction(feature)}
                  >
                    <Text style={styles.featureActionText}>{feature.action}</Text>
                    <Ionicons 
                      name={feature.actionIcon} 
                      size={16} 
                      color={colors.accent} 
                    />
                  </TouchableOpacity>
                </View>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => setCurrentStep('complete')}
        >
          <Text style={styles.skipText}>Skip tour</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleStartAnalyzing}
        >
          <Text style={styles.continueText}>Start Using Features</Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

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
          <View style={styles.modalContainer}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Step Content */}
            {currentStep === 'celebration' && renderCelebrationStep()}
            {currentStep === 'features' && renderFeaturesStep()}

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['33%', '100%']
                      })
                    }
                  ]}
                />
              </View>
            </View>
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
  modalContainer: {
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    padding: spacing.sm,
  },
  stepContainer: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  celebrationIcon: {
    fontSize: 80,
    textAlign: 'center',
    zIndex: 2,
  },
  celebrationRings: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 100,
    borderColor: colors.accent,
  },
  ring1: {
    width: 120,
    height: 120,
    opacity: 0.6,
  },
  ring2: {
    width: 140,
    height: 140,
    opacity: 0.4,
  },
  ring3: {
    width: 160,
    height: 160,
    opacity: 0.2,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successTitle: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: 'bold',
  },
  successSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  benefitsList: {
    ...typography.body,
    color: colors.accent,
    textAlign: 'center',
    fontWeight: '500',
  },
  quickActionButton: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  quickActionText: {
    ...typography.button,
    color: 'white',
    marginLeft: spacing.sm,
    fontWeight: 'bold',
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  stepTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  featuresList: {
    flex: 1,
    width: '100%',
  },
  featureCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  featureTouch: {
    borderRadius: borderRadius.lg,
  },
  featureSelected: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  featureBlur: {
    borderRadius: borderRadius.lg,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  featureDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  featureAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
  },
  featureActionText: {
    ...typography.caption,
    color: colors.accent,
    marginRight: spacing.xs,
    fontWeight: '500',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    width: '100%',
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  continueText: {
    ...typography.body,
    color: 'white',
    marginRight: spacing.sm,
    fontWeight: '500',
  },
  progressContainer: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1.5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 1.5,
  },
});