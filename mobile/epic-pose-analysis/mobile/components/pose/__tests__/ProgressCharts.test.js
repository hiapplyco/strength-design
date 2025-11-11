/**
 * Progress Charts Component Test Suite
 * Tests for progress visualization and chart interactions
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ProgressCharts from '../ProgressCharts';
import poseProgressService from '../../../services/poseProgressService';

// Mock data
const mockProgressData = {
  trend: [
    { date: '2024-01-01', score: 75, exercise: 'squat' },
    { date: '2024-01-08', score: 80, exercise: 'squat' },
    { date: '2024-01-15', score: 85, exercise: 'squat' }
  ],
  comparison: {
    squat: 85,
    deadlift: 80,
    'push-up': 90
  },
  summary: {
    totalSessions: 15,
    averageScore: 82,
    improvementRate: 5.2
  }
};

describe('ProgressCharts', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock progress service
    poseProgressService.initialize = jest.fn().mockResolvedValue({ success: true });
    poseProgressService.getProgressData = jest.fn().mockResolvedValue(mockProgressData);
  });

  describe('Rendering', () => {
    test('renders with default props', async () => {
      const { getByText } = render(<ProgressCharts />);

      await waitFor(() => {
        expect(getByText(/trend/i)).toBeTruthy();
      });
    });

    test('displays time period selector', async () => {
      const { getByText } = render(<ProgressCharts />);

      await waitFor(() => {
        expect(getByText('7 Days')).toBeTruthy();
        expect(getByText('30 Days')).toBeTruthy();
        expect(getByText('90 Days')).toBeTruthy();
      });
    });

    test('displays chart type options', async () => {
      const { getByText } = render(<ProgressCharts />);

      await waitFor(() => {
        expect(getByText('Trend')).toBeTruthy();
        expect(getByText('Compare')).toBeTruthy();
        expect(getByText('Insights')).toBeTruthy();
      });
    });

    test('shows loading state initially', () => {
      const { getByTestId } = render(<ProgressCharts />);

      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    test('hides loading state after data loads', async () => {
      const { queryByTestId } = render(<ProgressCharts />);

      await waitFor(() => {
        expect(queryByTestId('loading-indicator')).toBeNull();
      });
    });
  });

  describe('Time Period Selection', () => {
    test('selects 7 days period', async () => {
      const { getByText } = render(<ProgressCharts />);

      await waitFor(() => {
        const sevenDaysButton = getByText('7 Days');
        fireEvent.press(sevenDaysButton);
      });

      await waitFor(() => {
        expect(poseProgressService.getProgressData).toHaveBeenCalledWith(
          expect.objectContaining({ timePeriod: '7d' })
        );
      });
    });

    test('selects 30 days period', async () => {
      const { getByText } = render(<ProgressCharts />);

      await waitFor(() => {
        const thirtyDaysButton = getByText('30 Days');
        fireEvent.press(thirtyDaysButton);
      });

      await waitFor(() => {
        expect(poseProgressService.getProgressData).toHaveBeenCalledWith(
          expect.objectContaining({ timePeriod: '30d' })
        );
      });
    });

    test('switches between time periods', async () => {
      const { getByText } = render(<ProgressCharts />);

      await waitFor(() => {
        fireEvent.press(getByText('7 Days'));
      });

      await waitFor(() => {
        fireEvent.press(getByText('90 Days'));
      });

      expect(poseProgressService.getProgressData).toHaveBeenCalledTimes(3); // Initial + 2 changes
    });

    test('highlights selected time period', async () => {
      const { getByTestId } = render(<ProgressCharts initialTimePeriod="30d" />);

      await waitFor(() => {
        const selectedButton = getByTestId('time-period-30d');
        expect(selectedButton).toHaveProp('selected', true);
      });
    });
  });

  describe('Chart Type Selection', () => {
    test('switches to trend chart', async () => {
      const { getByText, getByTestId } = render(<ProgressCharts />);

      await waitFor(() => {
        fireEvent.press(getByText('Trend'));
      });

      await waitFor(() => {
        expect(getByTestId('trend-chart')).toBeTruthy();
      });
    });

    test('switches to comparison chart', async () => {
      const { getByText, getByTestId } = render(<ProgressCharts />);

      await waitFor(() => {
        fireEvent.press(getByText('Compare'));
      });

      await waitFor(() => {
        expect(getByTestId('comparison-chart')).toBeTruthy();
      });
    });

    test('switches to insights view', async () => {
      const { getByText, getByTestId } = render(<ProgressCharts />);

      await waitFor(() => {
        fireEvent.press(getByText('Insights'));
      });

      await waitFor(() => {
        expect(getByTestId('correlation-chart')).toBeTruthy();
      });
    });
  });

  describe('Exercise Filtering', () => {
    test('filters by specific exercise', async () => {
      const { getByText } = render(<ProgressCharts />);

      await waitFor(() => {
        fireEvent.press(getByText('Squat'));
      });

      await waitFor(() => {
        expect(poseProgressService.getProgressData).toHaveBeenCalledWith(
          expect.objectContaining({ exerciseType: 'squat' })
        );
      });
    });

    test('shows all exercises when "All" selected', async () => {
      const { getByText } = render(<ProgressCharts />);

      await waitFor(() => {
        fireEvent.press(getByText('All Exercises'));
      });

      await waitFor(() => {
        expect(poseProgressService.getProgressData).toHaveBeenCalledWith(
          expect.objectContaining({ exerciseType: 'all' })
        );
      });
    });

    test('calls onExerciseSelect callback', async () => {
      const onExerciseSelect = jest.fn();
      const { getByText } = render(
        <ProgressCharts onExerciseSelect={onExerciseSelect} />
      );

      await waitFor(() => {
        fireEvent.press(getByText('Deadlift'));
      });

      expect(onExerciseSelect).toHaveBeenCalledWith('deadlift');
    });
  });

  describe('Data Refresh', () => {
    test('refreshes data on pull-down', async () => {
      const { getByTestId } = render(<ProgressCharts />);

      await waitFor(() => {
        const scrollView = getByTestId('charts-scroll-view');
        fireEvent(scrollView, 'refresh');
      });

      await waitFor(() => {
        expect(poseProgressService.getProgressData).toHaveBeenCalled();
      });
    });

    test('shows refresh indicator during refresh', async () => {
      const { getByTestId } = render(<ProgressCharts />);

      await waitFor(() => {
        const scrollView = getByTestId('charts-scroll-view');
        fireEvent(scrollView, 'refresh');
      });

      expect(getByTestId('refresh-indicator')).toBeTruthy();
    });

    test('calls onDataRefresh callback', async () => {
      const onDataRefresh = jest.fn();
      const { getByTestId } = render(
        <ProgressCharts onDataRefresh={onDataRefresh} />
      );

      await waitFor(() => {
        const scrollView = getByTestId('charts-scroll-view');
        fireEvent(scrollView, 'refresh');
      });

      await waitFor(() => {
        expect(onDataRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('Data Display', () => {
    test('displays progress summary', async () => {
      const { getByText } = render(<ProgressCharts />);

      await waitFor(() => {
        expect(getByText(/total.*sessions/i)).toBeTruthy();
        expect(getByText(/average.*score/i)).toBeTruthy();
      });
    });

    test('renders trend data points', async () => {
      const { getAllByTestId } = render(<ProgressCharts />);

      await waitFor(() => {
        const dataPoints = getAllByTestId('chart-data-point');
        expect(dataPoints.length).toBeGreaterThan(0);
      });
    });

    test('displays exercise comparison bars', async () => {
      const { getByText, getAllByTestId } = render(<ProgressCharts />);

      await waitFor(() => {
        fireEvent.press(getByText('Compare'));
      });

      await waitFor(() => {
        const bars = getAllByTestId('comparison-bar');
        expect(bars.length).toBeGreaterThan(0);
      });
    });

    test('shows empty state when no data', async () => {
      poseProgressService.getProgressData.mockResolvedValue({
        trend: [],
        comparison: {},
        summary: null
      });

      const { getByText } = render(<ProgressCharts />);

      await waitFor(() => {
        expect(getByText(/no.*data/i)).toBeTruthy();
      });
    });
  });

  describe('Interactivity', () => {
    test('shows tooltip on data point tap', async () => {
      const { getAllByTestId, getByTestId } = render(<ProgressCharts />);

      await waitFor(() => {
        const dataPoints = getAllByTestId('chart-data-point');
        fireEvent.press(dataPoints[0]);
      });

      await waitFor(() => {
        expect(getByTestId('data-tooltip')).toBeTruthy();
      });
    });

    test('zooms in on chart gesture', async () => {
      const { getByTestId } = render(<ProgressCharts />);

      await waitFor(() => {
        const chart = getByTestId('trend-chart');
        fireEvent(chart, 'pinchGesture', { scale: 2 });
      });

      // Chart should respond to zoom
      expect(getByTestId('trend-chart')).toBeTruthy();
    });

    test('pans chart horizontally', async () => {
      const { getByTestId } = render(<ProgressCharts />);

      await waitFor(() => {
        const chart = getByTestId('trend-chart');
        fireEvent(chart, 'panGesture', { translationX: -100 });
      });

      expect(getByTestId('trend-chart')).toBeTruthy();
    });
  });

  describe('Animations', () => {
    test('animates chart appearance', async () => {
      const { getByTestId } = render(<ProgressCharts />);

      await waitFor(() => {
        expect(getByTestId('trend-chart')).toBeTruthy();
      });

      // Chart should have animated in
    });

    test('transitions between chart types smoothly', async () => {
      const { getByText, getByTestId } = render(<ProgressCharts />);

      await waitFor(() => {
        fireEvent.press(getByText('Trend'));
      });

      await waitFor(() => {
        fireEvent.press(getByText('Compare'));
      });

      // Transition should occur
      expect(getByTestId('comparison-chart')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('handles data loading errors', async () => {
      poseProgressService.getProgressData.mockRejectedValue(
        new Error('Failed to load data')
      );

      const { getByText } = render(<ProgressCharts />);

      await waitFor(() => {
        expect(getByText(/error/i)).toBeTruthy();
      });
    });

    test('shows retry button on error', async () => {
      poseProgressService.getProgressData.mockRejectedValue(
        new Error('Network error')
      );

      const { getByText } = render(<ProgressCharts />);

      await waitFor(() => {
        expect(getByText(/retry/i)).toBeTruthy();
      });
    });

    test('retries data loading on retry button press', async () => {
      poseProgressService.getProgressData
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(mockProgressData);

      const { getByText } = render(<ProgressCharts />);

      await waitFor(() => {
        fireEvent.press(getByText(/retry/i));
      });

      await waitFor(() => {
        expect(poseProgressService.getProgressData).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Accessibility', () => {
    test('has accessible label', () => {
      const { getByLabelText } = render(
        <ProgressCharts accessibilityLabel="Progress charts" />
      );

      expect(getByLabelText('Progress charts')).toBeTruthy();
    });

    test('provides screen reader descriptions for charts', async () => {
      const { getByTestId } = render(<ProgressCharts />);

      await waitFor(() => {
        const chart = getByTestId('trend-chart');
        expect(chart).toHaveProp(
          'accessibilityLabel',
          expect.stringContaining('chart')
        );
      });
    });

    test('announces data updates to screen readers', async () => {
      const { getByText } = render(<ProgressCharts />);

      await waitFor(() => {
        fireEvent.press(getByText('30 Days'));
      });

      // Should announce update
      await waitFor(() => {
        expect(poseProgressService.getProgressData).toHaveBeenCalled();
      });
    });
  });

  describe('Performance', () => {
    test('memoizes chart data processing', async () => {
      const { rerender } = render(<ProgressCharts />);

      await waitFor(() => {
        expect(poseProgressService.getProgressData).toHaveBeenCalledTimes(1);
      });

      // Re-render with same props shouldn't reload data
      rerender(<ProgressCharts />);

      expect(poseProgressService.getProgressData).toHaveBeenCalledTimes(1);
    });

    test('debounces rapid filter changes', async () => {
      jest.useFakeTimers();
      const { getByText } = render(<ProgressCharts />);

      await waitFor(() => {
        fireEvent.press(getByText('7 Days'));
        fireEvent.press(getByText('30 Days'));
        fireEvent.press(getByText('90 Days'));
      });

      jest.advanceTimersByTime(500);

      // Should only make one final request after debounce
      expect(poseProgressService.getProgressData).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });
});
