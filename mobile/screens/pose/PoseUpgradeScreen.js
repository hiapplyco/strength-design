/**
 * Pose Analysis Upgrade Screen
 * 
 * Dedicated upgrade screen with compelling pose analysis value proposition.
 * Showcases subscription plans, premium benefits, and seamless payment integration.
 * 
 * Features:
 * - Compelling pose analysis value proposition
 * - Clear subscription tier comparison
 * - Seamless payment integration with existing Stripe infrastructure  
 * - Post-upgrade success flow with immediate feature access
 * - A/B testing integration for conversion optimization
 * - Glassmorphism design system compliance
 * 
 * Integration Points:
 * - Stream A: PoseSubscriptionService, UsageTrackingService
 * - Stream B: PremiumGate, FeatureComparison, UpgradePrompts, A/B testing
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  Animated,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Components
import SubscriptionPlans from '../../components/pose/SubscriptionPlans';
import PremiumBenefits from '../../components/pose/PremiumBenefits';
import UsageTracker from '../../components/pose/UsageTracker';
import FeatureComparison from '../../components/pose/FeatureComparison';

// Services
import poseSubscriptionService, { POSE_SUBSCRIPTION_TIERS } from '../../services/poseSubscriptionService';
import usageTrackingService from '../../services/usageTrackingService';
import abTestingService from '../../services/abTestingService';

// Utils
import { createThemedStyles, colors, spacing, borderRadius, typography } from '../../utils/designTokens';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Value proposition data specific to pose analysis
const POSE_VALUE_PROPS = [
  {
    icon: '🎯',
    title: 'Perfect Your Form',
    description: 'Get detailed biomechanical analysis to optimize every rep and prevent injuries',
    tier: 'premium'
  },
  {
    icon: '📊',
    title: 'Track Your Progress',
    description: 'See measurable improvements in form quality, range of motion, and technique',
    tier: 'premium'
  },
  {
    icon: '⚡',
    title: 'Instant Feedback',
    description: 'Real-time analysis with specific recommendations for immediate improvement',
    tier: 'premium'
  },
  {
    icon: '📈',
    title: 'Advanced Analytics',
    description: 'Comprehensive reports with trends, patterns, and personalized insights',
    tier: 'coaching'
  },
  {
    icon: '🏆',
    title: 'Share with Trainers',
    description: 'Export professional PDF reports to share with coaches and trainers',
    tier: 'coaching'
  },
  {
    icon: '🚀',
    title: 'Priority Processing',
    description: 'Skip the line with faster analysis and priority customer support',
    tier: 'coaching'
  }
];

// Success stories and testimonials
const SUCCESS_STORIES = [
  {
    name: 'Sarah M.',
    improvement: '32% form improvement',
    story: 'Fixed my squat depth and eliminated knee pain',
    tier: 'Premium',
    timeframe: '2 months'
  },
  {
    name: 'Mike R.',
    improvement: 'PRs increased 15%',
    story: 'Deadlift analysis helped me add 45lbs to my max',
    tier: 'Coaching',
    timeframe: '6 weeks'
  },
  {
    name: 'Alex K.',
    improvement: 'Zero injuries',
    story: 'Caught shoulder mobility issues before they became problems',
    tier: 'Premium',
    timeframe: '4 months'
  }
];

export default function PoseUpgradeScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [quotaStatus, setQuotaStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(POSE_SUBSCRIPTION_TIERS.PREMIUM);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [abTestVariant, setAbTestVariant] = useState(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Navigation params
  const { 
    source = 'general', 
    feature = null,
    context = 'upgrade_screen',
    userId = null 
  } = route.params || {};

  // Load subscription status and A/B test variant
  useEffect(() => {
    initializeScreen();
    setupAnimations();
  }, []);

  const initializeScreen = async () => {
    try {
      setLoading(true);

      // Load subscription status
      const [status, usage] = await Promise.all([
        poseSubscriptionService.getSubscriptionStatus(),
        usageTrackingService.getUsageStatus()
      ]);

      setSubscriptionStatus(status);
      setQuotaStatus(usage);

      // Get A/B test variant for upgrade screen optimization
      const variant = await abTestingService.getTestVariant(
        'POSE_UPGRADE_SCREEN_OPTIMIZATION',
        'upgrade_screen_viewed'
      );
      setAbTestVariant(variant);

      // Track screen view
      await abTestingService.trackEvent('pose_upgrade_screen_viewed', {
        source,
        feature,
        context,
        currentTier: status?.tier || 'free',
        quotaUsagePercentage: usage?.usagePercentage || 0,
        variant: variant?.variant || 'control'
      });

    } catch (error) {
      console.error('Failed to initialize upgrade screen:', error);
      Alert.alert('Error', 'Unable to load upgrade information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setupAnimations = () => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();

    // Pulse animation for CTA buttons
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();
  };

  const handlePlanSelection = useCallback(async (tier) => {
    setSelectedPlan(tier);
    
    // Track plan selection
    await abTestingService.trackEvent('pose_plan_selected', {
      selectedTier: tier,
      previousTier: subscriptionStatus?.tier || 'free',
      context,
      variant: abTestVariant?.variant || 'control'
    });
  }, [subscriptionStatus, context, abTestVariant]);

  const handleUpgrade = useCallback(async (tier = selectedPlan) => {
    try {
      setProcessingPayment(true);

      // Track upgrade attempt
      await abTestingService.trackEvent('pose_upgrade_attempted', {
        selectedTier: tier,
        source,
        feature,
        context,
        variant: abTestVariant?.variant || 'control'
      });

      // Check if already subscribed to this tier or higher
      if (subscriptionStatus?.tier === tier) {
        Alert.alert('Already Subscribed', `You already have ${tier} access to pose analysis features.`);
        return;
      }

      // Integration with existing Stripe checkout
      const checkoutResult = await poseSubscriptionService.createCheckoutSession({
        tier,
        source: 'pose_upgrade_screen',
        context,
        feature,
        abTestVariant: abTestVariant?.variant,
        userId: subscriptionStatus?.userId
      });

      if (checkoutResult.success) {
        // Navigate to checkout (handled by existing Stripe integration)
        navigation.navigate('CheckoutScreen', {
          sessionId: checkoutResult.sessionId,
          tier,
          onSuccess: handleUpgradeSuccess,
          onError: handleUpgradeError,
          returnUrl: 'PoseUpgradeScreen'
        });
      } else {
        throw new Error(checkoutResult.error || 'Failed to create checkout session');
      }

    } catch (error) {
      console.error('Upgrade failed:', error);
      
      // Track upgrade failure
      await abTestingService.trackEvent('pose_upgrade_failed', {
        selectedTier: tier,
        error: error.message,
        context,
        variant: abTestVariant?.variant || 'control'
      });

      Alert.alert(
        'Upgrade Failed',
        'Unable to process your upgrade. Please check your connection and try again.',
        [
          { text: 'Try Again', onPress: () => handleUpgrade(tier) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setProcessingPayment(false);
    }
  }, [selectedPlan, subscriptionStatus, source, feature, context, abTestVariant, navigation]);

  const handleUpgradeSuccess = useCallback(async (tier, subscriptionDetails) => {
    try {
      // Track successful conversion
      await abTestingService.trackConversion(
        'POSE_UPGRADE_SCREEN_OPTIMIZATION',
        abTestVariant?.variant || 'control',
        'subscription_purchased',
        {
          tier,
          source,
          feature,
          context,
          amount: subscriptionDetails?.amount,
          currency: subscriptionDetails?.currency
        }
      );

      // Refresh subscription status
      const updatedStatus = await poseSubscriptionService.getSubscriptionStatus(true); // Force refresh
      setSubscriptionStatus(updatedStatus);

      // Show success modal
      setShowSuccessModal(true);

      // Schedule navigation back after showing success
      setTimeout(() => {
        setShowSuccessModal(false);
        navigation.goBack();
      }, 3000);

    } catch (error) {
      console.error('Post-upgrade handling failed:', error);
    }
  }, [abTestVariant, source, feature, context, navigation]);

  const handleUpgradeError = useCallback(async (error) => {
    // Track upgrade error
    await abTestingService.trackEvent('pose_upgrade_checkout_failed', {
      selectedTier: selectedPlan,
      error: error.message,
      context,
      variant: abTestVariant?.variant || 'control'
    });

    Alert.alert(
      'Payment Error',
      'There was an issue processing your payment. Please try again.',
      [
        { text: 'Retry', onPress: () => handleUpgrade() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }, [selectedPlan, context, abTestVariant, handleUpgrade]);

  const styles = createStyleSheet(theme);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.loadingText}>Loading upgrade options...</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade Pose Analysis</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          {/* Hero Section */}
          <LinearGradient
            colors={['rgba(255, 107, 53, 0.15)', 'rgba(255, 107, 53, 0.05)']}
            style={styles.heroSection}
          >
            <Text style={styles.heroTitle}>
              {abTestVariant?.config?.heroTitle || 'Perfect Your Form'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {abTestVariant?.config?.heroSubtitle || 
               'Unlock advanced pose analysis with detailed feedback, unlimited analyses, and professional reports'}
            </Text>

            {/* Current Usage Status */}
            {quotaStatus && (
              <View style={styles.usageStatusCard}>
                <UsageTracker 
                  variant="compact" 
                  showUpgradePrompt={false}
                  style={styles.usageTracker}
                />
              </View>
            )}
          </LinearGradient>

          {/* Value Propositions */}
          <View style={styles.valuePropsSection}>
            <Text style={styles.sectionTitle}>Why Upgrade?</Text>
            {POSE_VALUE_PROPS.map((prop, index) => (
              <Animated.View 
                key={index}
                style={[
                  styles.valuePropCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }
                ]}
              >
                <BlurView intensity={20} style={styles.valuePropBlur}>
                  <View style={styles.valuePropContent}>
                    <Text style={styles.valuePropIcon}>{prop.icon}</Text>
                    <View style={styles.valuePropText}>
                      <Text style={styles.valuePropTitle}>{prop.title}</Text>
                      <Text style={styles.valuePropDescription}>{prop.description}</Text>
                      {prop.tier === 'coaching' && (
                        <View style={styles.proTierBadge}>
                          <Text style={styles.proTierText}>Pro Only</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </BlurView>
              </Animated.View>
            ))}
          </View>

          {/* Subscription Plans */}
          <View style={styles.plansSection}>
            <Text style={styles.sectionTitle}>Choose Your Plan</Text>
            <SubscriptionPlans
              currentTier={subscriptionStatus?.tier}
              selectedTier={selectedPlan}
              onPlanSelect={handlePlanSelection}
              onUpgrade={handleUpgrade}
              loading={processingPayment}
              abTestVariant={abTestVariant}
              showAnnualDiscount={abTestVariant?.config?.showAnnualDiscount}
            />
          </View>

          {/* Premium Benefits Showcase */}
          <View style={styles.benefitsSection}>
            <PremiumBenefits
              variant={abTestVariant?.config?.benefitsVariant || 'detailed'}
              showTestimonials={true}
              testimonials={SUCCESS_STORIES}
            />
          </View>

          {/* Feature Comparison Table */}
          <View style={styles.comparisonSection}>
            <Text style={styles.sectionTitle}>Feature Comparison</Text>
            <FeatureComparison
              variant="table"
              highlightTier={selectedPlan}
              showPricing={true}
              abTestVariant={abTestVariant}
            />
          </View>

          {/* Call to Action */}
          <View style={styles.ctaSection}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.primaryCTA,
                  processingPayment && styles.ctaDisabled
                ]}
                onPress={() => handleUpgrade()}
                disabled={processingPayment}
              >
                <LinearGradient
                  colors={['#FF6B35', '#FF8C42']}
                  style={styles.ctaGradient}
                >
                  <Text style={styles.ctaText}>
                    {processingPayment 
                      ? 'Processing...' 
                      : `Upgrade to ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}`
                    }
                  </Text>
                  {!processingPayment && (
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
            
            <Text style={styles.ctaSubtext}>
              30-day money-back guarantee • Cancel anytime
            </Text>
          </View>

          {/* Trust Signals */}
          <View style={styles.trustSection}>
            <View style={styles.trustSignal}>
              <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
              <Text style={styles.trustText}>Secure Payment</Text>
            </View>
            <View style={styles.trustSignal}>
              <Ionicons name="refresh" size={20} color="#4CAF50" />
              <Text style={styles.trustText}>30-Day Refund</Text>
            </View>
            <View style={styles.trustSignal}>
              <Ionicons name="close" size={20} color="#4CAF50" />
              <Text style={styles.trustText}>Cancel Anytime</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={90} style={styles.modalBlur}>
            <View style={styles.successModal}>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
              <Text style={styles.successTitle}>Welcome to {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}!</Text>
              <Text style={styles.successMessage}>
                Your upgrade is complete. You now have access to all premium pose analysis features.
              </Text>
              <View style={styles.successFeatures}>
                <Text style={styles.successFeature}>✨ Unlimited analyses</Text>
                <Text style={styles.successFeature}>📊 Advanced insights</Text>
                {selectedPlan === POSE_SUBSCRIPTION_TIERS.COACHING && (
                  <>
                    <Text style={styles.successFeature}>⚡ Priority processing</Text>
                    <Text style={styles.successFeature}>📄 PDF reports</Text>
                  </>
                )}
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyleSheet = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // Compensate for back button
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    padding: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroTitle: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  usageStatusCard: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  usageTracker: {
    margin: 0,
  },
  valuePropsSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  valuePropCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  valuePropBlur: {
    borderRadius: borderRadius.lg,
  },
  valuePropContent: {
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
  },
  valuePropIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  valuePropText: {
    flex: 1,
  },
  valuePropTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  valuePropDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  proTierBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  proTierText: {
    ...typography.caption,
    color: 'white',
    fontWeight: 'bold',
  },
  plansSection: {
    padding: spacing.lg,
  },
  benefitsSection: {
    padding: spacing.lg,
  },
  comparisonSection: {
    padding: spacing.lg,
  },
  ctaSection: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  primaryCTA: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  ctaText: {
    ...typography.button,
    color: 'white',
    marginRight: spacing.sm,
    fontWeight: 'bold',
  },
  ctaSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  trustSignal: {
    alignItems: 'center',
  },
  trustText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBlur: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    maxWidth: screenWidth * 0.8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  successTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  successMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  successFeatures: {
    alignSelf: 'stretch',
  },
  successFeature: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
});