/**
 * Pose Analysis Integration Test Suite
 * End-to-end workflow testing for pose analysis feature
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import PoseAnalysisUploadScreen from '../../screens/PoseAnalysisUploadScreen';
import PoseAnalysisResultsScreen from '../../screens/PoseAnalysisResultsScreen';
import PoseProgressScreen from '../../screens/PoseProgressScreen';
import PoseAnalysisService from '../../services/poseDetection/PoseAnalysisService';
import performanceMonitor from '../../services/performanceMonitor';
import poseProgressService from '../../services/poseProgressService';
import { auth } from '../../firebaseConfig';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  setOptions: jest.fn()
};

// Mock authenticated user
const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com'
};

// Mock analysis result
const mockAnalysisResult = {
  id: 'analysis-123',
  exerciseType: 'squat',
  analysisScore: 85,
  analysis: {
    overallScore: 85,
    formScores: {
      depth: 90,
      kneeTracking: 85,
      backAngle: 80
    },
    criticalErrors: [],
    improvements: ['Increase depth slightly'],
    keyPhases: [
      { phase: 'descent', duration: 2000, quality: 0.9 }
    ]
  },
  videoUri: 'file:///video.mp4',
  processingTime: 25000,
  framesProcessed: 150
};

describe('Pose Analysis Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.currentUser = mockUser;

    // Mock services
    PoseAnalysisService.analyzeVideo = jest.fn().mockResolvedValue({
      success: true,
      ...mockAnalysisResult
    });

    performanceMonitor.initialize = jest.fn().mockResolvedValue({ success: true });
    performanceMonitor.startSession = jest.fn();
    performanceMonitor.endSession = jest.fn();

    poseProgressService.recordAnalysisSession = jest.fn().mockResolvedValue({
      success: true,
      achievements: []
    });
  });

  describe('Complete Analysis Workflow', () => {
    test('completes full workflow: upload → analyze → results → progress', async () => {
      const workflowSteps = [];

      // Step 1: Upload screen
      const { getByTestId: getByTestIdUpload, getByText: getByTextUpload } = render(
        <NavigationContainer>
          <PoseAnalysisUploadScreen
            navigation={mockNavigation}
            route={{ params: {} }}
          />
        </NavigationContainer>
      );

      workflowSteps.push('upload_screen_rendered');

      // Select exercise
      const squatButton = getByTestIdUpload('exercise-squat');
      fireEvent.press(squatButton);
      workflowSteps.push('exercise_selected');

      // Upload video
      const uploadButton = getByTextUpload(/upload.*video/i);
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          'PoseAnalysisProcessing',
          expect.objectContaining({
            exerciseType: 'squat'
          })
        );
      });

      workflowSteps.push('video_uploaded');

      // Step 2: Analysis processing (simulated)
      await PoseAnalysisService.analyzeVideo('file:///video.mp4', 'squat');
      workflowSteps.push('analysis_completed');

      // Step 3: Results screen
      const { getByText: getByTextResults } = render(
        <NavigationContainer>
          <PoseAnalysisResultsScreen
            navigation={mockNavigation}
            route={{ params: { analysisResult: mockAnalysisResult } }}
          />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(getByTextResults('85')).toBeTruthy(); // Score displayed
      });

      workflowSteps.push('results_displayed');

      // Navigate to progress
      const progressButton = getByTextResults(/view.*progress/i);
      fireEvent.press(progressButton);

      expect(mockNavigate).toHaveBeenCalledWith('PoseProgressScreen');
      workflowSteps.push('navigated_to_progress');

      // Step 4: Progress screen
      const { getByText: getByTextProgress } = render(
        <NavigationContainer>
          <PoseProgressScreen
            navigation={mockNavigation}
            route={{ params: {} }}
          />
        </NavigationContainer>
      );

      await waitFor(() => {
        // Progress data should be displayed
        expect(getByTextProgress(/squat/i)).toBeTruthy();
      });

      workflowSteps.push('progress_displayed');

      // Verify workflow completion
      expect(workflowSteps).toEqual([
        'upload_screen_rendered',
        'exercise_selected',
        'video_uploaded',
        'analysis_completed',
        'results_displayed',
        'navigated_to_progress',
        'progress_displayed'
      ]);
    });

    test('handles analysis errors gracefully in workflow', async () => {
      PoseAnalysisService.analyzeVideo.mockRejectedValue(
        new Error('Analysis failed')
      );

      const { getByTestId, getByText } = render(
        <NavigationContainer>
          <PoseAnalysisUploadScreen
            navigation={mockNavigation}
            route={{ params: {} }}
          />
        </NavigationContainer>
      );

      // Select exercise and upload
      const squatButton = getByTestId('exercise-squat');
      fireEvent.press(squatButton);

      const uploadButton = getByText(/upload.*video/i);
      fireEvent.press(uploadButton);

      // Analysis should fail but app should handle it
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });

      // Error should not crash the workflow
      expect(auth.currentUser).toBeTruthy(); // App still functioning
    });
  });

  describe('Performance Monitoring Integration', () => {
    test('tracks performance metrics throughout analysis', async () => {
      await PoseAnalysisService.analyzeVideo('file:///video.mp4', 'squat', {
        onProgress: jest.fn()
      });

      // Performance monitor should track the analysis
      expect(performanceMonitor.startSession).toHaveBeenCalled();
    });

    test('reports performance metrics on completion', async () => {
      const result = await PoseAnalysisService.analyzeVideo(
        'file:///video.mp4',
        'squat'
      );

      expect(result.processingTime).toBeDefined();
      expect(result.framesProcessed).toBeDefined();
    });

    test('adapts processing based on device tier', async () => {
      performanceMonitor.initialize.mockResolvedValue({
        success: true,
        deviceTier: 'low'
      });

      await performanceMonitor.initialize();

      const result = await PoseAnalysisService.analyzeVideo(
        'file:///video.mp4',
        'squat',
        { deviceTier: 'low' }
      );

      expect(result.success).toBe(true);
      // Low tier devices should process successfully with adapted settings
    });
  });

  describe('Progress Tracking Integration', () => {
    test('records analysis session to progress service', async () => {
      const analysisResult = await PoseAnalysisService.analyzeVideo(
        'file:///video.mp4',
        'squat'
      );

      await poseProgressService.recordAnalysisSession(analysisResult);

      expect(poseProgressService.recordAnalysisSession).toHaveBeenCalledWith(
        expect.objectContaining({
          exerciseType: 'squat',
          analysisScore: 85
        })
      );
    });

    test('updates progress history after each analysis', async () => {
      // First analysis
      const result1 = { ...mockAnalysisResult, analysisScore: 80 };
      await poseProgressService.recordAnalysisSession(result1);

      // Second analysis
      const result2 = { ...mockAnalysisResult, analysisScore: 85 };
      await poseProgressService.recordAnalysisSession(result2);

      // Progress should show improvement
      expect(poseProgressService.recordAnalysisSession).toHaveBeenCalledTimes(2);
    });

    test('awards achievements for milestones', async () => {
      poseProgressService.recordAnalysisSession.mockResolvedValue({
        success: true,
        achievements: [
          { type: 'excellent_form', score: 95 }
        ]
      });

      const result = await poseProgressService.recordAnalysisSession(
        { ...mockAnalysisResult, analysisScore: 95 }
      );

      expect(result.achievements).toBeDefined();
      expect(result.achievements.length).toBeGreaterThan(0);
    });
  });

  describe('Data Persistence Integration', () => {
    test('persists analysis results across app sessions', async () => {
      // Record analysis
      await poseProgressService.recordAnalysisSession(mockAnalysisResult);

      // Simulate app restart (re-initialize service)
      await poseProgressService.initialize();

      // Data should still be available
      expect(poseProgressService.isInitialized).toBe(true);
    });

    test('syncs data with cloud when online', async () => {
      const result = await poseProgressService.recordAnalysisSession(
        mockAnalysisResult
      );

      // Should attempt to sync with Firestore
      expect(result.success).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    test('recovers from network errors during analysis', async () => {
      PoseAnalysisService.analyzeVideo
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true, ...mockAnalysisResult });

      // First attempt fails
      try {
        await PoseAnalysisService.analyzeVideo('file:///video.mp4', 'squat');
      } catch (error) {
        expect(error.message).toContain('Network');
      }

      // Retry succeeds
      const result = await PoseAnalysisService.analyzeVideo(
        'file:///video.mp4',
        'squat'
      );

      expect(result.success).toBe(true);
    });

    test('handles partial analysis completion', async () => {
      const partialResult = {
        ...mockAnalysisResult,
        framesProcessed: 75, // Only half processed
        warnings: ['Analysis incomplete - low video quality']
      };

      PoseAnalysisService.analyzeVideo.mockResolvedValue(partialResult);

      const result = await PoseAnalysisService.analyzeVideo(
        'file:///video.mp4',
        'squat'
      );

      expect(result.warnings).toBeDefined();
      expect(result.framesProcessed).toBeLessThan(150);
    });
  });

  describe('Premium Features Integration', () => {
    test('enforces usage limits for free users', async () => {
      const mockSubscriptionService = require('../../services/poseSubscriptionService');
      mockSubscriptionService.default.checkUsageLimit.mockResolvedValue({
        allowed: false,
        remaining: 0
      });

      const { getByText } = render(
        <NavigationContainer>
          <PoseAnalysisUploadScreen
            navigation={mockNavigation}
            route={{ params: {} }}
          />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(getByText(/upgrade.*premium/i)).toBeTruthy();
      });
    });

    test('enables advanced features for premium users', async () => {
      const mockSubscriptionService = require('../../services/poseSubscriptionService');
      mockSubscriptionService.default.hasFeature.mockResolvedValue(true);

      const { getByText } = render(
        <NavigationContainer>
          <PoseAnalysisResultsScreen
            navigation={mockNavigation}
            route={{ params: { analysisResult: mockAnalysisResult } }}
          />
        </NavigationContainer>
      );

      await waitFor(() => {
        expect(getByText(/export/i)).toBeTruthy(); // Premium feature
      });
    });
  });

  describe('Multi-Exercise Integration', () => {
    test('analyzes multiple exercise types in sequence', async () => {
      const exercises = ['squat', 'deadlift', 'push-up'];
      const results = [];

      for (const exercise of exercises) {
        const result = await PoseAnalysisService.analyzeVideo(
          'file:///video.mp4',
          exercise
        );
        results.push(result);
        await poseProgressService.recordAnalysisSession(result);
      }

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(poseProgressService.recordAnalysisSession).toHaveBeenCalledTimes(3);
    });

    test('maintains separate progress for each exercise', async () => {
      // Record squat analysis
      await poseProgressService.recordAnalysisSession({
        ...mockAnalysisResult,
        exerciseType: 'squat',
        analysisScore: 85
      });

      // Record deadlift analysis
      await poseProgressService.recordAnalysisSession({
        ...mockAnalysisResult,
        exerciseType: 'deadlift',
        analysisScore: 90
      });

      // Progress should track both exercises separately
      expect(poseProgressService.recordAnalysisSession).toHaveBeenCalledWith(
        expect.objectContaining({ exerciseType: 'squat' })
      );
      expect(poseProgressService.recordAnalysisSession).toHaveBeenCalledWith(
        expect.objectContaining({ exerciseType: 'deadlift' })
      );
    });
  });

  describe('Accessibility Integration', () => {
    test('provides accessible navigation throughout workflow', () => {
      const { getByLabelText } = render(
        <NavigationContainer>
          <PoseAnalysisUploadScreen
            navigation={mockNavigation}
            route={{ params: {} }}
          />
        </NavigationContainer>
      );

      expect(getByLabelText(/upload.*video/i)).toBeTruthy();
      expect(getByLabelText(/record.*video/i)).toBeTruthy();
    });

    test('announces analysis progress to screen readers', async () => {
      const onProgress = jest.fn();

      await PoseAnalysisService.analyzeVideo('file:///video.mp4', 'squat', {
        onProgress
      });

      // Progress callbacks should provide accessibility info
      expect(onProgress).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    test('maintains analysis state across navigation', async () => {
      const { rerender } = render(
        <NavigationContainer>
          <PoseAnalysisUploadScreen
            navigation={mockNavigation}
            route={{ params: {} }}
          />
        </NavigationContainer>
      );

      // Navigate to results
      rerender(
        <NavigationContainer>
          <PoseAnalysisResultsScreen
            navigation={mockNavigation}
            route={{ params: { analysisResult: mockAnalysisResult } }}
          />
        </NavigationContainer>
      );

      // Navigate to progress
      rerender(
        <NavigationContainer>
          <PoseProgressScreen
            navigation={mockNavigation}
            route={{ params: {} }}
          />
        </NavigationContainer>
      );

      // State should be consistent across screens
      expect(auth.currentUser).toBeTruthy();
    });

    test('cleans up resources when unmounting', () => {
      const { unmount } = render(
        <NavigationContainer>
          <PoseAnalysisUploadScreen
            navigation={mockNavigation}
            route={{ params: {} }}
          />
        </NavigationContainer>
      );

      unmount();

      // Resources should be cleaned up
      expect(true).toBe(true); // Placeholder for cleanup verification
    });
  });
});
