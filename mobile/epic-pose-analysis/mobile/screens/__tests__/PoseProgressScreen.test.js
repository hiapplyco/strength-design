/**
 * PoseProgressScreen Test Suite
 * Tests for progress tracking and historical analysis display
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PoseProgressScreen from '../PoseProgressScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn()
};

const mockRoute = {
  params: {}
};

const mockProgressData = {
  totalAnalyses: 12,
  averageScore: 82,
  scoresByExercise: {
    squat: [70, 75, 80, 85, 88],
    deadlift: [65, 72, 78, 82],
    push_up: [75, 78, 82]
  },
  improvements: [
    {
      exercise: 'squat',
      startScore: 70,
      currentScore: 88,
      improvement: 18,
      percentChange: 25.7
    },
    {
      exercise: 'deadlift',
      startScore: 65,
      currentScore: 82,
      improvement: 17,
      percentChange: 26.2
    }
  ],
  achievements: [
    {
      id: 'first_analysis',
      name: 'First Steps',
      description: 'Complete your first analysis',
      unlockedAt: '2025-10-01T10:00:00Z',
      icon: 'trophy'
    },
    {
      id: '10_analyses',
      name: 'Consistency King',
      description: 'Complete 10 analyses',
      unlockedAt: '2025-10-15T14:30:00Z',
      icon: 'star'
    }
  ],
  recentAnalyses: [
    {
      id: '1',
      exerciseType: 'squat',
      score: 88,
      timestamp: '2025-11-06T09:00:00Z'
    },
    {
      id: '2',
      exerciseType: 'deadlift',
      score: 82,
      timestamp: '2025-11-05T10:00:00Z'
    }
  ]
};

describe('PoseProgressScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockProgressService = require('../../services/poseProgressService');
    mockProgressService.default.getProgressData.mockResolvedValue(mockProgressData);
  });

  describe('Initial Render', () => {
    test('renders progress overview', async () => {
      const { getByText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByText(/total.*analyses/i)).toBeTruthy();
        expect(getByText('12')).toBeTruthy();
      });
    });

    test('renders average score', async () => {
      const { getByText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByText(/average.*score/i)).toBeTruthy();
        expect(getByText('82')).toBeTruthy();
      });
    });

    test('renders exercise tabs', async () => {
      const { getByText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByText('Squat')).toBeTruthy();
        expect(getByText('Deadlift')).toBeTruthy();
        expect(getByText('Push Up')).toBeTruthy();
      });
    });
  });

  describe('Progress Charts', () => {
    test('renders progress chart for selected exercise', async () => {
      const { getByTestId } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByTestId('progress-chart')).toBeTruthy();
      });
    });

    test('updates chart when exercise tab changed', async () => {
      const { getByText, getByTestId } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        const deadliftTab = getByText('Deadlift');
        fireEvent.press(deadliftTab);
      });

      await waitFor(() => {
        const chart = getByTestId('progress-chart');
        expect(chart).toHaveProp('data', expect.arrayContaining([65, 72, 78, 82]));
      });
    });

    test('shows trend line', async () => {
      const { getByTestId } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByTestId('trend-line')).toBeTruthy();
      });
    });

    test('displays data points', async () => {
      const { getAllByTestId } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        const dataPoints = getAllByTestId('chart-data-point');
        expect(dataPoints.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Improvement Display', () => {
    test('renders improvement cards', async () => {
      const { getByText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByText(/squat.*improvement/i)).toBeTruthy();
        expect(getByText('+18')).toBeTruthy();
      });
    });

    test('displays percentage improvement', async () => {
      const { getByText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByText(/25\.7%/)).toBeTruthy();
      });
    });

    test('shows before and after scores', async () => {
      const { getByText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByText(/70.*→.*88/)).toBeTruthy();
      });
    });

    test('highlights best improvement', async () => {
      const { getByTestId } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        const bestCard = getByTestId('improvement-card-deadlift');
        expect(bestCard).toHaveProp('highlighted', true);
      });
    });
  });

  describe('Achievement System', () => {
    test('renders unlocked achievements', async () => {
      const { getByText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByText('First Steps')).toBeTruthy();
        expect(getByText('Consistency King')).toBeTruthy();
      });
    });

    test('displays achievement descriptions', async () => {
      const { getByText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByText('Complete your first analysis')).toBeTruthy();
      });
    });

    test('shows achievement unlock dates', async () => {
      const { getByText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByText(/oct.*1/i)).toBeTruthy();
      });
    });

    test('displays achievement icons', async () => {
      const { getAllByTestId } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        const icons = getAllByTestId('achievement-icon');
        expect(icons.length).toBe(2);
      });
    });
  });

  describe('Recent Analyses', () => {
    test('renders recent analysis list', async () => {
      const { getByText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByText(/recent.*analyses/i)).toBeTruthy();
      });
    });

    test('displays analysis details', async () => {
      const { getByText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByText(/squat.*88/i)).toBeTruthy();
        expect(getByText(/deadlift.*82/i)).toBeTruthy();
      });
    });

    test('navigates to analysis details on press', async () => {
      const { getByTestId } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        const analysisItem = getByTestId('analysis-item-1');
        fireEvent.press(analysisItem);
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        'PoseAnalysisResults',
        expect.objectContaining({ analysisId: '1' })
      );
    });

    test('shows relative timestamps', async () => {
      const { getByText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByText(/today/i)).toBeTruthy();
      });
    });
  });

  describe('Comparison Feature', () => {
    test('enables comparison mode', async () => {
      const { getByText, getByTestId } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        const compareButton = getByText(/compare/i);
        fireEvent.press(compareButton);
      });

      await waitFor(() => {
        expect(getByTestId('comparison-mode')).toBeTruthy();
      });
    });

    test('selects analyses for comparison', async () => {
      const { getByText, getByTestId } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      // Enable comparison mode
      await waitFor(() => {
        const compareButton = getByText(/compare/i);
        fireEvent.press(compareButton);
      });

      // Select two analyses
      await waitFor(() => {
        const analysis1 = getByTestId('analysis-item-1');
        const analysis2 = getByTestId('analysis-item-2');

        fireEvent.press(analysis1);
        fireEvent.press(analysis2);
      });

      await waitFor(() => {
        expect(getByTestId('compare-selected-count')).toHaveTextContent('2');
      });
    });

    test('shows comparison view', async () => {
      const { getByText, getByTestId } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      // Enable comparison and select items
      await waitFor(async () => {
        const compareButton = getByText(/compare/i);
        fireEvent.press(compareButton);

        const analysis1 = getByTestId('analysis-item-1');
        const analysis2 = getByTestId('analysis-item-2');
        fireEvent.press(analysis1);
        fireEvent.press(analysis2);

        const viewCompareButton = getByText(/view.*comparison/i);
        fireEvent.press(viewCompareButton);
      });

      await waitFor(() => {
        expect(getByTestId('comparison-view')).toBeTruthy();
      });
    });
  });

  describe('Empty States', () => {
    test('shows empty state when no analyses', async () => {
      const mockProgressService = require('../../services/poseProgressService');
      mockProgressService.default.getProgressData.mockResolvedValue({
        totalAnalyses: 0,
        recentAnalyses: [],
        scoresByExercise: {},
        improvements: [],
        achievements: []
      });

      const { getByText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByText(/no.*analyses.*yet/i)).toBeTruthy();
      });
    });

    test('shows start button in empty state', async () => {
      const mockProgressService = require('../../services/poseProgressService');
      mockProgressService.default.getProgressData.mockResolvedValue({
        totalAnalyses: 0,
        recentAnalyses: []
      });

      const { getByText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        const startButton = getByText(/start.*first.*analysis/i);
        expect(startButton).toBeTruthy();

        fireEvent.press(startButton);
        expect(mockNavigation.navigate).toHaveBeenCalledWith('PoseAnalysisUpload');
      });
    });
  });

  describe('Data Filtering', () => {
    test('filters by date range', async () => {
      const { getByText, getByTestId } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        const filterButton = getByText(/filter/i);
        fireEvent.press(filterButton);
      });

      await waitFor(() => {
        const last30DaysOption = getByTestId('filter-30-days');
        fireEvent.press(last30DaysOption);
      });

      const mockProgressService = require('../../services/poseProgressService');
      expect(mockProgressService.default.getProgressData).toHaveBeenCalledWith(
        expect.objectContaining({
          dateRange: 'last_30_days'
        })
      );
    });

    test('filters by exercise type', async () => {
      const { getByText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        const squatTab = getByText('Squat');
        fireEvent.press(squatTab);
      });

      // Chart should update to show only squat data
      await waitFor(() => {
        const chart = require('@testing-library/react-native').getByTestId('progress-chart');
        expect(chart).toBeTruthy();
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading indicator while fetching data', () => {
      const mockProgressService = require('../../services/poseProgressService');
      mockProgressService.default.getProgressData.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { getByTestId } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      expect(getByTestId('progress-loading')).toBeTruthy();
    });

    test('hides loading indicator after data loads', async () => {
      const { queryByTestId } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(queryByTestId('progress-loading')).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles data fetch error', async () => {
      const mockProgressService = require('../../services/poseProgressService');
      mockProgressService.default.getProgressData.mockRejectedValue(
        new Error('Failed to fetch data')
      );

      const { getByText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByText(/error.*loading/i)).toBeTruthy();
      });
    });

    test('shows retry button on error', async () => {
      const mockProgressService = require('../../services/poseProgressService');
      mockProgressService.default.getProgressData.mockRejectedValue(
        new Error('Failed to fetch data')
      );

      const { getByText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        const retryButton = getByText(/retry/i);
        expect(retryButton).toBeTruthy();

        fireEvent.press(retryButton);
        expect(mockProgressService.default.getProgressData).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Refresh', () => {
    test('refreshes data on pull-to-refresh', async () => {
      const mockProgressService = require('../../services/poseProgressService');

      const { getByTestId } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        const scrollView = getByTestId('progress-scroll-view');
        fireEvent(scrollView, 'onRefresh');
      });

      await waitFor(() => {
        expect(mockProgressService.default.getProgressData).toHaveBeenCalledTimes(2);
      });
    });

    test('shows refreshing indicator', async () => {
      const mockProgressService = require('../../services/poseProgressService');
      mockProgressService.default.getProgressData.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { getByTestId } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        const scrollView = getByTestId('progress-scroll-view');
        fireEvent(scrollView, 'onRefresh');
      });

      expect(getByTestId('progress-scroll-view')).toHaveProp('refreshing', true);
    });
  });

  describe('Accessibility', () => {
    test('charts have accessible descriptions', async () => {
      const { getByLabelText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByLabelText(/progress.*chart/i)).toBeTruthy();
      });
    });

    test('improvement cards have accessible labels', async () => {
      const { getByLabelText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByLabelText(/squat.*improved.*18.*points/i)).toBeTruthy();
      });
    });

    test('achievement cards are accessible', async () => {
      const { getByLabelText } = render(
        <PoseProgressScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByLabelText(/achievement.*first.*steps/i)).toBeTruthy();
      });
    });
  });
});
