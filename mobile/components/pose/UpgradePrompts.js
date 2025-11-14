/**
 * UpgradePrompts - Context-aware premium upgrade prompts
 * Displays targeted upgrade messaging based on user context and A/B testing
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GlassContainer } from '../GlassmorphismComponents';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

const UPGRADE_BENEFITS = [
  {
    icon: 'infinite-outline',
    title: 'Unlimited Analyses',
    description: 'Analyze as many videos as you want',
  },
  {
    icon: 'analytics-outline',
    title: 'Advanced Insights',
    description: 'Detailed biomechanical analysis',
  },
  {
    icon: 'document-text-outline',
    title: 'PDF Reports',
    description: 'Professional analysis reports',
  },
  {
    icon: 'trending-up-outline',
    title: 'Progress Tracking',
    description: 'Track improvements over time',
  },
];

export default function UpgradePrompts({
  visible,
  context,
  trigger,
  userStats = {},
  variant = 'modal',
  abTestVariant,
  onUpgrade,
  onDismiss,
  onLater
}) {
  const themeContext = useTheme();
  const { colors: themeColors = {} } = themeContext;
  const theme = themeColors;

  const getContextualMessage = () => {
    switch (context) {
      case 'quota_exceeded':
        return {
          title: "You've reached your limit",
          subtitle: `You've used ${userStats.analysisCount || 0} free analyses. Upgrade for unlimited access.`,
          emoji: '🎯',
        };
      case 'premium_feature':
        return {
          title: 'Unlock Premium Features',
          subtitle: 'Get access to advanced analysis tools and insights',
          emoji: '⭐',
        };
      case 'consistency_reward':
        return {
          title: `${userStats.streakDays || 0} Day Streak!`,
          subtitle: 'Keep your progress going with premium features',
          emoji: '🔥',
        };
      default:
        return {
          title: 'Upgrade to Premium',
          subtitle: 'Unlock all features and unlimited analyses',
          emoji: '💪',
        };
    }
  };

  const message = getContextualMessage();

  if (variant === 'banner' && visible) {
    return (
      <GlassContainer variant="medium" style={styles.banner}>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerEmoji}>{message.emoji}</Text>
          <View style={styles.bannerText}>
            <Text style={[styles.bannerTitle, { color: theme.text }]}>
              {message.title}
            </Text>
            <Text style={[styles.bannerSubtitle, { color: theme.textSecondary }]}>
              {message.subtitle}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.bannerButton, { backgroundColor: theme.primary }]}
          onPress={onUpgrade}
        >
          <Text style={styles.bannerButtonText}>Upgrade</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bannerClose} onPress={onDismiss}>
          <Ionicons name="close" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </GlassContainer>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <BlurView intensity={20} style={styles.overlay}>
        <View style={styles.modalContainer}>
          <GlassContainer variant="strong" style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.emoji}>{message.emoji}</Text>
              <Text style={[styles.title, { color: theme.text }]}>
                {message.title}
              </Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                {message.subtitle}
              </Text>
            </View>

            {/* Benefits */}
            <View style={styles.benefits}>
              {UPGRADE_BENEFITS.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={[styles.benefitIcon, { backgroundColor: `${theme.primary}20` }]}>
                    <Ionicons name={benefit.icon} size={24} color={theme.primary} />
                  </View>
                  <View style={styles.benefitText}>
                    <Text style={[styles.benefitTitle, { color: theme.text }]}>
                      {benefit.title}
                    </Text>
                    <Text style={[styles.benefitDescription, { color: theme.textSecondary }]}>
                      {benefit.description}
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
              ))}
            </View>

            {/* Pricing (placeholder) */}
            <GlassContainer variant="subtle" style={styles.pricing}>
              <Text style={[styles.price, { color: theme.text }]}>
                $9.99<Text style={styles.pricePeriod}>/month</Text>
              </Text>
              <Text style={[styles.priceDescription, { color: theme.textSecondary }]}>
                Cancel anytime
              </Text>
            </GlassContainer>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.upgradeButton, { backgroundColor: theme.primary }]}
                onPress={onUpgrade}
                accessibilityLabel="Upgrade to premium"
                accessibilityRole="button"
              >
                <Ionicons name="star" size={20} color="#FFFFFF" />
                <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.laterButton}
                onPress={onLater || onDismiss}
                accessibilityLabel="Maybe later"
                accessibilityRole="button"
              >
                <Text style={[styles.laterButtonText, { color: theme.textSecondary }]}>
                  Maybe Later
                </Text>
              </TouchableOpacity>
            </View>
          </GlassContainer>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxWidth: 400,
  },
  modal: {
    padding: 24,
    borderRadius: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefits: {
    gap: 16,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 14,
  },
  pricing: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
  },
  pricePeriod: {
    fontSize: 16,
    fontWeight: '400',
  },
  priceDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  actions: {
    gap: 12,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 24,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Banner variant styles
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    position: 'relative',
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerEmoji: {
    fontSize: 32,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 12,
  },
  bannerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginLeft: 12,
  },
  bannerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bannerClose: {
    padding: 4,
    marginLeft: 8,
  },
});
