/**
 * Usage Tracker Component
 * 
 * Displays pose analysis quota status, usage statistics, and subscription information.
 * Provides real-time updates and user-friendly quota management interface.
 * 
 * Features:
 * - Real-time quota display with visual indicators
 * - Billing period countdown and reset information
 * - Usage trends and analytics
 * - Upgrade prompts and subscription management
 * - Rate limiting status and warnings
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing
} from 'react-native-reanimated';

// Services
import usageTrackingService from '../../services/usageTrackingService';
import poseSubscriptionService, { POSE_SUBSCRIPTION_TIERS } from '../../services/poseSubscriptionService';

// Icons (using text-based icons for simplicity - in production would use vector icons)
const Icons = {
  analytics: '📊',
  warning: '⚠️',
  success: '✅',
  clock: '🕒',
  upgrade: '⬆️',
  refresh: '🔄',
  settings: '⚙️',
  trophy: '🏆',
  flame: '🔥',
  chart: '📈'
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Usage Tracker Component
 */
const UsageTracker = ({
  variant = 'full', // 'full', 'compact', 'minimal'
  showUpgradePrompt = true,
  showAnalytics = true,
  onUpgradePress,
  onRefresh,
  style
}) => {
  // State
  const [usageStatus, setUsageStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Animated values
  const progressValue = useSharedValue(0);
  const scaleValue = useSharedValue(1);
  const fadeValue = useSharedValue(0);

  // Refs
  const refreshIntervalRef = useRef(null);

  /**
   * Load usage status
   */
  const loadUsageStatus = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const status = await usageTrackingService.getUsageStatus();
      setUsageStatus(status);
      setLastUpdated(new Date());

      // Animate progress bar
      const percentage = status.quotas?.monthly?.percentage || 0;
      progressValue.value = withTiming(percentage / 100, {
        duration: 1000,
        easing: Easing.out(Easing.cubic)
      });

      // Fade in content
      fadeValue.value = withTiming(1, { duration: 500 });

    } catch (err) {
      console.error('Error loading usage status:', err);
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [progressValue, fadeValue]);

  /**
   * Load analytics data
   */
  const loadAnalytics = useCallback(async () => {
    if (!showAnalytics) return;

    try {
      const analyticsData = await usageTrackingService.getUsageAnalytics('30d');
      setAnalytics(analyticsData);
    } catch (err) {
      console.warn('Error loading analytics:', err);
    }
  }, [showAnalytics]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    scaleValue.value = withSpring(0.95);
    
    try {
      await Promise.all([
        loadUsageStatus(true),
        loadAnalytics()
      ]);
      
      onRefresh?.();
    } finally {
      setRefreshing(false);
      scaleValue.value = withSpring(1);
    }
  }, [loadUsageStatus, loadAnalytics, onRefresh, scaleValue]);

  /**
   * Handle upgrade press
   */
  const handleUpgradePress = useCallback(async () => {
    try {
      if (onUpgradePress) {
        onUpgradePress();
        return;
      }

      const upgradeOptions = await poseSubscriptionService.getUpgradeOptions();
      
      if (upgradeOptions.availableUpgrades.length === 0) {
        Alert.alert(
          'Already at Top Tier',
          'You already have access to all available features.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show upgrade options
      const options = upgradeOptions.availableUpgrades.map(upgrade => 
        `${upgrade.name} - $${upgrade.price}/${upgrade.interval}`
      );
      
      Alert.alert(
        'Upgrade Your Plan',
        'Choose an upgrade option to unlock more features and increase your analysis quota.',
        [
          { text: 'Cancel', style: 'cancel' },
          ...options.map((option, index) => ({
            text: option,
            onPress: () => handleUpgradeSelection(upgradeOptions.availableUpgrades[index])
          }))
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to load upgrade options. Please try again.');
    }
  }, [onUpgradePress]);

  /**
   * Handle upgrade selection
   */
  const handleUpgradeSelection = useCallback((upgradeOption) => {
    Alert.alert(
      `Upgrade to ${upgradeOption.name}`,
      `This will upgrade your plan to ${upgradeOption.name} for $${upgradeOption.price}/${upgradeOption.interval}.\n\nNew features:\n${upgradeOption.benefits.map(b => `• ${b.description || b.name}`).join('\n')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Upgrade Now', 
          style: 'default',
          onPress: () => {
            // In production, this would integrate with payment system
            Alert.alert(
              'Coming Soon',
              'Subscription upgrades will be available in the next update. Stay tuned!'
            );
          }
        }
      ]
    );
  }, []);

  /**
   * Setup auto-refresh
   */
  useEffect(() => {
    // Initial load
    loadUsageStatus();
    loadAnalytics();

    // Setup periodic refresh (every 5 minutes)
    refreshIntervalRef.current = setInterval(() => {
      loadUsageStatus(true);
    }, 5 * 60 * 1000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [loadUsageStatus, loadAnalytics]);

  /**
   * Animated styles
   */
  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value * 100}%`
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }],
      opacity: fadeValue.value
    };
  });

  /**
   * Get status color based on usage
   */
  const getStatusColor = useCallback((percentage, tier) => {
    if (tier === POSE_SUBSCRIPTION_TIERS.PREMIUM || tier === POSE_SUBSCRIPTION_TIERS.COACHING) {
      return '#4CAF50'; // Green for unlimited
    }
    
    if (percentage >= 90) return '#F44336'; // Red
    if (percentage >= 75) return '#FF9800'; // Orange
    return '#4CAF50'; // Green
  }, []);

  /**
   * Get status message
   */
  const getStatusMessage = useCallback((status) => {
    if (!status?.subscription) return 'Loading...';
    
    const { quotas, subscription } = status;
    
    if (subscription.tier === POSE_SUBSCRIPTION_TIERS.FREE) {
      if (quotas.monthly.remaining <= 0) {
        return `Quota exceeded. Resets in ${status.billingPeriod?.daysRemaining || 0} days.`;
      }
      return `${quotas.monthly.remaining} analyses remaining this month.`;
    }
    
    return 'Unlimited analyses available.';
  }, []);

  /**
   * Render components based on variant
   */
  if (variant === 'minimal') {
    return (
      <Animated.View style={[styles.minimalContainer, style, containerStyle]}>
        <View style={styles.minimalContent}>
          <Text style={styles.minimalText}>
            {usageStatus?.quotas?.monthly?.remaining === -1 
              ? '∞' 
              : usageStatus?.quotas?.monthly?.remaining || '0'
            }
          </Text>
          <Text style={styles.minimalLabel}>Remaining</Text>
        </View>
        {usageStatus?.quotas?.monthly?.percentage >= 75 && (
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(usageStatus.quotas.monthly.percentage, usageStatus.subscription.tier) }]} />
        )}
      </Animated.View>
    );
  }

  if (variant === 'compact') {
    return (
      <Animated.View style={[styles.compactContainer, style, containerStyle]}>
        <TouchableOpacity onPress={() => setShowDetails(!showDetails)} style={styles.compactHeader}>
          <Text style={styles.compactTitle}>
            {Icons.analytics} Pose Analysis Quota
          </Text>
          <View style={styles.compactStatus}>
            <Text style={styles.compactStatusText}>
              {usageStatus?.quotas?.monthly?.remaining === -1 
                ? 'Unlimited' 
                : `${usageStatus?.quotas?.monthly?.remaining || 0} left`
              }
            </Text>
            <View style={[
              styles.compactIndicator, 
              { backgroundColor: getStatusColor(usageStatus?.quotas?.monthly?.percentage || 0, usageStatus?.subscription?.tier) }
            ]} />
          </View>
        </TouchableOpacity>
        
        {showDetails && (
          <View style={styles.compactDetails}>
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, progressStyle, {
                  backgroundColor: getStatusColor(usageStatus?.quotas?.monthly?.percentage || 0, usageStatus?.subscription?.tier)
                }]} />
              </View>
              <Text style={styles.progressText}>
                {usageStatus?.quotas?.monthly?.used || 0} / {usageStatus?.quotas?.monthly?.limit === -1 ? '∞' : usageStatus?.quotas?.monthly?.limit}
              </Text>
            </View>
            <Text style={styles.statusMessage}>
              {getStatusMessage(usageStatus)}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  }

  // Full variant
  if (loading && !usageStatus) {
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <Text style={styles.loadingText}>{Icons.refresh} Loading usage data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorText}>{Icons.warning} Error loading usage data</Text>
        <TouchableOpacity onPress={() => loadUsageStatus()} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, style, containerStyle]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{Icons.analytics} Pose Analysis Usage</Text>
            <Text style={styles.subtitle}>
              {usageStatus?.subscription?.tierName || 'Free'} Plan
            </Text>
          </View>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Text style={styles.refreshIcon}>{Icons.refresh}</Text>
          </TouchableOpacity>
        </View>

        {/* Main Usage Card */}
        <LinearGradient
          colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          style={styles.usageCard}
        >
          <View style={styles.usageHeader}>
            <Text style={styles.usageTitle}>Monthly Quota</Text>
            <Text style={[styles.tierBadge, { 
              backgroundColor: usageStatus?.subscription?.tier === POSE_SUBSCRIPTION_TIERS.FREE ? '#FF9800' : '#4CAF50'
            }]}>
              {usageStatus?.subscription?.tierName || 'Free'}
            </Text>
          </View>

          {/* Quota Display */}
          <View style={styles.quotaDisplay}>
            {usageStatus?.quotas?.monthly?.limit === -1 ? (
              <View style={styles.unlimitedDisplay}>
                <Text style={styles.unlimitedText}>∞</Text>
                <Text style={styles.unlimitedLabel}>Unlimited Analyses</Text>
              </View>
            ) : (
              <>
                <View style={styles.quotaNumbers}>
                  <Text style={styles.quotaUsed}>
                    {usageStatus?.quotas?.monthly?.used || 0}
                  </Text>
                  <Text style={styles.quotaSeparator}>/</Text>
                  <Text style={styles.quotaTotal}>
                    {usageStatus?.quotas?.monthly?.limit || 0}
                  </Text>
                </View>
                <Text style={styles.quotaLabel}>Analyses Used</Text>
              </>
            )}
          </View>

          {/* Progress Bar (only for limited plans) */}
          {usageStatus?.quotas?.monthly?.limit !== -1 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, progressStyle, {
                  backgroundColor: getStatusColor(usageStatus?.quotas?.monthly?.percentage || 0, usageStatus?.subscription?.tier)
                }]} />
              </View>
              <Text style={styles.progressLabel}>
                {usageStatus?.quotas?.monthly?.percentage?.toFixed(0) || 0}% Used
              </Text>
            </View>
          )}

          {/* Status Message */}
          <View style={styles.statusRow}>
            <Text style={[styles.statusIcon, {
              color: getStatusColor(usageStatus?.quotas?.monthly?.percentage || 0, usageStatus?.subscription?.tier)
            }]}>
              {usageStatus?.quotas?.monthly?.percentage >= 90 ? Icons.warning : Icons.success}
            </Text>
            <Text style={styles.statusMessage}>
              {getStatusMessage(usageStatus)}
            </Text>
          </View>
        </LinearGradient>

        {/* Billing Period */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>{Icons.clock}</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Billing Period</Text>
              <Text style={styles.infoValue}>
                Resets in {usageStatus?.billingPeriod?.daysRemaining || 0} days
              </Text>
            </View>
          </View>
        </View>

        {/* Rate Limits Info */}
        {usageStatus?.rateLimits && (
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Rate Limits</Text>
            <View style={styles.rateLimitsGrid}>
              <View style={styles.rateLimitItem}>
                <Text style={styles.rateLimitLabel}>Per Minute</Text>
                <Text style={styles.rateLimitValue}>
                  {usageStatus.rateLimits.minute?.current || 0} / {usageStatus.rateLimits.minute?.limit || 5}
                </Text>
              </View>
              <View style={styles.rateLimitItem}>
                <Text style={styles.rateLimitLabel}>Concurrent</Text>
                <Text style={styles.rateLimitValue}>
                  {usageStatus.rateLimits.concurrent?.current || 0} / {usageStatus.rateLimits.concurrent?.limit || 3}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Analytics */}
        {showAnalytics && analytics && (
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>{Icons.chart} Usage Analytics (30 days)</Text>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>{analytics.totalSessions}</Text>
                <Text style={styles.analyticsLabel}>Total Analyses</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>{analytics.completedSessions}</Text>
                <Text style={styles.analyticsLabel}>Completed</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>
                  {analytics.performance?.averageScore?.toFixed(0) || 0}
                </Text>
                <Text style={styles.analyticsLabel}>Avg Score</Text>
              </View>
            </View>
          </View>
        )}

        {/* Upgrade Prompt */}
        {showUpgradePrompt && usageStatus?.subscription?.tier === POSE_SUBSCRIPTION_TIERS.FREE && (
          <TouchableOpacity style={styles.upgradeCard} onPress={handleUpgradePress}>
            <LinearGradient
              colors={['#FF6B6B', '#4ECDC4']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.upgradeGradient}
            >
              <Text style={styles.upgradeIcon}>{Icons.upgrade}</Text>
              <View style={styles.upgradeContent}>
                <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                <Text style={styles.upgradeDescription}>
                  Get unlimited pose analyses and advanced insights
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Last Updated */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
    overflow: 'hidden'
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
    padding: 20
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10
  },
  headerLeft: {
    flex: 1
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  refreshIcon: {
    fontSize: 20
  },

  // Usage Card styles
  usageCard: {
    margin: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  usageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a'
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    overflow: 'hidden'
  },

  // Quota Display styles
  quotaDisplay: {
    alignItems: 'center',
    marginBottom: 24
  },
  quotaNumbers: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8
  },
  quotaUsed: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1a1a1a'
  },
  quotaSeparator: {
    fontSize: 24,
    fontWeight: '400',
    color: '#666',
    marginHorizontal: 8
  },
  quotaTotal: {
    fontSize: 36,
    fontWeight: '800',
    color: '#666'
  },
  quotaLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  unlimitedDisplay: {
    alignItems: 'center'
  },
  unlimitedText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#4CAF50',
    marginBottom: 8
  },
  unlimitedLabel: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600'
  },

  // Progress Bar styles
  progressContainer: {
    marginBottom: 20
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4
  },

  // Status Row styles
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 8
  },
  statusMessage: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },

  // Info Card styles
  infoCard: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center'
  },
  infoContent: {
    flex: 1
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2
  },
  infoValue: {
    fontSize: 12,
    color: '#666'
  },

  // Rate Limits styles
  rateLimitsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  rateLimitItem: {
    alignItems: 'center'
  },
  rateLimitLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  rateLimitValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a'
  },

  // Analytics styles
  analyticsCard: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16
  },
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  analyticsItem: {
    alignItems: 'center'
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },

  // Upgrade Card styles
  upgradeCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden'
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20
  },
  upgradeIcon: {
    fontSize: 24,
    marginRight: 12
  },
  upgradeContent: {
    flex: 1
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4
  },
  upgradeDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)'
  },

  // Variant styles - Minimal
  minimalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    padding: 8,
    minWidth: 80
  },
  minimalContent: {
    alignItems: 'center',
    flex: 1
  },
  minimalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a'
  },
  minimalLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8
  },

  // Variant styles - Compact
  compactContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    overflow: 'hidden'
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a'
  },
  compactStatus: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  compactStatusText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8
  },
  compactIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  compactDetails: {
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)'
  },

  // Footer styles
  footer: {
    padding: 16,
    alignItems: 'center'
  },
  footerText: {
    fontSize: 11,
    color: '#999'
  },

  // Loading and Error styles
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 12
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 8
  },
  retryText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600'
  }
});

export default UsageTracker;