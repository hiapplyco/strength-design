/**
 * Subscription Plans Component
 * 
 * Displays pose analysis subscription plans with clear tier comparison.
 * Optimized for conversion with compelling pricing presentation and benefits.
 * 
 * Features:
 * - Clear tier differentiation (Free/Premium/Coaching)
 * - Visual pricing hierarchy with value emphasis
 * - A/B testing support for pricing psychology
 * - Mobile-optimized card layouts
 * - Glassmorphism design system compliance
 * - Conversion tracking integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate
} from 'react-native-reanimated';

// Services
import { POSE_SUBSCRIPTION_TIERS, POSE_TIER_CONFIG } from '../../services/poseSubscriptionService';
import abTestingService from '../../services/abTestingService';

// Utils
import { createThemedStyles, colors, spacing, borderRadius, typography } from '../../utils/designTokens';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Subscription plan configurations with pose analysis focus
const POSE_SUBSCRIPTION_PLANS = {
  [POSE_SUBSCRIPTION_TIERS.FREE]: {
    name: 'Free',
    subtitle: 'Get Started',
    price: 0,
    originalPrice: null,
    billingPeriod: 'month',
    badge: null,
    badgeColor: null,
    features: [
      '3 analyses per month',
      'Basic form feedback',
      '30 days history',
      'Standard processing',
      'Community support'
    ],
    limitations: [
      'Limited monthly analyses',
      'Basic feedback only',
      'No advanced insights',
      'No PDF reports'
    ],
    buttonText: 'Current Plan',
    buttonStyle: 'disabled',
    popular: false,
    savings: null
  },
  [POSE_SUBSCRIPTION_TIERS.PREMIUM]: {
    name: 'Premium',
    subtitle: 'Most Popular',
    price: 9.99,
    originalPrice: 14.99,
    billingPeriod: 'month',
    badge: '🔥 Popular',
    badgeColor: '#FF6B35',
    features: [
      'Unlimited analyses',
      'Advanced biomechanical insights',
      'Detailed form breakdown',
      'Full analysis history',
      'Progress tracking charts',
      'Email support'
    ],
    limitations: [],
    buttonText: 'Start Premium',
    buttonStyle: 'primary',
    popular: true,
    savings: '$5/month'
  },
  [POSE_SUBSCRIPTION_TIERS.COACHING]: {
    name: 'Coaching',
    subtitle: 'Professional',
    price: 19.99,
    originalPrice: 29.99,
    billingPeriod: 'month',
    badge: '👑 Pro',
    badgeColor: '#9C27B0',
    features: [
      'Everything in Premium',
      'Priority processing (2x faster)',
      'Professional PDF reports',
      'Share with trainers',
      'Advanced analytics dashboard',
      'Priority support',
      'Export to training platforms'
    ],
    limitations: [],
    buttonText: 'Go Professional',
    buttonStyle: 'accent',
    popular: false,
    savings: '$10/month'
  }
};

// Pricing psychology variants for A/B testing
const PRICING_VARIANTS = {
  standard: {
    showOriginalPrice: false,
    emphasizeDiscount: false,
    showDailyCost: false,
    showAnnualOption: false
  },
  discount: {
    showOriginalPrice: true,
    emphasizeDiscount: true,
    showDailyCost: false,
    showAnnualOption: false
  },
  dailyCost: {
    showOriginalPrice: false,
    emphasizeDiscount: false,
    showDailyCost: true,
    showAnnualOption: false
  },
  annual: {
    showOriginalPrice: true,
    emphasizeDiscount: true,
    showDailyCost: false,
    showAnnualOption: true
  }
};

export default function SubscriptionPlans({
  currentTier = POSE_SUBSCRIPTION_TIERS.FREE,
  selectedTier = POSE_SUBSCRIPTION_TIERS.PREMIUM,
  onPlanSelect,
  onUpgrade,
  loading = false,
  abTestVariant = null,
  showAnnualDiscount = false,
  style = {}
}) {
  const { theme, isDarkMode } = useTheme();
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [hoveredPlan, setHoveredPlan] = useState(null);
  
  // Animation values
  const scaleValues = {
    [POSE_SUBSCRIPTION_TIERS.FREE]: useSharedValue(1),
    [POSE_SUBSCRIPTION_TIERS.PREMIUM]: useSharedValue(1),
    [POSE_SUBSCRIPTION_TIERS.COACHING]: useSharedValue(1)
  };

  // Get pricing variant from A/B test
  const pricingVariant = abTestVariant?.config?.pricingVariant || 'standard';
  const variant = PRICING_VARIANTS[pricingVariant];

  useEffect(() => {
    // Highlight selected plan
    Object.keys(scaleValues).forEach(tier => {
      scaleValues[tier].value = withSpring(tier === selectedTier ? 1.05 : 1);
    });
  }, [selectedTier]);

  const handlePlanPress = useCallback(async (tier) => {
    if (tier === currentTier) return;

    // Animate selection
    scaleValues[tier].value = withSpring(1.1, {}, () => {
      scaleValues[tier].value = withSpring(1.05);
    });

    // Track selection
    await abTestingService.trackEvent('subscription_plan_selected', {
      selectedTier: tier,
      currentTier,
      variant: abTestVariant?.variant || 'control',
      pricingVariant
    });

    onPlanSelect?.(tier);
  }, [currentTier, onPlanSelect, abTestVariant, pricingVariant]);

  const handleUpgradePress = useCallback(async (tier) => {
    await abTestingService.trackEvent('subscription_upgrade_clicked', {
      selectedTier: tier,
      currentTier,
      source: 'subscription_plans',
      variant: abTestVariant?.variant || 'control'
    });

    onUpgrade?.(tier);
  }, [currentTier, onUpgrade, abTestVariant]);

  const formatPrice = (price, tier) => {
    if (price === 0) return 'Free';
    
    if (variant.showDailyCost && price > 0) {
      const dailyCost = (price / 30).toFixed(2);
      return `$${dailyCost}/day`;
    }
    
    return `$${price}/${billingPeriod === 'annual' ? 'year' : 'month'}`;
  };

  const getAnnualPrice = (monthlyPrice) => {
    return monthlyPrice * 10; // 2 months free
  };

  const renderPlanCard = (tier) => {
    const plan = POSE_SUBSCRIPTION_PLANS[tier];
    const isSelected = selectedTier === tier;
    const isCurrent = currentTier === tier;
    const isPopular = plan.popular && !isCurrent;

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleValues[tier].value }]
    }));

    return (
      <Animated.View key={tier} style={[styles.planCard, animatedStyle]}>
        <TouchableOpacity
          onPress={() => handlePlanPress(tier)}
          style={[
            styles.planTouchable,
            isSelected && styles.planSelected,
            isCurrent && styles.planCurrent
          ]}
          activeOpacity={0.8}
        >
          <BlurView intensity={20} style={styles.planBlur}>
            <LinearGradient
              colors={
                isSelected
                  ? ['rgba(255, 107, 53, 0.2)', 'rgba(255, 107, 53, 0.1)']
                  : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']
              }
              style={styles.planGradient}
            >
              {/* Badge */}
              {plan.badge && (
                <View style={[styles.planBadge, { backgroundColor: plan.badgeColor }]}>
                  <Text style={styles.planBadgeText}>{plan.badge}</Text>
                </View>
              )}

              {/* Header */}
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
              </View>

              {/* Pricing */}
              <View style={styles.pricingSection}>
                <View style={styles.priceRow}>
                  {variant.showOriginalPrice && plan.originalPrice && (
                    <Text style={styles.originalPrice}>
                      ${plan.originalPrice}/{billingPeriod === 'annual' ? 'year' : 'month'}
                    </Text>
                  )}
                  <Text style={styles.planPrice}>
                    {formatPrice(
                      billingPeriod === 'annual' ? getAnnualPrice(plan.price) : plan.price,
                      tier
                    )}
                  </Text>
                </View>

                {variant.emphasizeDiscount && plan.savings && (
                  <View style={styles.savingsLabel}>
                    <Text style={styles.savingsText}>Save {plan.savings}</Text>
                  </View>
                )}

                {variant.showDailyCost && plan.price > 0 && (
                  <Text style={styles.dailyCostText}>
                    Less than ${(plan.price / 30).toFixed(2)} per day
                  </Text>
                )}
              </View>

              {/* Annual Toggle */}
              {showAnnualDiscount && variant.showAnnualOption && (
                <View style={styles.billingToggle}>
                  <TouchableOpacity
                    style={[
                      styles.billingOption,
                      billingPeriod === 'monthly' && styles.billingOptionActive
                    ]}
                    onPress={() => setBillingPeriod('monthly')}
                  >
                    <Text style={styles.billingOptionText}>Monthly</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.billingOption,
                      billingPeriod === 'annual' && styles.billingOptionActive
                    ]}
                    onPress={() => setBillingPeriod('annual')}
                  >
                    <Text style={styles.billingOptionText}>Annual</Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>-17%</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Features */}
              <View style={styles.featuresSection}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.success}
                      style={styles.featureIcon}
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  styles.planButton,
                  styles[`button${plan.buttonStyle.charAt(0).toUpperCase() + plan.buttonStyle.slice(1)}`],
                  loading && styles.planButtonDisabled
                ]}
                onPress={() => !isCurrent && handleUpgradePress(tier)}
                disabled={loading || isCurrent}
              >
                <Text style={[
                  styles.planButtonText,
                  plan.buttonStyle === 'disabled' && styles.planButtonTextDisabled
                ]}>
                  {loading && tier === selectedTier 
                    ? 'Processing...' 
                    : isCurrent 
                      ? plan.buttonText 
                      : plan.buttonText
                  }
                </Text>
                {!isCurrent && !loading && (
                  <Ionicons 
                    name="arrow-forward" 
                    size={16} 
                    color={plan.buttonStyle === 'primary' ? 'white' : colors.accent}
                    style={styles.buttonIcon}
                  />
                )}
              </TouchableOpacity>

              {/* Value highlight for popular plan */}
              {isPopular && (
                <View style={styles.valueHighlight}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.valueText}>Best Value</Text>
                </View>
              )}
            </LinearGradient>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const styles = createStyleSheet(theme);

  return (
    <View style={[styles.container, style]}>
      {/* Plans Grid */}
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.plansContainer}
        snapToInterval={screenWidth * 0.8}
        decelerationRate="fast"
      >
        {Object.values(POSE_SUBSCRIPTION_TIERS).map(tier => renderPlanCard(tier))}
      </ScrollView>

      {/* Feature Comparison Link */}
      <TouchableOpacity style={styles.compareLink}>
        <Text style={styles.compareLinkText}>Compare all features</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.accent} />
      </TouchableOpacity>

      {/* Trust Signals */}
      <View style={styles.trustSignals}>
        <View style={styles.trustItem}>
          <Ionicons name="shield-checkmark" size={16} color={colors.success} />
          <Text style={styles.trustText}>SSL Secured</Text>
        </View>
        <View style={styles.trustItem}>
          <Ionicons name="refresh" size={16} color={colors.success} />
          <Text style={styles.trustText}>30-Day Refund</Text>
        </View>
        <View style={styles.trustItem}>
          <Ionicons name="close-circle" size={16} color={colors.success} />
          <Text style={styles.trustText}>Cancel Anytime</Text>
        </View>
      </View>
    </View>
  );
}

