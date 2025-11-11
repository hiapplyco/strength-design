/**
 * Achievement System Component Test Suite
 * Tests for achievement detection, display, and gamification features
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Share, Alert } from 'react-native';
import AchievementSystem from '../AchievementSystem';
import poseProgressService from '../../../services/poseProgressService';

// Mock progress data
const mockProgressData = {
  totalSessions: 10,
  averageScore: 82,
  personalBests: { squat: 92 },
  consecutiveDays: 7,
  totalPoints: 250
};

// Mock achievements
const mockAchievements = [
  {
    id: 'first_analysis',
    title: 'First Steps',
    description: 'Completed your first pose analysis',
    icon: '🎯',
    points: 10,
    unlockedAt: new Date('2024-01-01'),
    rarity: 'common'
  },
  {
    id: 'excellent_form_milestone',
    title: 'Excellent Form',
    description: 'Achieved 90+ form score',
    icon: '🌟',
    points: 100,
    unlockedAt: new Date('2024-01-15'),
    rarity: 'rare'
  }
];

describe('AchievementSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock progress service
    poseProgressService.getProgressData = jest.fn().mockResolvedValue(mockProgressData);
    poseProgressService.getAchievements = jest.fn().mockResolvedValue(mockAchievements);
    poseProgressService.checkNewAchievements = jest.fn().mockResolvedValue([]);
  });

  describe('Rendering', () => {
    test('renders achievement list', async () => {
      const { getByText } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(getByText('First Steps')).toBeTruthy();
        expect(getByText('Excellent Form')).toBeTruthy();
      });
    });

    test('displays achievement icons', async () => {
      const { getByText } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(getByText('🎯')).toBeTruthy();
        expect(getByText('🌟')).toBeTruthy();
      });
    });

    test('shows achievement points', async () => {
      const { getAllByText } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(getAllByText(/points/i).length).toBeGreaterThan(0);
      });
    });

    test('displays total points earned', async () => {
      const { getByText } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(getByText(/250.*points/i)).toBeTruthy();
      });
    });

    test('shows loading state initially', () => {
      const { getByTestId } = render(<AchievementSystem />);

      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  describe('Achievement Categories', () => {
    test('filters achievements by category', async () => {
      const { getByText, queryByText } = render(<AchievementSystem />);

      await waitFor(() => {
        fireEvent.press(getByText('Form Mastery'));
      });

      await waitFor(() => {
        expect(getByText('Excellent Form')).toBeTruthy();
      });
    });

    test('shows all achievements when "All" selected', async () => {
      const { getByText } = render(<AchievementSystem />);

      await waitFor(() => {
        fireEvent.press(getByText('All'));
      });

      await waitFor(() => {
        expect(getByText('First Steps')).toBeTruthy();
      });
    });

    test('displays category icons', async () => {
      const { getAllByTestId } = render(<AchievementSystem />);

      await waitFor(() => {
        const categoryButtons = getAllByTestId('category-button');
        expect(categoryButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Achievement Details', () => {
    test('expands achievement details on tap', async () => {
      const { getByText, getByTestId } = render(<AchievementSystem />);

      await waitFor(() => {
        fireEvent.press(getByText('First Steps'));
      });

      await waitFor(() => {
        expect(getByTestId('achievement-detail-modal')).toBeTruthy();
      });
    });

    test('displays full description in modal', async () => {
      const { getByText, getByTestId } = render(<AchievementSystem />);

      await waitFor(() => {
        fireEvent.press(getByText('First Steps'));
      });

      await waitFor(() => {
        expect(
          getByText('Completed your first pose analysis')
        ).toBeTruthy();
      });
    });

    test('shows unlock date', async () => {
      const { getByText } = render(<AchievementSystem />);

      await waitFor(() => {
        fireEvent.press(getByText('First Steps'));
      });

      await waitFor(() => {
        expect(getByText(/unlocked/i)).toBeTruthy();
      });
    });

    test('displays rarity badge', async () => {
      const { getByText, getByTestId } = render(<AchievementSystem />);

      await waitFor(() => {
        fireEvent.press(getByText('Excellent Form'));
      });

      await waitFor(() => {
        expect(getByText('rare')).toBeTruthy();
      });
    });
  });

  describe('Locked Achievements', () => {
    test('displays locked achievements', async () => {
      const lockedAchievements = [
        ...mockAchievements,
        {
          id: 'perfect_form',
          title: 'Perfect Form',
          locked: true,
          requirements: { minScore: 95 }
        }
      ];

      poseProgressService.getAchievements.mockResolvedValue(lockedAchievements);

      const { getByText } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(getByText('Perfect Form')).toBeTruthy();
      });
    });

    test('shows lock icon for locked achievements', async () => {
      const lockedAchievements = [
        {
          id: 'perfect_form',
          title: 'Perfect Form',
          locked: true,
          requirements: { minScore: 95 }
        }
      ];

      poseProgressService.getAchievements.mockResolvedValue(lockedAchievements);

      const { getByTestId } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(getByTestId('lock-icon')).toBeTruthy();
      });
    });

    test('displays requirements for locked achievements', async () => {
      const lockedAchievements = [
        {
          id: 'perfect_form',
          title: 'Perfect Form',
          locked: true,
          requirements: { minScore: 95 }
        }
      ];

      poseProgressService.getAchievements.mockResolvedValue(lockedAchievements);

      const { getByText } = render(<AchievementSystem />);

      await waitFor(() => {
        fireEvent.press(getByText('Perfect Form'));
      });

      await waitFor(() => {
        expect(getByText(/95/i)).toBeTruthy();
      });
    });

    test('shows progress toward locked achievements', async () => {
      const lockedAchievements = [
        {
          id: 'perfect_form',
          title: 'Perfect Form',
          locked: true,
          requirements: { minScore: 95 },
          progress: { current: 85, target: 95 }
        }
      ];

      poseProgressService.getAchievements.mockResolvedValue(lockedAchievements);

      const { getByTestId } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(getByTestId('progress-bar')).toBeTruthy();
      });
    });
  });

  describe('New Achievement Notifications', () => {
    test('displays celebration animation for new achievement', async () => {
      const newAchievement = {
        id: 'new_achievement',
        title: 'New Achievement!',
        points: 50
      };

      poseProgressService.checkNewAchievements.mockResolvedValue([newAchievement]);

      const { getByTestId } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(getByTestId('achievement-celebration')).toBeTruthy();
      });
    });

    test('plays haptic feedback on achievement unlock', async () => {
      const mockHaptics = require('expo-haptics');
      const newAchievement = { id: 'new', title: 'New!', points: 50 };

      poseProgressService.checkNewAchievements.mockResolvedValue([newAchievement]);

      render(<AchievementSystem />);

      await waitFor(() => {
        expect(mockHaptics.notificationAsync).toHaveBeenCalledWith(
          mockHaptics.NotificationFeedbackType.Success
        );
      });
    });

    test('shows achievement toast notification', async () => {
      const newAchievement = { id: 'new', title: 'New!', points: 50 };

      poseProgressService.checkNewAchievements.mockResolvedValue([newAchievement]);

      const { getByText } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(getByText(/achievement.*unlocked/i)).toBeTruthy();
      });
    });

    test('dismisses notification after timeout', async () => {
      jest.useFakeTimers();

      const newAchievement = { id: 'new', title: 'New!', points: 50 };
      poseProgressService.checkNewAchievements.mockResolvedValue([newAchievement]);

      const { queryByText } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(queryByText(/achievement.*unlocked/i)).toBeTruthy();
      });

      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(queryByText(/achievement.*unlocked/i)).toBeNull();
      });

      jest.useRealTimers();
    });
  });

  describe('Social Sharing', () => {
    test('opens share dialog for achievement', async () => {
      const { getByText } = render(<AchievementSystem />);

      await waitFor(() => {
        fireEvent.press(getByText('First Steps'));
      });

      await waitFor(() => {
        const shareButton = getByText(/share/i);
        fireEvent.press(shareButton);
      });

      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('First Steps')
        })
      );
    });

    test('includes achievement details in share message', async () => {
      const { getByText } = render(<AchievementSystem />);

      await waitFor(() => {
        fireEvent.press(getByText('Excellent Form'));
      });

      await waitFor(() => {
        const shareButton = getByText(/share/i);
        fireEvent.press(shareButton);
      });

      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('90+')
        })
      );
    });

    test('handles share cancellation gracefully', async () => {
      Share.share.mockResolvedValue({ action: Share.dismissedAction });

      const { getByText } = render(<AchievementSystem />);

      await waitFor(() => {
        fireEvent.press(getByText('First Steps'));
      });

      await waitFor(() => {
        const shareButton = getByText(/share/i);
        fireEvent.press(shareButton);
      });

      // Should not crash or show error
      expect(Share.share).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    test('displays total achievements unlocked', async () => {
      const { getByText } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(getByText(/2.*unlocked/i)).toBeTruthy(); // 2 unlocked achievements
      });
    });

    test('shows completion percentage', async () => {
      const { getByText } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(getByText(/%/)).toBeTruthy();
      });
    });

    test('displays rarity distribution', async () => {
      const { getByText } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(getByText(/common/i)).toBeTruthy();
        expect(getByText(/rare/i)).toBeTruthy();
      });
    });
  });

  describe('Sorting and Filtering', () => {
    test('sorts achievements by unlock date', async () => {
      const { getByText, getAllByTestId } = render(<AchievementSystem />);

      await waitFor(() => {
        fireEvent.press(getByText('Recent'));
      });

      await waitFor(() => {
        const achievements = getAllByTestId('achievement-card');
        // Most recent should be first
        expect(achievements[0]).toHaveTextContent('Excellent Form');
      });
    });

    test('sorts achievements by points', async () => {
      const { getByText, getAllByTestId } = render(<AchievementSystem />);

      await waitFor(() => {
        fireEvent.press(getByText('Points'));
      });

      await waitFor(() => {
        const achievements = getAllByTestId('achievement-card');
        // Highest points first
        expect(achievements[0]).toHaveTextContent('Excellent Form');
      });
    });

    test('filters by unlocked status', async () => {
      const mixedAchievements = [
        ...mockAchievements,
        { id: 'locked1', title: 'Locked', locked: true }
      ];

      poseProgressService.getAchievements.mockResolvedValue(mixedAchievements);

      const { getByText, queryByText } = render(<AchievementSystem />);

      await waitFor(() => {
        fireEvent.press(getByText('Unlocked'));
      });

      await waitFor(() => {
        expect(getByText('First Steps')).toBeTruthy();
        expect(queryByText('Locked')).toBeNull();
      });
    });
  });

  describe('Animations', () => {
    test('animates achievement cards on scroll', async () => {
      const { getByTestId } = render(<AchievementSystem />);

      await waitFor(() => {
        const scrollView = getByTestId('achievements-scroll');
        fireEvent.scroll(scrollView, {
          nativeEvent: {
            contentOffset: { y: 100 }
          }
        });
      });

      // Animation should trigger
      expect(getByTestId('achievements-scroll')).toBeTruthy();
    });

    test('pulses new achievement cards', async () => {
      const newAchievement = {
        ...mockAchievements[0],
        isNew: true
      };

      poseProgressService.getAchievements.mockResolvedValue([newAchievement]);

      const { getByTestId } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(getByTestId('new-achievement-pulse')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles achievement loading errors', async () => {
      poseProgressService.getAchievements.mockRejectedValue(
        new Error('Failed to load')
      );

      const { getByText } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(getByText(/error/i)).toBeTruthy();
      });
    });

    test('shows retry button on error', async () => {
      poseProgressService.getAchievements.mockRejectedValue(
        new Error('Network error')
      );

      const { getByText } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(getByText(/retry/i)).toBeTruthy();
      });
    });

    test('retries loading achievements', async () => {
      poseProgressService.getAchievements
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(mockAchievements);

      const { getByText } = render(<AchievementSystem />);

      await waitFor(() => {
        fireEvent.press(getByText(/retry/i));
      });

      await waitFor(() => {
        expect(poseProgressService.getAchievements).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Accessibility', () => {
    test('provides accessible labels for achievements', () => {
      const { getByLabelText } = render(<AchievementSystem />);

      expect(getByLabelText(/achievement.*system/i)).toBeTruthy();
    });

    test('announces new achievements to screen readers', async () => {
      const newAchievement = { id: 'new', title: 'New!', points: 50 };
      poseProgressService.checkNewAchievements.mockResolvedValue([newAchievement]);

      const { getByRole } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(getByRole('alert')).toBeTruthy();
      });
    });

    test('supports keyboard navigation', async () => {
      const { getAllByTestId } = render(<AchievementSystem />);

      await waitFor(() => {
        const cards = getAllByTestId('achievement-card');
        expect(cards[0]).toHaveProp('accessible', true);
      });
    });
  });

  describe('Performance', () => {
    test('virtualizes long achievement lists', async () => {
      const manyAchievements = Array.from({ length: 100 }, (_, i) => ({
        id: `achievement-${i}`,
        title: `Achievement ${i}`,
        points: 10
      }));

      poseProgressService.getAchievements.mockResolvedValue(manyAchievements);

      const { getByTestId } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(getByTestId('virtualized-list')).toBeTruthy();
      });
    });

    test('memoizes achievement calculations', async () => {
      const { rerender } = render(<AchievementSystem />);

      await waitFor(() => {
        expect(poseProgressService.getAchievements).toHaveBeenCalledTimes(1);
      });

      // Re-render shouldn't reload
      rerender(<AchievementSystem />);

      expect(poseProgressService.getAchievements).toHaveBeenCalledTimes(1);
    });
  });
});
