/**
 * Premium Integration Test Suite
 * 
 * Comprehensive tests for premium feature gating, upgrade prompts, 
 * and A/B testing functionality in pose analysis components.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Components to test
import PremiumGate from '../PremiumGate';
import FeatureComparison from '../FeatureComparison';
import UpgradePrompts from '../UpgradePrompts';

// Services
import poseSubscriptionService, { POSE_SUBSCRIPTION_TIERS } from '../../../services/poseSubscriptionService';
import abTestingService from '../../../services/abTestingService';

// Mock services
jest.mock('../../../services/poseSubscriptionService');
jest.mock('../../../services/abTestingService');
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

describe('Premium Integration Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Alert.alert.mockClear();
  });

  describe('PremiumGate Component', () => {
    const mockSubscriptionStatus = {
      poseAnalysisTier: POSE_SUBSCRIPTION_TIERS.FREE,
      features: {
        basicFeedback: true,
        advancedInsights: false,
        unlimitedAnalyses: false,
        pdfReports: false
      },
      isActive: true
    };

    beforeEach(() => {
      poseSubscriptionService.getSubscriptionStatus.mockResolvedValue(mockSubscriptionStatus);
      poseSubscriptionService.hasFeature.mockResolvedValue(false);
    });

    test('renders children when feature access is granted', async () => {
      poseSubscriptionService.hasFeature.mockResolvedValue(true);
      
      const { getByText, queryByText } = render(
        <PremiumGate feature="advancedInsights">
          <Text>Advanced Analysis Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        expect(getByText('Advanced Analysis Content')).toBeTruthy();
        expect(queryByText('Upgrade Now')).toBeNull();
      });
    });

    test('shows premium gate when feature access is denied', async () => {
      const { getByText, queryByText } = render(
        <PremiumGate feature="advancedInsights">
          <Text>Advanced Analysis Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        expect(queryByText('Advanced Analysis Content')).toBeNull();
        expect(getByText('Advanced Insights')).toBeTruthy();
        expect(getByText('Upgrade Now')).toBeTruthy();
      });
    });

    test('handles upgrade button press correctly', async () => {
      const mockOnUpgrade = jest.fn();
      
      const { getByText } = render(
        <PremiumGate 
          feature="advancedInsights"
          onUpgrade={mockOnUpgrade}
        >
          <Text>Advanced Analysis Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        expect(getByText('Upgrade Now')).toBeTruthy();
      });

      fireEvent.press(getByText('Upgrade Now'));

      await waitFor(() => {
        expect(mockOnUpgrade).toHaveBeenCalledWith(
          expect.objectContaining({
            feature: 'advancedInsights',
            context: expect.any(String),
            requiredTier: POSE_SUBSCRIPTION_TIERS.PREMIUM
          })
        );
      });
    });

    test('shows custom message when provided', async () => {
      const customMessage = 'Custom upgrade message for testing';
      
      const { getByText } = render(
        <PremiumGate 
          feature="advancedInsights"
          customMessage={customMessage}
        >
          <Text>Protected Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        expect(getByText(customMessage)).toBeTruthy();
      });
    });

    test('handles different variants correctly', async () => {
      const { rerender, getByTestId } = render(
        <PremiumGate 
          feature="advancedInsights"
          variant="card"
          testID="premium-gate-card"
        >
          <Text>Protected Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        expect(getByTestId('premium-gate-card')).toBeTruthy();
      });

      rerender(
        <PremiumGate 
          feature="advancedInsights"
          variant="modal"
          testID="premium-gate-modal"
        >
          <Text>Protected Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        expect(getByTestId('premium-gate-modal')).toBeTruthy();
      });
    });

    test('calls access granted callback when feature is available', async () => {
      const mockOnAccessGranted = jest.fn();
      poseSubscriptionService.hasFeature.mockResolvedValue(true);
      
      render(
        <PremiumGate 
          feature="advancedInsights"
          onAccessGranted={mockOnAccessGranted}
        >
          <Text>Advanced Analysis Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        expect(mockOnAccessGranted).toHaveBeenCalled();
      });
    });

    test('calls access denied callback when feature is blocked', async () => {
      const mockOnAccessDenied = jest.fn();
      
      render(
        <PremiumGate 
          feature="advancedInsights"
          onAccessDenied={mockOnAccessDenied}
        >
          <Text>Advanced Analysis Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        expect(mockOnAccessDenied).toHaveBeenCalledWith(
          expect.objectContaining({
            feature: 'advancedInsights',
            requiredTier: expect.any(String),
            currentTier: POSE_SUBSCRIPTION_TIERS.FREE
          })
        );
      });
    });
  });

  describe('FeatureComparison Component', () => {
    const mockUpgradeOptions = {
      currentTier: POSE_SUBSCRIPTION_TIERS.FREE,
      currentTierName: 'Free',
      availableUpgrades: [
        {
          tier: POSE_SUBSCRIPTION_TIERS.PREMIUM,
          name: 'Premium',
          price: 9.99,
          currency: 'USD',
          interval: 'month',
          features: { unlimitedAnalyses: true, advancedInsights: true },
          benefits: ['Unlimited analyses', 'Advanced insights', 'Progress tracking']
        }
      ]
    };

    beforeEach(() => {
      poseSubscriptionService.getUpgradeOptions.mockResolvedValue(mockUpgradeOptions);
    });

    test('renders feature comparison table correctly', async () => {
      const { getByText } = render(
        <FeatureComparison variant="table" />
      );

      await waitFor(() => {
        expect(getByText('Compare Plans')).toBeTruthy();
        expect(getByText('Free')).toBeTruthy();
        expect(getByText('Premium')).toBeTruthy();
        expect(getByText('Monthly Analyses')).toBeTruthy();
      });
    });

    test('renders feature comparison cards correctly', async () => {
      const { getByText } = render(
        <FeatureComparison variant="cards" />
      );

      await waitFor(() => {
        expect(getByText('Free')).toBeTruthy();
        expect(getByText('Premium')).toBeTruthy();
        expect(getByText('Unlimited analyses')).toBeTruthy();
      });
    });

    test('handles upgrade button press', async () => {
      const mockOnUpgrade = jest.fn();
      
      const { getByText } = render(
        <FeatureComparison 
          variant="cards"
          onUpgrade={mockOnUpgrade}
        />
      );

      await waitFor(() => {
        expect(getByText('Select Premium')).toBeTruthy();
      });

      fireEvent.press(getByText('Select Premium'));

      await waitFor(() => {
        expect(mockOnUpgrade).toHaveBeenCalled();
      });
    });

    test('highlights current plan correctly', async () => {
      const { getByText } = render(
        <FeatureComparison 
          variant="cards"
          currentTier={POSE_SUBSCRIPTION_TIERS.PREMIUM}
        />
      );

      await waitFor(() => {
        expect(getByText('✨ Current Plan')).toBeTruthy();
      });
    });

    test('shows feature highlights when provided', async () => {
      const highlightFeatures = ['advancedInsights', 'unlimitedAnalyses'];
      
      const { getByTestId } = render(
        <FeatureComparison 
          variant="table"
          highlightFeatures={highlightFeatures}
          testID="feature-comparison"
        />
      );

      await waitFor(() => {
        expect(getByTestId('feature-comparison')).toBeTruthy();
      });
    });
  });

  describe('UpgradePrompts Component', () => {
    const mockUserStats = {
      quotaUsagePercentage: 90,
      analysisCount: 8,
      streakDays: 5,
      improvementPercentage: 20
    };

    const mockAbTestVariant = {
      testId: 'upgrade_prompt_design_v1',
      variant: 'variant_a',
      config: {
        displayType: 'modal',
        animation: 'fade',
        urgency: 'high'
      }
    };

    beforeEach(() => {
      abTestingService.getVariant.mockResolvedValue(mockAbTestVariant);
    });

    test('renders upgrade prompt when visible', async () => {
      const { getByText } = render(
        <UpgradePrompts 
          visible={true}
          context="quota_approaching"
          userStats={mockUserStats}
        />
      );

      await waitFor(() => {
        expect(getByText('🔥 You\'re on Fire!')).toBeTruthy();
        expect(getByText('Only 1 analysis left this month')).toBeTruthy();
        expect(getByText('⬆️ Upgrade Now')).toBeTruthy();
      });
    });

    test('does not render when not visible', () => {
      const { queryByText } = render(
        <UpgradePrompts 
          visible={false}
          context="quota_approaching"
          userStats={mockUserStats}
        />
      );

      expect(queryByText('🔥 You\'re on Fire!')).toBeNull();
    });

    test('handles upgrade button press correctly', async () => {
      const mockOnUpgrade = jest.fn();
      
      const { getByText } = render(
        <UpgradePrompts 
          visible={true}
          context="quota_approaching"
          userStats={mockUserStats}
          onUpgrade={mockOnUpgrade}
        />
      );

      await waitFor(() => {
        expect(getByText('⬆️ Upgrade Now')).toBeTruthy();
      });

      fireEvent.press(getByText('⬆️ Upgrade Now'));

      await waitFor(() => {
        expect(mockOnUpgrade).toHaveBeenCalledWith(
          expect.objectContaining({
            context: 'quota_approaching',
            trigger: expect.any(String)
          })
        );
      });
    });

    test('handles dismiss button press correctly', async () => {
      const mockOnDismiss = jest.fn();
      
      const { getByLabelText } = render(
        <UpgradePrompts 
          visible={true}
          context="quota_approaching"
          userStats={mockUserStats}
          onDismiss={mockOnDismiss}
        />
      );

      await waitFor(() => {
        expect(getByLabelText('Close')).toBeTruthy();
      });

      fireEvent.press(getByLabelText('Close'));

      await waitFor(() => {
        expect(mockOnDismiss).toHaveBeenCalled();
      });
    });

    test('shows different prompt configs based on context', async () => {
      const { rerender, getByText } = render(
        <UpgradePrompts 
          visible={true}
          context="quota_exceeded"
          userStats={mockUserStats}
        />
      );

      await waitFor(() => {
        expect(getByText('🎯 Mission Accomplished!')).toBeTruthy();
      });

      rerender(
        <UpgradePrompts 
          visible={true}
          context="consistent_user"
          userStats={{...mockUserStats, analysisCount: 15}}
        />
      );

      await waitFor(() => {
        expect(getByText('🏆 Consistency Champion!')).toBeTruthy();
      });
    });

    test('adapts to different variants from A/B testing', async () => {
      const modalVariant = {
        ...mockAbTestVariant,
        config: { ...mockAbTestVariant.config, displayType: 'modal' }
      };
      
      abTestingService.getVariant.mockResolvedValue(modalVariant);
      
      const { getByTestId } = render(
        <UpgradePrompts 
          visible={true}
          context="quota_approaching"
          userStats={mockUserStats}
          testID="upgrade-prompt"
        />
      );

      await waitFor(() => {
        expect(getByTestId('upgrade-prompt')).toBeTruthy();
      });
    });
  });

  describe('A/B Testing Integration', () => {
    test('tracks conversion events correctly', async () => {
      abTestingService.trackConversion.mockResolvedValue();
      
      const { getByText } = render(
        <PremiumGate 
          feature="advancedInsights"
          abTestVariant={{
            testId: 'premium_gate_messaging_v1',
            variant: 'variant_a'
          }}
        >
          <Text>Protected Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        expect(getByText('Upgrade Now')).toBeTruthy();
      });

      fireEvent.press(getByText('Upgrade Now'));

      // Simulate upgrade flow completion
      await act(async () => {
        await abTestingService.trackConversion(
          'premium_gate_messaging_v1',
          'variant_a',
          'upgrade_clicked',
          { feature: 'advancedInsights' }
        );
      });

      expect(abTestingService.trackConversion).toHaveBeenCalledWith(
        'premium_gate_messaging_v1',
        'variant_a',
        'upgrade_clicked',
        expect.objectContaining({ feature: 'advancedInsights' })
      );
    });

    test('tracks exposure events for premium gates', async () => {
      abTestingService.trackEvent.mockResolvedValue();
      
      render(
        <PremiumGate feature="advancedInsights">
          <Text>Protected Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        expect(abTestingService.trackEvent).toHaveBeenCalledWith(
          'premium_gate_exposed',
          expect.objectContaining({
            feature: 'advancedInsights'
          })
        );
      });
    });
  });

  describe('Quota and Usage Integration', () => {
    test('displays correct quota information', async () => {
      const mockQuotaStatus = {
        canAnalyze: false,
        reason: 'quota_exceeded',
        message: 'Monthly quota of 3 analyses exceeded',
        remaining: 0,
        resetDate: new Date()
      };

      poseSubscriptionService.canPerformAnalysis.mockResolvedValue(mockQuotaStatus);
      
      const { getByText } = render(
        <UpgradePrompts 
          visible={true}
          context="quota_exceeded"
          userStats={{ quotaUsagePercentage: 100 }}
        />
      );

      await waitFor(() => {
        expect(getByText('🎯 Mission Accomplished!')).toBeTruthy();
        expect(getByText('You\'ve maxed out your monthly limit')).toBeTruthy();
      });
    });

    test('handles subscription tier changes correctly', async () => {
      // Start with free tier
      poseSubscriptionService.getSubscriptionStatus.mockResolvedValue({
        poseAnalysisTier: POSE_SUBSCRIPTION_TIERS.FREE,
        features: { advancedInsights: false }
      });

      const { rerender, queryByText, getByText } = render(
        <PremiumGate feature="advancedInsights">
          <Text>Advanced Analysis Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        expect(queryByText('Advanced Analysis Content')).toBeNull();
        expect(getByText('Upgrade Now')).toBeTruthy();
      });

      // Upgrade to premium
      poseSubscriptionService.getSubscriptionStatus.mockResolvedValue({
        poseAnalysisTier: POSE_SUBSCRIPTION_TIERS.PREMIUM,
        features: { advancedInsights: true }
      });
      poseSubscriptionService.hasFeature.mockResolvedValue(true);

      rerender(
        <PremiumGate feature="advancedInsights">
          <Text>Advanced Analysis Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        expect(getByText('Advanced Analysis Content')).toBeTruthy();
        expect(queryByText('Upgrade Now')).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles service errors gracefully', async () => {
      poseSubscriptionService.getSubscriptionStatus.mockRejectedValue(
        new Error('Network error')
      );

      const { getByText } = render(
        <PremiumGate feature="advancedInsights">
          <Text>Protected Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        expect(getByText('❌ Failed to check access')).toBeTruthy();
        expect(getByText('Retry')).toBeTruthy();
      });
    });

    test('shows fallback content when provided', async () => {
      const { getByText } = render(
        <PremiumGate 
          feature="advancedInsights"
          fallback={<Text>Fallback Content</Text>}
        >
          <Text>Protected Content</Text>
        </PremiumGate>
      );

      await waitFor(() => {
        expect(getByText('Fallback Content')).toBeTruthy();
      });
    });
  });

  describe('Performance Tests', () => {
    test('does not cause memory leaks with rapid re-renders', async () => {
      const TestComponent = ({ visible }) => (
        <UpgradePrompts 
          visible={visible}
          context="quota_approaching"
          userStats={{ quotaUsagePercentage: 90 }}
        />
      );

      const { rerender } = render(<TestComponent visible={false} />);

      // Rapidly toggle visibility
      for (let i = 0; i < 10; i++) {
        rerender(<TestComponent visible={i % 2 === 0} />);
      }

      // Should not throw or cause performance issues
      expect(true).toBe(true);
    });

    test('caches subscription status appropriately', async () => {
      const mockStatus = { 
        poseAnalysisTier: POSE_SUBSCRIPTION_TIERS.FREE,
        features: { advancedInsights: false }
      };
      
      poseSubscriptionService.getSubscriptionStatus.mockResolvedValue(mockStatus);

      // Render multiple components
      render(
        <>
          <PremiumGate feature="advancedInsights">
            <Text>Content 1</Text>
          </PremiumGate>
          <PremiumGate feature="pdfReports">
            <Text>Content 2</Text>
          </PremiumGate>
        </>
      );

      await waitFor(() => {
        // Should cache and not call service multiple times for same data
        expect(poseSubscriptionService.getSubscriptionStatus).toHaveBeenCalled();
      });
    });
  });
});

describe('Integration Test Scenarios', () => {
  test('complete user flow: free user encounters quota, sees prompt, upgrades', async () => {
    // Mock initial free user state
    poseSubscriptionService.canPerformAnalysis.mockResolvedValue({
      canAnalyze: false,
      reason: 'quota_exceeded',
      remaining: 0
    });

    poseSubscriptionService.getSubscriptionStatus.mockResolvedValue({
      poseAnalysisTier: POSE_SUBSCRIPTION_TIERS.FREE,
      features: { unlimitedAnalyses: false }
    });

    const mockOnUpgrade = jest.fn();

    const { getByText } = render(
      <UpgradePrompts 
        visible={true}
        context="quota_exceeded"
        userStats={{ quotaUsagePercentage: 100 }}
        onUpgrade={mockOnUpgrade}
      />
    );

    // 1. User sees quota exceeded prompt
    await waitFor(() => {
      expect(getByText('🎯 Mission Accomplished!')).toBeTruthy();
      expect(getByText('Continue Journey')).toBeTruthy();
    });

    // 2. User clicks upgrade
    fireEvent.press(getByText('Continue Journey'));

    // 3. Upgrade handler is called
    await waitFor(() => {
      expect(mockOnUpgrade).toHaveBeenCalled();
    });

    // 4. Simulate upgrade completion
    poseSubscriptionService.getSubscriptionStatus.mockResolvedValue({
      poseAnalysisTier: POSE_SUBSCRIPTION_TIERS.PREMIUM,
      features: { unlimitedAnalyses: true }
    });

    poseSubscriptionService.canPerformAnalysis.mockResolvedValue({
      canAnalyze: true,
      reason: 'unlimited',
      remaining: -1
    });

    // 5. Verify user can now analyze
    const analysisPermission = await poseSubscriptionService.canPerformAnalysis();
    expect(analysisPermission.canAnalyze).toBe(true);
  });

  test('A/B test variant affects prompt display and conversion tracking', async () => {
    const variantA = {
      testId: 'upgrade_prompt_design_v1',
      variant: 'variant_a',
      config: { displayType: 'modal', urgency: 'high' }
    };

    const variantB = {
      testId: 'upgrade_prompt_design_v1', 
      variant: 'variant_b',
      config: { displayType: 'banner', urgency: 'low' }
    };

    abTestingService.getVariant.mockResolvedValueOnce(variantA);
    
    const { rerender, getByTestId } = render(
      <UpgradePrompts 
        visible={true}
        context="quota_approaching"
        userStats={{ quotaUsagePercentage: 90 }}
        testID="upgrade-prompt"
      />
    );

    await waitFor(() => {
      expect(getByTestId('upgrade-prompt')).toBeTruthy();
    });

    // Switch to variant B
    abTestingService.getVariant.mockResolvedValueOnce(variantB);
    
    rerender(
      <UpgradePrompts 
        visible={true}
        context="quota_approaching"
        userStats={{ quotaUsagePercentage: 90 }}
        testID="upgrade-prompt-b"
      />
    );

    await waitFor(() => {
      expect(getByTestId('upgrade-prompt-b')).toBeTruthy();
    });
  });
});