const createStyleSheet = (theme) => StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
  },
  plansContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  planCard: {
    width: screenWidth * 0.75,
    marginHorizontal: spacing.xs,
  },
  planTouchable: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planSelected: {
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  planCurrent: {
    borderColor: colors.success,
  },
  planBlur: {
    flex: 1,
  },
  planGradient: {
    padding: spacing.lg,
    minHeight: 400,
  },
  planBadge: {
    position: 'absolute',
    top: -1,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomLeftRadius: borderRadius.sm,
    borderBottomRightRadius: borderRadius.sm,
    zIndex: 1,
  },
  planBadgeText: {
    ...typography.caption,
    color: 'white',
    fontWeight: 'bold',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  planName: {
    ...typography.h2,
    color: colors.text,
    fontWeight: 'bold',
  },
  planSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  pricingSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  priceRow: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  originalPrice: {
    ...typography.body,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  planPrice: {
    ...typography.h1,
    color: colors.text,
    fontWeight: 'bold',
  },
  savingsLabel: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  savingsText: {
    ...typography.caption,
    color: 'white',
    fontWeight: 'bold',
  },
  dailyCostText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.md,
    padding: 2,
    marginBottom: spacing.md,
  },
  billingOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    position: 'relative',
  },
  billingOptionActive: {
    backgroundColor: colors.accent,
  },
  billingOptionText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  discountBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.success,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
  },
  discountText: {
    ...typography.caption,
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  featuresSection: {
    flex: 1,
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureIcon: {
    marginRight: spacing.sm,
  },
  featureText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: 'auto',
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
  },
  buttonAccent: {
    backgroundColor: colors.success,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  planButtonDisabled: {
    opacity: 0.6,
  },
  planButtonText: {
    ...typography.button,
    color: 'white',
    fontWeight: 'bold',
  },
  planButtonTextDisabled: {
    color: colors.textSecondary,
  },
  buttonIcon: {
    marginLeft: spacing.sm,
  },
  valueHighlight: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  valueText: {
    ...typography.caption,
    color: '#FFD700',
    marginLeft: spacing.xs,
    fontWeight: 'bold',
  },
  compareLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  compareLinkText: {
    ...typography.body,
    color: colors.accent,
    marginRight: spacing.xs,
  },
  trustSignals: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  trustItem: {
    alignItems: 'center',
  },
  trustText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});