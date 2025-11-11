/**
 * PoseAnalysisResultsScreen Test Suite
 * Tests for analysis results display and interactions
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Share } from 'react-native';
import PoseAnalysisResultsScreen from '../PoseAnalysisResultsScreen';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn()
};

const mockAnalysisResult = {
  id: 'test-analysis-123',
  exerciseType: 'squat',
  analysisScore: 85,
  feedback: [
    {
      id: '1',
      type: 'correction',
      severity: 'medium',
      area: 'depth',
      message: 'Try to squat slightly deeper',
      suggestion: 'Aim for hips parallel to knees'
    },
    {
      id: '2',
      type: 'positive',
      severity: 'low',
      area: 'knees',
      message: 'Excellent knee tracking',
      suggestion: 'Keep maintaining this form'
    }
  ],
  videoUri: 'file:///mock/video.mp4',
  landmarks: [],
  timestamp: new Date().toISOString(),
  processingTimeMs: 25000
};

const mockRoute = {
  params: {
    analysisResult: mockAnalysisResult
  }
};

describe('PoseAnalysisResultsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    test('renders analysis score prominently', () => {
      const { getByText } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      expect(getByText('85')).toBeTruthy();
      expect(getByText(/score/i)).toBeTruthy();
    });

    test('renders exercise type', () => {
      const { getByText } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      expect(getByText(/squat/i)).toBeTruthy();
    });

    test('renders all feedback items', () => {
      const { getByText } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      expect(getByText('Try to squat slightly deeper')).toBeTruthy();
      expect(getByText('Excellent knee tracking')).toBeTruthy();
    });

    test('renders video player with pose overlay', () => {
      const { getByTestId } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      expect(getByTestId('video-player-with-overlay')).toBeTruthy();
    });
  });

  describe('Score Display', () => {
    test('displays score with correct color for high score', () => {
      const highScoreResult = { ...mockAnalysisResult, analysisScore: 92 };
      const { getByTestId } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={{ params: { analysisResult: highScoreResult } }}
        />
      );

      const scoreDisplay = getByTestId('score-display');
      expect(scoreDisplay).toHaveProp('color', expect.stringContaining('green'));
    });

    test('displays score with correct color for medium score', () => {
      const mediumScoreResult = { ...mockAnalysisResult, analysisScore: 75 };
      const { getByTestId } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={{ params: { analysisResult: mediumScoreResult } }}
        />
      );

      const scoreDisplay = getByTestId('score-display');
      expect(scoreDisplay).toHaveProp('color', expect.stringContaining('yellow'));
    });

    test('displays score with correct color for low score', () => {
      const lowScoreResult = { ...mockAnalysisResult, analysisScore: 55 };
      const { getByTestId } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={{ params: { analysisResult: lowScoreResult } }}
        />
      );

      const scoreDisplay = getByTestId('score-display');
      expect(scoreDisplay).toHaveProp('color', expect.stringContaining('red'));
    });

    test('renders score breakdown chart', () => {
      const { getByTestId } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      expect(getByTestId('score-breakdown-chart')).toBeTruthy();
    });
  });

  describe('Feedback Display', () => {
    test('groups feedback by type', () => {
      const { getByText } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      expect(getByText(/corrections/i)).toBeTruthy();
      expect(getByText(/positive/i)).toBeTruthy();
    });

    test('displays feedback in priority order', () => {
      const multipleResult = {
        ...mockAnalysisResult,
        feedback: [
          { id: '1', type: 'correction', severity: 'low', message: 'Minor issue' },
          { id: '2', type: 'correction', severity: 'high', message: 'Major issue' },
          { id: '3', type: 'positive', severity: 'low', message: 'Good work' }
        ]
      };

      const { getAllByTestId } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={{ params: { analysisResult: multipleResult } }}
        />
      );

      const feedbackItems = getAllByTestId('feedback-item');
      // First item should be high severity
      expect(feedbackItems[0]).toHaveTextContent('Major issue');
    });

    test('expands feedback item on press', async () => {
      const { getByText, getByTestId } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const feedbackItem = getByText('Try to squat slightly deeper');
      fireEvent.press(feedbackItem);

      await waitFor(() => {
        expect(getByTestId('feedback-detail-1')).toBeTruthy();
        expect(getByText('Aim for hips parallel to knees')).toBeTruthy();
      });
    });

    test('displays severity indicators', () => {
      const { getAllByTestId } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const severityIndicators = getAllByTestId('severity-indicator');
      expect(severityIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Video Playback', () => {
    test('video player shows analysis video', () => {
      const { getByTestId } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const videoPlayer = getByTestId('video-player-with-overlay');
      expect(videoPlayer).toHaveProp('videoUri', mockAnalysisResult.videoUri);
    });

    test('video player has landmarks for overlay', () => {
      const { getByTestId } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const videoPlayer = getByTestId('video-player-with-overlay');
      expect(videoPlayer).toHaveProp('landmarks', mockAnalysisResult.landmarks);
    });

    test('toggles video player visibility', async () => {
      const { getByTestId, queryByTestId } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const toggleButton = getByTestId('toggle-video-button');

      // Initially visible
      expect(getByTestId('video-player-with-overlay')).toBeTruthy();

      // Hide
      fireEvent.press(toggleButton);
      await waitFor(() => {
        expect(queryByTestId('video-player-with-overlay')).toBeNull();
      });

      // Show
      fireEvent.press(toggleButton);
      await waitFor(() => {
        expect(getByTestId('video-player-with-overlay')).toBeTruthy();
      });
    });
  });

  describe('Export Functionality', () => {
    test('opens export modal when export button pressed', async () => {
      const { getByText, getByTestId } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const exportButton = getByText(/export/i);
      fireEvent.press(exportButton);

      await waitFor(() => {
        expect(getByTestId('export-modal')).toBeTruthy();
      });
    });

    test('exports as PDF', async () => {
      const { getByText, getByTestId } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const exportButton = getByText(/export/i);
      fireEvent.press(exportButton);

      await waitFor(() => {
        const pdfButton = getByTestId('export-pdf-button');
        fireEvent.press(pdfButton);
      });

      await waitFor(() => {
        expect(getByText(/exported.*pdf/i)).toBeTruthy();
      });
    });

    test('exports as image', async () => {
      const { getByText, getByTestId } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const exportButton = getByText(/export/i);
      fireEvent.press(exportButton);

      await waitFor(() => {
        const imageButton = getByTestId('export-image-button');
        fireEvent.press(imageButton);
      });

      await waitFor(() => {
        expect(getByText(/exported.*image/i)).toBeTruthy();
      });
    });
  });

  describe('Sharing', () => {
    test('opens share dialog', async () => {
      const { getByText } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const shareButton = getByText(/share/i);
      fireEvent.press(shareButton);

      await waitFor(() => {
        expect(Share.share).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('85')
          })
        );
      });
    });

    test('includes score in share message', async () => {
      const { getByText } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const shareButton = getByText(/share/i);
      fireEvent.press(shareButton);

      await waitFor(() => {
        expect(Share.share).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('squat')
          })
        );
      });
    });
  });

  describe('Navigation', () => {
    test('navigates to progress screen', async () => {
      const { getByText } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const progressButton = getByText(/view.*progress/i);
      fireEvent.press(progressButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('PoseProgressScreen');
    });

    test('navigates back on done button', () => {
      const { getByText } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const doneButton = getByText(/done/i);
      fireEvent.press(doneButton);

      expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    test('navigates to new analysis', () => {
      const { getByText } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const newAnalysisButton = getByText(/analyze.*another/i);
      fireEvent.press(newAnalysisButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('PoseAnalysisUpload');
    });
  });

  describe('Data Persistence', () => {
    test('saves analysis to history', async () => {
      const mockProgressService = require('../../services/poseProgressService');

      render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(mockProgressService.default.saveAnalysis).toHaveBeenCalledWith(
          expect.objectContaining({
            id: mockAnalysisResult.id,
            score: mockAnalysisResult.analysisScore
          })
        );
      });
    });

    test('tracks usage for analytics', async () => {
      const mockUsageTracking = require('../../services/usageTrackingService');

      render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(mockUsageTracking.default.trackResultsView).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles missing analysis result', () => {
      const { getByText } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={{ params: {} }}
        />
      );

      expect(getByText(/no.*result/i)).toBeTruthy();
    });

    test('handles corrupted analysis data', () => {
      const corruptedResult = { ...mockAnalysisResult, feedback: null };

      expect(() => {
        render(
          <PoseAnalysisResultsScreen
            navigation={mockNavigation}
            route={{ params: { analysisResult: corruptedResult } }}
          />
        );
      }).not.toThrow();
    });

    test('handles export error gracefully', async () => {
      const mockExport = jest.spyOn(require('expo-sharing'), 'shareAsync');
      mockExport.mockRejectedValue(new Error('Export failed'));

      const { getByText, getByTestId } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const exportButton = getByText(/export/i);
      fireEvent.press(exportButton);

      await waitFor(() => {
        const pdfButton = getByTestId('export-pdf-button');
        fireEvent.press(pdfButton);
      });

      await waitFor(() => {
        expect(getByText(/export.*failed/i)).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    test('score has accessible label', () => {
      const { getByLabelText } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      expect(getByLabelText(/score.*85/i)).toBeTruthy();
    });

    test('feedback items have accessible labels', () => {
      const { getByLabelText } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      expect(getByLabelText(/correction.*depth/i)).toBeTruthy();
    });

    test('action buttons have accessible labels', () => {
      const { getByLabelText } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      expect(getByLabelText('Export results')).toBeTruthy();
      expect(getByLabelText('Share results')).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    test('shows loading indicator while saving', async () => {
      const mockProgressService = require('../../services/poseProgressService');
      mockProgressService.default.saveAnalysis.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { getByTestId } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByTestId('saving-indicator')).toBeTruthy();
      });
    });
  });

  describe('Premium Features', () => {
    test('shows PDF export for premium users', () => {
      const mockSubscriptionService = require('../../services/poseSubscriptionService');
      mockSubscriptionService.default.hasFeature.mockResolvedValue(true);

      const { getByText } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      expect(getByText(/export/i)).toBeTruthy();
    });

    test('shows upgrade prompt for free users trying premium feature', async () => {
      const mockSubscriptionService = require('../../services/poseSubscriptionService');
      mockSubscriptionService.default.hasFeature.mockResolvedValue(false);

      const { getByText, getByTestId } = render(
        <PoseAnalysisResultsScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const exportButton = getByText(/export/i);
      fireEvent.press(exportButton);

      await waitFor(() => {
        expect(getByText(/upgrade.*premium/i)).toBeTruthy();
      });
    });
  });
});
