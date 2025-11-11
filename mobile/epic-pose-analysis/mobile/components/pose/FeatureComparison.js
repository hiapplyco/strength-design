/**
 * Feature Comparison Component
 * 
 * Displays comprehensive feature comparison tables showing upgrade benefits.
 * Optimized for conversion with clear value propositions and compelling visuals.
 * 
 * Features:
 * - Side-by-side tier comparison
 * - Interactive feature highlights
 * - Conversion-optimized design
 * - Mobile-responsive layouts
 * - A/B testing framework integration
 * - Analytics tracking for optimization
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  interpolateColor
} from 'react-native-reanimated';

// Services
import poseSubscriptionService, { POSE_SUBSCRIPTION_TIERS, POSE_TIER_CONFIG } from '../../services/poseSubscriptionService';
import { createThemedStyles, colors, spacing, borderRadius, typography } from '../../utils/designTokens';

// Icons
const Icons = {
  check: '✅',
  cross: '❌',
  star: '⭐',
  crown: '👑',
  diamond: '💎',
  rocket: '🚀',
  lightning: '⚡',
  fire: '🔥',
  trophy: '🏆',
  target: '🎯',
  magic: '✨',
  lock: '🔒',
  unlimited: '∞',
  trending: '📈',
  popular: '🔥',
  recommended: '👑',
  sparkle: '💫'
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Feature Comparison Component
 * 
 * @param {Object} props
 * @param {string} props.variant - Display variant ('table', 'cards', 'hero')
 * @param {string} props.currentTier - User's current subscription tier
 * @param {Array} props.highlightFeatures - Features to emphasize
 * @param {Function} props.onUpgrade - Upgrade handler
 * @param {string} props.context - Context for analytics tracking
 * @param {boolean} props.showPricing - Whether to show pricing information
 * @param {boolean} props.showRecommendations - Whether to show tier recommendations
 * @param {Object} props.abTestVariant - A/B testing configuration
 * @param {Object} props.style - Custom styling
 */
