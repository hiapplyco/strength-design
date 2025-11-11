/**
 * Upgrade Flow Integration Tests
 * 
 * Comprehensive test suite for Stream C - Upgrade Flow Integration
 * Tests the complete user journey from upgrade screen to post-purchase success.
 * 
 * Test Coverage:
 * - PoseUpgradeScreen full user flow
 * - SubscriptionPlans interaction and selection
 * - PremiumBenefits display and engagement
 * - Payment integration with Stripe
 * - Error handling and recovery flows
 * - Post-upgrade success experience
 * - A/B testing integration
 * - Analytics tracking
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Components under test
import PoseUpgradeScreen from '../../../screens/pose/PoseUpgradeScreen';
import SubscriptionPlans from '../SubscriptionPlans';
import PremiumBenefits from '../PremiumBenefits';
import UpgradeSuccessModal from '../UpgradeSuccessModal';
import UpgradeErrorHandler from '../UpgradeErrorHandler';

// Services (mocked)
import poseSubscriptionService, { POSE_SUBSCRIPTION_TIERS } from '../../../services/poseSubscriptionService';
import usageTrackingService from '../../../services/usageTrackingService';
import abTestingService from '../../../services/abTestingService';

// Test utilities
import { createMockNavigation, createMockRoute } from '../../../__tests__/utils/navigationMocks';
import { createMockUser, createMockSubscription } from '../../../__tests__/utils/dataMocks';

// Mock external dependencies
jest.mock('../../../services/poseSubscriptionService');
jest.mock('../../../services/usageTrackingService');
jest.mock('../../../services/abTestingService');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('Upgrade Flow Integration Tests', () => {
  let mockNavigation;
  let mockRoute;
  let mockUser;
  let mockSubscription;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    AsyncStorage.clear();

    // Setup navigation mocks
    mockNavigation = createMockNavigation();
    mockRoute = createMockRoute({
      source: 'pose_analysis',
      feature: 'advanced_insights',
      context: 'upload_screen'
    });

    // Setup user and subscription mocks
    mockUser = createMockUser({ tier: 'free' });
    mockSubscription = createMockSubscription({ tier: 'free', quotaUsed: 2, quotaTotal: 3 });

    // Setup service mocks
    poseSubscriptionService.getSubscriptionStatus.mockResolvedValue(mockSubscription);
    usageTrackingService.getUsageStatus.mockResolvedValue({
      usagePercentage: 67,
      monthlyCount: 2,
      dailyCount: 1
    });
    abTestingService.getTestVariant.mockResolvedValue({
      variant: 'control',
      config: { showAnnualDiscount: false }
    });
    abTestingService.trackEvent.mockResolvedValue();
    abTestingService.trackConversion.mockResolvedValue();
  });

  describe('PoseUpgradeScreen', () => {
    it('should render upgrade screen with compelling value proposition', async () => {
      const { getByText, getByTestId } = render(
        <PoseUpgradeScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Perfect Your Form')).toBeTruthy();
        expect(getByText(/Unlock advanced pose analysis/)).toBeTruthy();
        expect(getByTestId('usage-tracker')).toBeTruthy();
      });
    });

    it('should track screen view analytics', async () => {
      render(<PoseUpgradeScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(abTestingService.trackEvent).toHaveBeenCalledWith(
          'pose_upgrade_screen_viewed',
          expect.objectContaining({
            source: 'pose_analysis',
            feature: 'advanced_insights',
            context: 'upload_screen',
            currentTier: 'free'
          })
        );
      });
    });

    it('should display contextual upgrade prompts based on usage', async () => {
      // High usage scenario
      usageTrackingService.getUsageStatus.mockResolvedValue({
        usagePercentage: 90,
        monthlyCount: 2.7,
        dailyCount: 1
      });

      const { getByText } = render(
        <PoseUpgradeScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText(/90% of your monthly quota used/)).toBeTruthy();
      });
    });

    it('should handle plan selection and tracking', async () => {
      const { getByTestId } = render(
        <PoseUpgradeScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        const premiumPlan = getByTestId('plan-premium');
        fireEvent.press(premiumPlan);
      });

      expect(abTestingService.trackEvent).toHaveBeenCalledWith(
        'pose_plan_selected',
        expect.objectContaining({
          selectedTier: 'premium',
          previousTier: 'free'
        })
      );
    });
  });

  describe('SubscriptionPlans Component', () => {
    const defaultProps = {
      currentTier: POSE_SUBSCRIPTION_TIERS.FREE,
      selectedTier: POSE_SUBSCRIPTION_TIERS.PREMIUM,
      onPlanSelect: jest.fn(),
      onUpgrade: jest.fn()
    };

    it('should render all subscription tiers correctly', () => {
      const { getByText } = render(<SubscriptionPlans {...defaultProps} />);

      expect(getByText('Free')).toBeTruthy();
      expect(getByText('Premium')).toBeTruthy();
      expect(getByText('Coaching')).toBeTruthy();
      expect(getByText('Most Popular')).toBeTruthy();
    });

    it('should highlight selected tier', () => {
      const { getByTestId } = render(<SubscriptionPlans {...defaultProps} />);
      
      const premiumCard = getByTestId('plan-card-premium');
      expect(premiumCard.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ borderColor: expect.any(String) })
        ])
      );
    });

    it('should show A/B testing variants correctly', () => {
      const abTestVariant = {
        variant: 'discount',
        config: { 
          showAnnualDiscount: true,
          pricingVariant: 'discount'
        }
      };

      const { getByText } = render(
        <SubscriptionPlans {...defaultProps} abTestVariant={abTestVariant} showAnnualDiscount={true} />
      );

      expect(getByText('Annual')).toBeTruthy();
      expect(getByText('-17%')).toBeTruthy();
    });

    it('should handle plan selection interaction', async () => {
      const onPlanSelect = jest.fn();
      const { getByTestId } = render(
        <SubscriptionPlans {...defaultProps} onPlanSelect={onPlanSelect} />
      );

      fireEvent.press(getByTestId('plan-coaching'));
      
      await waitFor(() => {
        expect(onPlanSelect).toHaveBeenCalledWith('coaching');
      });
    });

    it('should prevent upgrades for current tier', () => {
      const { getByTestId } = render(
        <SubscriptionPlans 
          {...defaultProps} 
          currentTier={POSE_SUBSCRIPTION_TIERS.PREMIUM}
          selectedTier={POSE_SUBSCRIPTION_TIERS.PREMIUM}
        />
      );

      const premiumButton = getByTestId('upgrade-button-premium');
      expect(premiumButton.props.disabled).toBe(true);
    });
  });

  describe('PremiumBenefits Component', () => {
    const defaultProps = {
      variant: 'detailed',
      showTestimonials: true,
      highlightTier: 'premium'
    };

    it('should render premium benefits with icons and descriptions', () => {
      const { getByText } = render(<PremiumBenefits {...defaultProps} />);

      expect(getByText('Unlimited Analyses')).toBeTruthy();
      expect(getByText('Advanced AI Insights')).toBeTruthy();
      expect(getByText('Progress Visualization')).toBeTruthy();
      expect(getByText(/85% improvement in form quality/)).toBeTruthy();
    });

    it('should show testimonials with success metrics', () => {
      const { getByText } = render(<PremiumBenefits {...defaultProps} />);

      expect(getByText('Sarah Mitchell')).toBeTruthy();
      expect(getByText('40% form improvement')).toBeTruthy();
      expect(getByText(/knee pain is completely gone/)).toBeTruthy();
    });

    it('should expand benefit details on interaction', async () => {
      const { getByText, getByTestId } = render(<PremiumBenefits {...defaultProps} />);

      fireEvent.press(getByTestId('benefit-unlimited_analyses'));

      await waitFor(() => {
        expect(getByText('Before')).toBeTruthy();
        expect(getByText('After')).toBeTruthy();
        expect(getByText('3 analyses/month')).toBeTruthy();
        expect(getByText('Unlimited')).toBeTruthy();
      });
    });

    it('should cycle through testimonials automatically', async () => {
      jest.useFakeTimers();
      
      const { getByText, queryByText } = render(<PremiumBenefits {...defaultProps} />);

      expect(getByText('Sarah Mitchell')).toBeTruthy();
      expect(queryByText('Mike Rodriguez')).toBeFalsy();

      // Fast forward through testimonial rotation
      act(() => {
        jest.advanceTimersByTime(8000);
      });

      await waitFor(() => {
        expect(queryByText('Sarah Mitchell')).toBeFalsy();
        expect(getByText('Mike Rodriguez')).toBeTruthy();
      });

      jest.useRealTimers();
    });
  });

  describe('Payment Integration', () => {
    it('should create checkout session with correct parameters', async () => {
      poseSubscriptionService.createCheckoutSession.mockResolvedValue({
        success: true,
        sessionId: 'cs_test_123',
        checkoutUrl: 'https://checkout.stripe.com/test'
      });

      const { getByTestId } = render(
        <PoseUpgradeScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        fireEvent.press(getByTestId('upgrade-button'));
      });

      expect(poseSubscriptionService.createCheckoutSession).toHaveBeenCalledWith({
        tier: 'premium',
        source: 'pose_upgrade_screen',
        context: 'upload_screen',
        feature: 'advanced_insights',
        abTestVariant: 'control',
        userId: expect.any(String)
      });
    });

    it('should navigate to checkout on successful session creation', async () => {
      poseSubscriptionService.createCheckoutSession.mockResolvedValue({
        success: true,
        sessionId: 'cs_test_123',
        checkoutUrl: 'https://checkout.stripe.com/test'
      });

      const { getByTestId } = render(
        <PoseUpgradeScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        fireEvent.press(getByTestId('upgrade-button'));
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('CheckoutScreen', 
        expect.objectContaining({
          sessionId: 'cs_test_123',
          tier: 'premium'
        })
      );
    });

    it('should handle checkout creation failure', async () => {
      poseSubscriptionService.createCheckoutSession.mockResolvedValue({
        success: false,
        error: 'Payment service unavailable'
      });

      const { getByTestId } = render(
        <PoseUpgradeScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        fireEvent.press(getByTestId('upgrade-button'));
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Upgrade Failed',
        expect.stringContaining('Payment service unavailable')
      );
    });
  });

  describe('Error Handling', () => {
    it('should display error modal for payment failures', () => {
      const error = new Error('Payment declined');
      const { getByText } = render(
        <UpgradeErrorHandler 
          error={error}
          visible={true}
          context="upgrade"
          tier="premium"
        />
      );

      expect(getByText('Payment Method Declined')).toBeTruthy();
      expect(getByText(/payment method was declined/)).toBeTruthy();
    });

    it('should provide appropriate recovery actions', () => {
      const error = new Error('Network request failed');
      const { getByText } = render(
        <UpgradeErrorHandler 
          error={error}
          visible={true}
          context="upgrade"
          tier="premium"
        />
      );

      expect(getByText('Check Connection')).toBeTruthy();
      expect(getByText('Try Again')).toBeTruthy();
      expect(getByText('Go Back')).toBeTruthy();
    });

    it('should track error analytics', async () => {
      const error = new Error('Payment failed');
      render(
        <UpgradeErrorHandler 
          error={error}
          visible={true}
          context="upgrade"
          tier="premium"
        />
      );

      await waitFor(() => {
        expect(abTestingService.trackEvent).toHaveBeenCalledWith(
          'upgrade_error_occurred',
          expect.objectContaining({
            errorType: 'payment_failed',
            errorMessage: 'Payment failed',
            context: 'upgrade',
            tier: 'premium'
          })
        );
      });
    });
  });

  describe('Success Flow', () => {
    it('should show success modal after upgrade completion', () => {
      const { getByText } = render(
        <UpgradeSuccessModal 
          visible={true}
          tier="premium"
          subscriptionDetails={{ amount: 999, currency: 'usd' }}
        />
      );

      expect(getByText('Welcome to Premium!')).toBeTruthy();
      expect(getByText(/unlimited access to advanced pose analysis/)).toBeTruthy();
    });

    it('should display tier-specific features in success modal', () => {
      const { getByText } = render(
        <UpgradeSuccessModal 
          visible={true}
          tier="coaching"
          subscriptionDetails={{ amount: 1999, currency: 'usd' }}
        />
      );

      expect(getByText('Welcome to Coaching Pro!')).toBeTruthy();
      expect(getByText('PDF Reports')).toBeTruthy();
      expect(getByText('Trainer Collaboration')).toBeTruthy();
    });

    it('should handle feature exploration in success modal', async () => {
      const onFeatureAction = jest.fn();
      const { getByTestId } = render(
        <UpgradeSuccessModal 
          visible={true}
          tier="premium"
          onFeatureAction={onFeatureAction}
        />
      );

      await waitFor(() => {
        fireEvent.press(getByTestId('feature-unlimited_analyses'));
      });

      expect(onFeatureAction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'unlimited_analyses',
          title: 'Unlimited Analyses'
        })
      );
    });

    it('should auto-close success modal after delay', async () => {
      jest.useFakeTimers();
      const onClose = jest.fn();
      
      render(
        <UpgradeSuccessModal 
          visible={true}
          tier="premium"
          onClose={onClose}
          autoCloseDelay={5000}
        />
      );

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });

  describe('A/B Testing Integration', () => {
    it('should request appropriate A/B test variants', async () => {
      render(<PoseUpgradeScreen navigation={mockNavigation} route={mockRoute} />);

      await waitFor(() => {
        expect(abTestingService.getTestVariant).toHaveBeenCalledWith(
          'POSE_UPGRADE_SCREEN_OPTIMIZATION',
          'upgrade_screen_viewed'
        );
      });
    });

    it('should apply A/B test configurations correctly', async () => {
      const variant = {
        variant: 'benefits_focused',
        config: {
          heroTitle: 'Transform Your Training',
          heroSubtitle: 'Join thousands of athletes improving their form',
          showAnnualDiscount: true
        }
      };
      
      abTestingService.getTestVariant.mockResolvedValue(variant);

      const { getByText } = render(
        <PoseUpgradeScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        expect(getByText('Transform Your Training')).toBeTruthy();
        expect(getByText(/Join thousands of athletes/)).toBeTruthy();
      });
    });

    it('should track A/B test conversions', async () => {
      const variant = { variant: 'control', config: {} };
      abTestingService.getTestVariant.mockResolvedValue(variant);
      
      poseSubscriptionService.createCheckoutSession.mockResolvedValue({
        success: true,
        sessionId: 'cs_test_123'
      });

      const { getByTestId } = render(
        <PoseUpgradeScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        fireEvent.press(getByTestId('upgrade-button'));
      });

      expect(abTestingService.trackEvent).toHaveBeenCalledWith(
        'pose_upgrade_attempted',
        expect.objectContaining({
          selectedTier: 'premium',
          variant: 'control'
        })
      );
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner while initializing', () => {
      // Make service calls hang
      poseSubscriptionService.getSubscriptionStatus.mockImplementation(
        () => new Promise(resolve => {})
      );

      const { getByText } = render(
        <PoseUpgradeScreen navigation={mockNavigation} route={mockRoute} />
      );

      expect(getByText('Loading upgrade options...')).toBeTruthy();
    });

    it('should show processing state during payment', async () => {
      poseSubscriptionService.createCheckoutSession.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { getByTestId, getByText } = render(
        <PoseUpgradeScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        fireEvent.press(getByTestId('upgrade-button'));
      });

      expect(getByText('Processing...')).toBeTruthy();
    });

    it('should disable buttons during processing', async () => {
      poseSubscriptionService.createCheckoutSession.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { getByTestId } = render(
        <PoseUpgradeScreen navigation={mockNavigation} route={mockRoute} />
      );

      await waitFor(() => {
        fireEvent.press(getByTestId('upgrade-button'));
      });

      const upgradeButton = getByTestId('upgrade-button');
      expect(upgradeButton.props.disabled).toBe(true);
    });
  });

  describe('Integration with Existing Services', () => {
    it('should refresh subscription status after upgrade', async () => {
      const updatedSubscription = createMockSubscription({ 
        tier: 'premium', 
        quotaUsed: 0, 
        quotaTotal: -1 
      });

      poseSubscriptionService.handleUpgradeSuccess.mockResolvedValue({
        success: true,
        subscription: updatedSubscription
      });

      const screen = render(
        <PoseUpgradeScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Simulate upgrade success
      await act(async () => {
        screen.rerender(
          <PoseUpgradeScreen navigation={mockNavigation} route={mockRoute} />
        );
      });

      // Should have refreshed subscription
      expect(poseSubscriptionService.getSubscriptionStatus).toHaveBeenCalledWith(true);
    });

    it('should update usage tracking after upgrade', async () => {
      const { getByTestId } = render(
        <PoseUpgradeScreen navigation={mockNavigation} route={mockRoute} />
      );

      // Simulate successful upgrade
      poseSubscriptionService.handleUpgradeSuccess.mockResolvedValue({
        success: true,
        subscription: createMockSubscription({ tier: 'premium' })
      });

      await waitFor(() => {
        expect(usageTrackingService.getUsageStatus).toHaveBeenCalled();
      });
    });
  });
});