const FeatureComparison = ({
  variant = 'table',
  currentTier = POSE_SUBSCRIPTION_TIERS.FREE,
  highlightFeatures = [],
  onUpgrade,
  context = 'comparison',
  showPricing = true,
  showRecommendations = true,
  abTestVariant = {},
  style,
  ...props
}) => {
  // State
  const [selectedTier, setSelectedTier] = useState(null);
  const [animatingFeature, setAnimatingFeature] = useState(null);
  const [upgradeOptions, setUpgradeOptions] = useState(null);

  // Animation values
  const fadeValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);
  const highlightValue = useSharedValue(0);

  // Feature definitions with enhanced metadata
  const featureDefinitions = useMemo(() => ({
    basicFeedback: {
      name: 'Basic Form Feedback',
      shortName: 'Form Feedback',
      description: 'Essential form analysis and scoring',
      category: 'Analysis',
      icon: Icons.target,
      importance: 'essential',
      tooltip: 'Get instant feedback on your exercise form with basic scoring and recommendations'
    },
    advancedInsights: {
      name: 'Advanced Insights',
      shortName: 'Advanced Analysis',
      description: 'Detailed biomechanical analysis',
      category: 'Analysis',
      icon: Icons.lightning,
      importance: 'high',
      tooltip: 'Deep biomechanical analysis with muscle activation patterns and movement efficiency'
    },
    unlimitedAnalyses: {
      name: 'Unlimited Analyses',
      shortName: 'No Limits',
      description: 'Analyze unlimited videos',
      category: 'Usage',
      icon: Icons.unlimited,
      importance: 'high',
      tooltip: 'Remove monthly quotas and analyze as many videos as you need'
    },
    pdfReports: {
      name: 'PDF Reports',
      shortName: 'Reports',
      description: 'Professional analysis reports',
      category: 'Export',
      icon: Icons.diamond,
      importance: 'medium',
      tooltip: 'Generate professional PDF reports perfect for sharing with trainers'
    },
    priorityProcessing: {
      name: 'Priority Processing',
      shortName: 'Fast Processing',
      description: 'Faster analysis processing',
      category: 'Performance',
      icon: Icons.fire,
      importance: 'medium',
      tooltip: 'Skip the queue and get your results 50% faster'
    },
    trainerSharing: {
      name: 'Trainer Sharing',
      shortName: 'Collaboration',
      description: 'Share with trainers/coaches',
      category: 'Collaboration',
      icon: Icons.trophy,
      importance: 'medium',
      tooltip: 'Collaborate with trainers and share your progress securely'
    },
    videoStorage: {
      name: 'Video Storage',
      shortName: 'Cloud Storage',
      description: 'Cloud video storage',
      category: 'Storage',
      icon: Icons.magic,
      importance: 'medium',
      tooltip: 'Store your analysis videos in the cloud with cross-device access'
    },
    formComparison: {
      name: 'Form Comparison',
      shortName: 'Progress Tracking',
      description: 'Compare form over time',
      category: 'Tracking',
      icon: Icons.trending,
      importance: 'high',
      tooltip: 'Track your progress by comparing form across multiple sessions'
    }
  }), []);

  // Tier metadata with enhanced value propositions
  const tierMetadata = useMemo(() => ({
    [POSE_SUBSCRIPTION_TIERS.FREE]: {
      name: 'Free',
      tagline: 'Get Started',
      description: 'Perfect for trying out pose analysis',
      color: '#64748B',
      gradient: ['#94A3B8', '#64748B'],
      recommendation: null,
      valueProps: ['3 analyses per month', 'Basic feedback', '30-day history'],
      limitations: ['Limited monthly quota', 'Basic insights only']
    },
    [POSE_SUBSCRIPTION_TIERS.PREMIUM]: {
      name: 'Premium',
      tagline: 'Most Popular',
      description: 'Best for serious fitness enthusiasts',
      color: '#D97706',
      gradient: ['#F59E0B', '#D97706'],
      recommendation: 'popular',
      valueProps: ['Unlimited analyses', 'Advanced insights', 'Progress tracking'],
      limitations: ['No PDF reports', 'Standard processing speed']
    },
    [POSE_SUBSCRIPTION_TIERS.COACHING]: {
      name: 'Coaching',
      tagline: 'Professional',
      description: 'Ideal for trainers and serious athletes',
      color: '#7C3AED',
      gradient: ['#8B5CF6', '#7C3AED'],
      recommendation: 'professional',
      valueProps: ['All Premium features', 'PDF reports', 'Trainer sharing', 'Priority processing'],
      limitations: []
    }
  }), []);

  /**
   * Load upgrade options
   */
  useEffect(() => {
    const loadUpgradeOptions = async () => {
      try {
        const options = await poseSubscriptionService.getUpgradeOptions();
        setUpgradeOptions(options);
      } catch (error) {
        console.warn('FeatureComparison: Failed to load upgrade options', error);
      }
    };

    loadUpgradeOptions();
  }, []);

  /**
   * Animate component entrance
   */
  useEffect(() => {
    fadeValue.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    
    // Staggered feature highlight animation
    if (highlightFeatures.length > 0) {
      setTimeout(() => {
        highlightValue.value = withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 }),
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 800 })
        );
      }, 1000);
    }
  }, [fadeValue, highlightValue, highlightFeatures]);

  /**
   * Handle tier selection
   */
  const handleTierSelect = useCallback((tier) => {
    setSelectedTier(tier);
    
    // Pulse animation
    pulseValue.value = withSequence(
      withTiming(1.05, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );

    // Track interaction
    console.log('FeatureComparison: Tier selected', {
      tier,
      context,
      currentTier,
      abTestVariant
    });
  }, [context, currentTier, abTestVariant, pulseValue]);

  /**
   * Handle upgrade action
   */
  const handleUpgrade = useCallback(async (targetTier) => {
    try {
      if (onUpgrade) {
        await onUpgrade({
          targetTier,
          currentTier,
          context: `${context}_comparison`,
          abTestVariant
        });
        return;
      }

      // Default upgrade flow
      const tierConfig = POSE_TIER_CONFIG[targetTier];
      const tierMeta = tierMetadata[targetTier];

      Alert.alert(
        `Upgrade to ${tierMeta.name}`,
        `${tierMeta.description}\n\nPrice: $${tierConfig.price}/${tierConfig.interval}\n\nKey benefits:\n${tierMeta.valueProps.slice(0, 3).map(prop => `• ${prop}`).join('\n')}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade Now',
            style: 'default',
            onPress: () => {
              console.log('FeatureComparison: Upgrade initiated', {
                targetTier,
                currentTier,
                price: tierConfig.price,
                context
              });

              Alert.alert(
                'Upgrade Processing',
                'Your upgrade is being processed. You will receive confirmation shortly.',
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );

    } catch (error) {
      Alert.alert('Error', 'Failed to process upgrade. Please try again.');
      console.error('FeatureComparison: Upgrade error:', error);
    }
  }, [onUpgrade, currentTier, context, abTestVariant, tierMetadata]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }]
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      highlightValue.value,
      [0, 1],
      ['rgba(249, 115, 22, 0.1)', 'rgba(249, 115, 22, 0.2)']
    )
  }));

  // Get theme-aware styles
  const styles = useMemo(() => createThemedStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: 'transparent'
    },

    // Table variant styles
    tableContainer: {
      backgroundColor: theme.colors.background.glass.medium,
      borderRadius: borderRadius.component.card.lg,
      padding: spacing[4],
      margin: spacing[2],
      borderWidth: 1,
      borderColor: theme.colors.border.medium,
      ...theme.shadows.md
    },
    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing[5],
      paddingBottom: spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.light
    },
    tableTitle: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.text.primary,
      flex: 1
    },
    tableSubtitle: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginTop: spacing[1]
    },

    // Tier columns
    tiersContainer: {
      flexDirection: 'row',
      marginBottom: spacing[4]
    },
    tierColumn: {
      flex: 1,
      marginHorizontal: spacing[1],
      backgroundColor: theme.colors.background.elevated,
      borderRadius: borderRadius.component.card.md,
      padding: spacing[4],
      borderWidth: 1,
      borderColor: theme.colors.border.light,
      position: 'relative'
    },
    tierColumnSelected: {
      borderWidth: 2,
      ...theme.shadows.lg
    },
    tierHeader: {
      alignItems: 'center',
      marginBottom: spacing[4]
    },
    tierBadge: {
      position: 'absolute',
      top: -8,
      left: spacing[2],
      right: spacing[2],
      paddingVertical: spacing[1],
      paddingHorizontal: spacing[2],
      borderRadius: borderRadius.base,
      alignItems: 'center'
    },
    tierBadgeText: {
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.bold,
      color: '#FFFFFF'
    },
    tierName: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginTop: spacing[2]
    },
    tierPrice: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginTop: spacing[1]
    },
    tierDescription: {
      fontSize: typography.fontSize.xs,
      color: theme.colors.text.tertiary,
      textAlign: 'center',
      marginTop: spacing[1]
    },

    // Feature rows
    featuresContainer: {
      marginTop: spacing[2]
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.light,
      position: 'relative'
    },
    featureRowHighlighted: {
      borderRadius: borderRadius.base,
      marginHorizontal: -spacing[2],
      paddingHorizontal: spacing[2]
    },
    featureName: {
      flex: 2,
      paddingRight: spacing[2]
    },
    featureNameText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      color: theme.colors.text.primary
    },
    featureDescription: {
      fontSize: typography.fontSize.xs,
      color: theme.colors.text.tertiary,
      marginTop: spacing[0.5]
    },
    featureCell: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: spacing[1]
    },
    featureIcon: {
      fontSize: 18
    },
    featureText: {
      fontSize: typography.fontSize.xs,
      color: theme.colors.text.secondary,
      marginTop: spacing[0.5],
      textAlign: 'center'
    },

    // Cards variant styles
    cardsContainer: {
      flexDirection: 'row',
      paddingHorizontal: spacing[4]
    },
    tierCard: {
      flex: 1,
      backgroundColor: theme.colors.background.glass.medium,
      borderRadius: borderRadius.component.card.lg,
      padding: spacing[5],
      marginHorizontal: spacing[2],
      borderWidth: 1,
      borderColor: theme.colors.border.medium,
      ...theme.shadows.md,
      position: 'relative'
    },
    tierCardSelected: {
      borderWidth: 2,
      ...theme.shadows.lg,
      transform: [{ scale: 1.02 }]
    },
    tierCardHeader: {
      alignItems: 'center',
      marginBottom: spacing[4]
    },
    tierCardIcon: {
      fontSize: 32,
      marginBottom: spacing[2]
    },
    tierCardName: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.text.primary
    },
    tierCardPrice: {
      fontSize: typography.fontSize.base,
      color: theme.colors.text.secondary,
      marginTop: spacing[1]
    },
    tierCardFeatures: {
      marginTop: spacing[4]
    },
    cardFeatureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing[2]
    },
    cardFeatureIcon: {
      fontSize: 14,
      marginRight: spacing[2],
      width: 16
    },
    cardFeatureText: {
      flex: 1,
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.primary
    },

    // Action buttons
    upgradeButton: {
      borderRadius: borderRadius.component.button.md,
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[4],
      alignItems: 'center',
      marginTop: spacing[4],
      ...theme.shadows.sm
    },
    upgradeButtonText: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      color: '#FFFFFF'
    },
    currentPlanBadge: {
      backgroundColor: theme.colors.background.elevated,
      borderWidth: 1,
      borderColor: theme.colors.border.medium,
      borderRadius: borderRadius.component.button.md,
      paddingVertical: spacing[2],
      paddingHorizontal: spacing[4],
      alignItems: 'center',
      marginTop: spacing[4]
    },
    currentPlanText: {
      fontSize: typography.fontSize.sm,
      color: theme.colors.text.secondary,
      fontWeight: typography.fontWeight.medium
    },

    // Hero variant styles
    heroContainer: {
      backgroundColor: theme.colors.background.glass.strong,
      borderRadius: borderRadius.component.card.hero,
      padding: spacing[6],
      margin: spacing[4],
      borderWidth: 1,
      borderColor: theme.colors.border.medium,
      ...theme.shadows.xl
    },
    heroHeader: {
      alignItems: 'center',
      marginBottom: spacing[6]
    },
    heroTitle: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.bold,
      color: theme.colors.text.primary,
      textAlign: 'center'
    },
    heroSubtitle: {
      fontSize: typography.fontSize.base,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginTop: spacing[2],
      lineHeight: typography.lineHeight.relaxed * typography.fontSize.base
    },
    heroTiers: {
      gap: spacing[4]
    }
  })), []);

  /**
   * Render feature cell content
   */
  const renderFeatureCell = useCallback((featureName, tier) => {
    const hasFeature = POSE_TIER_CONFIG[tier].features[featureName];
    const featureDef = featureDefinitions[featureName];

    if (featureName === 'analysisQuota') {
      const quota = POSE_TIER_CONFIG[tier].analysisQuota;
      return (
        <View style={styles.featureCell}>
          <Text style={styles.featureIcon}>
            {quota === -1 ? Icons.unlimited : quota.toString()}
          </Text>
          <Text style={styles.featureText}>
            {quota === -1 ? 'Unlimited' : `${quota}/month`}
          </Text>
        </View>
      );
    }

    if (featureName === 'historyDays') {
      const days = POSE_TIER_CONFIG[tier].features.historyDays;
      return (
        <View style={styles.featureCell}>
          <Text style={styles.featureIcon}>
            {days === -1 ? Icons.unlimited : `${days}d`}
          </Text>
          <Text style={styles.featureText}>
            {days === -1 ? 'Forever' : `${days} days`}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.featureCell}>
        <Text style={styles.featureIcon}>
          {hasFeature ? Icons.check : Icons.cross}
        </Text>
        {hasFeature && typeof hasFeature === 'string' && (
          <Text style={styles.featureText}>{hasFeature}</Text>
        )}
      </View>
    );
  }, [styles, featureDefinitions]);

  /**
   * Render table variant
   */
  const renderTableVariant = () => {
    const tiers = Object.keys(POSE_TIER_CONFIG);
    const features = [
      'analysisQuota',
      ...Object.keys(featureDefinitions),
      'historyDays'
    ];

    return (
      <View style={styles.tableContainer}>
        {/* Header */}
        <View style={styles.tableHeader}>
          <View>
            <Text style={styles.tableTitle}>Compare Plans</Text>
            <Text style={styles.tableSubtitle}>
              Choose the perfect plan for your fitness journey
            </Text>
          </View>
        </View>

        {/* Tier columns header */}
        <View style={styles.tiersContainer}>
          <View style={{ flex: 2 }} />
          {tiers.map(tier => {
            const tierMeta = tierMetadata[tier];
            const tierConfig = POSE_TIER_CONFIG[tier];
            const isSelected = selectedTier === tier;
            const isCurrent = currentTier === tier;

            return (
              <TouchableOpacity
                key={tier}
                style={[
                  styles.tierColumn,
                  isSelected && styles.tierColumnSelected,
                  { borderColor: tierMeta.color }
                ]}
                onPress={() => handleTierSelect(tier)}
              >
                {tierMeta.recommendation && (
                  <LinearGradient
                    colors={tierMeta.gradient}
                    style={styles.tierBadge}
                  >
                    <Text style={styles.tierBadgeText}>
                      {tierMeta.recommendation === 'popular' ? 'MOST POPULAR' : 'RECOMMENDED'}
                    </Text>
                  </LinearGradient>
                )}
                
                <View style={styles.tierHeader}>
                  <Text style={styles.tierName}>{tierMeta.name}</Text>
                  {showPricing && (
                    <Text style={styles.tierPrice}>
                      ${tierConfig.price}/{tierConfig.interval}
                    </Text>
                  )}
                  <Text style={styles.tierDescription}>
                    {tierMeta.description}
                  </Text>
                </View>

                {isCurrent ? (
                  <View style={styles.currentPlanBadge}>
                    <Text style={styles.currentPlanText}>Current Plan</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => handleUpgrade(tier)}>
                    <LinearGradient
                      colors={tierMeta.gradient}
                      style={styles.upgradeButton}
                    >
                      <Text style={styles.upgradeButtonText}>
                        Upgrade
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feature comparison table */}
        <ScrollView style={styles.featuresContainer}>
          {features.map(featureName => {
            const featureDef = featureDefinitions[featureName];
            const isHighlighted = highlightFeatures.includes(featureName);

            if (featureName === 'analysisQuota') {
              return (
                <Animated.View
                  key={featureName}
                  style={[
                    styles.featureRow,
                    isHighlighted && styles.featureRowHighlighted,
                    isHighlighted && highlightStyle
                  ]}
                >
                  <View style={styles.featureName}>
                    <Text style={styles.featureNameText}>Monthly Analyses</Text>
                    <Text style={styles.featureDescription}>
                      Number of pose analyses per month
                    </Text>
                  </View>
                  {tiers.map(tier => renderFeatureCell(featureName, tier))}
                </Animated.View>
              );
            }

            if (featureName === 'historyDays') {
              return (
                <Animated.View
                  key={featureName}
                  style={[
                    styles.featureRow,
                    isHighlighted && styles.featureRowHighlighted,
                    isHighlighted && highlightStyle
                  ]}
                >
                  <View style={styles.featureName}>
                    <Text style={styles.featureNameText}>History Retention</Text>
                    <Text style={styles.featureDescription}>
                      How long your analysis history is kept
                    </Text>
                  </View>
                  {tiers.map(tier => renderFeatureCell(featureName, tier))}
                </Animated.View>
              );
            }

            if (!featureDef) return null;

            return (
              <Animated.View
                key={featureName}
                style={[
                  styles.featureRow,
                  isHighlighted && styles.featureRowHighlighted,
                  isHighlighted && highlightStyle
                ]}
              >
                <View style={styles.featureName}>
                  <Text style={styles.featureNameText}>
                    {featureDef.icon} {featureDef.shortName}
                  </Text>
                  <Text style={styles.featureDescription}>
                    {featureDef.description}
                  </Text>
                </View>
                {tiers.map(tier => renderFeatureCell(featureName, tier))}
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  /**
   * Render cards variant
   */
  const renderCardsVariant = () => {
    const tiers = Object.keys(POSE_TIER_CONFIG);

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsContainer}
      >
        {tiers.map(tier => {
          const tierMeta = tierMetadata[tier];
          const tierConfig = POSE_TIER_CONFIG[tier];
          const isSelected = selectedTier === tier;
          const isCurrent = currentTier === tier;

          return (
            <Animated.View
              key={tier}
              style={[
                styles.tierCard,
                isSelected && styles.tierCardSelected,
                { borderColor: tierMeta.color },
                isSelected && pulseStyle
              ]}
            >
              {tierMeta.recommendation && (
                <LinearGradient
                  colors={tierMeta.gradient}
                  style={styles.tierBadge}
                >
                  <Text style={styles.tierBadgeText}>
                    {tierMeta.recommendation === 'popular' ? Icons.popular : Icons.recommended} {' '}
                    {tierMeta.tagline.toUpperCase()}
                  </Text>
                </LinearGradient>
              )}

              <View style={styles.tierCardHeader}>
                <Text style={styles.tierCardIcon}>
                  {tier === POSE_SUBSCRIPTION_TIERS.FREE ? Icons.target :
                   tier === POSE_SUBSCRIPTION_TIERS.PREMIUM ? Icons.rocket : Icons.crown}
                </Text>
                <Text style={styles.tierCardName}>{tierMeta.name}</Text>
                {showPricing && (
                  <Text style={styles.tierCardPrice}>
                    ${tierConfig.price}
                    <Text style={styles.featureText}>/{tierConfig.interval}</Text>
                  </Text>
                )}
              </View>

              <View style={styles.tierCardFeatures}>
                {tierMeta.valueProps.map((prop, index) => (
                  <View key={index} style={styles.cardFeatureItem}>
                    <Text style={styles.cardFeatureIcon}>{Icons.check}</Text>
                    <Text style={styles.cardFeatureText}>{prop}</Text>
                  </View>
                ))}
              </View>

              {isCurrent ? (
                <View style={styles.currentPlanBadge}>
                  <Text style={styles.currentPlanText}>{Icons.sparkle} Current Plan</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={() => handleUpgrade(tier)}>
                  <LinearGradient
                    colors={tierMeta.gradient}
                    style={styles.upgradeButton}
                  >
                    <Text style={styles.upgradeButtonText}>
                      Select {tierMeta.name}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </Animated.View>
          );
        })}
      </ScrollView>
    );
  };

  /**
   * Render hero variant
   */
  const renderHeroVariant = () => (
    <View style={styles.heroContainer}>
      <View style={styles.heroHeader}>
        <Text style={styles.heroTitle}>
          {Icons.rocket} Upgrade Your Pose Analysis
        </Text>
        <Text style={styles.heroSubtitle}>
          Unlock advanced features and take your fitness journey to the next level
        </Text>
      </View>

      <View style={styles.heroTiers}>
        {renderCardsVariant()}
      </View>
    </View>
  );

  // Main render
  return (
    <Animated.View style={[styles.container, style, containerStyle]}>
      {variant === 'table' && renderTableVariant()}
      {variant === 'cards' && renderCardsVariant()}
      {variant === 'hero' && renderHeroVariant()}
    </Animated.View>
  );
};

export default FeatureComparison;