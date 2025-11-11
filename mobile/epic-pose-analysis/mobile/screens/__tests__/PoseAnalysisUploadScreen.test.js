/**
 * PoseAnalysisUploadScreen Test Suite
 * Tests for video upload and recording interface
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import PoseAnalysisUploadScreen from '../PoseAnalysisUploadScreen';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn()
};

const mockRoute = {
  params: {}
};

describe('PoseAnalysisUploadScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    test('renders upload options', () => {
      const { getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      expect(getByText(/upload.*video/i)).toBeTruthy();
      expect(getByText(/record.*video/i)).toBeTruthy();
    });

    test('renders exercise type selector', () => {
      const { getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      expect(getByText(/squat/i)).toBeTruthy();
      expect(getByText(/deadlift/i)).toBeTruthy();
      expect(getByText(/push.*up/i)).toBeTruthy();
    });

    test('shows tutorial prompt for first-time users', async () => {
      require('@react-native-async-storage/async-storage').getItem.mockResolvedValue(null);

      const { getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByText(/first time/i)).toBeTruthy();
      });
    });
  });

  describe('Exercise Type Selection', () => {
    test('selects squat exercise', () => {
      const { getByTestId } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const squatButton = getByTestId('exercise-squat');
      fireEvent.press(squatButton);

      expect(squatButton).toHaveProp('selected', true);
    });

    test('changes exercise type selection', () => {
      const { getByTestId } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const squatButton = getByTestId('exercise-squat');
      const deadliftButton = getByTestId('exercise-deadlift');

      fireEvent.press(squatButton);
      expect(squatButton).toHaveProp('selected', true);

      fireEvent.press(deadliftButton);
      expect(deadliftButton).toHaveProp('selected', true);
      expect(squatButton).toHaveProp('selected', false);
    });

    test('displays exercise-specific guidance', async () => {
      const { getByTestId, getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const squatButton = getByTestId('exercise-squat');
      fireEvent.press(squatButton);

      await waitFor(() => {
        expect(getByText(/depth/i)).toBeTruthy();
      });
    });
  });

  describe('Video Upload', () => {
    test('opens image picker when upload button pressed', async () => {
      const mockImagePicker = require('expo-image-picker');

      const { getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const uploadButton = getByText(/upload.*video/i);
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(mockImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });
    });

    test('validates video duration (minimum)', async () => {
      const mockImagePicker = require('expo-image-picker');
      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///video.mp4', duration: 2000 }] // 2 seconds - too short
      });

      const { getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const uploadButton = getByText(/upload.*video/i);
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.anything(),
          expect.stringContaining('at least')
        );
      });
    });

    test('validates video duration (maximum)', async () => {
      const mockImagePicker = require('expo-image-picker');
      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///video.mp4', duration: 300000 }] // 5 minutes - too long
      });

      const { getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const uploadButton = getByText(/upload.*video/i);
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.anything(),
          expect.stringContaining('maximum')
        );
      });
    });

    test('accepts valid video and navigates to processing', async () => {
      const mockImagePicker = require('expo-image-picker');
      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///video.mp4', duration: 60000 }] // Valid
      });

      const { getByText, getByTestId } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      // Select exercise first
      const squatButton = getByTestId('exercise-squat');
      fireEvent.press(squatButton);

      const uploadButton = getByText(/upload.*video/i);
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith(
          'PoseAnalysisProcessing',
          expect.objectContaining({
            videoUri: 'file:///video.mp4',
            exerciseType: 'squat'
          })
        );
      });
    });

    test('handles user cancellation', async () => {
      const mockImagePicker = require('expo-image-picker');
      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: true
      });

      const { getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const uploadButton = getByText(/upload.*video/i);
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(mockNavigation.navigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Video Recording', () => {
    test('checks camera permission before recording', async () => {
      const mockCamera = require('expo-camera');

      const { getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const recordButton = getByText(/record.*video/i);
      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(mockCamera.Camera.requestCameraPermissionsAsync).toHaveBeenCalled();
      });
    });

    test('shows permission denied message', async () => {
      const mockCamera = require('expo-camera');
      mockCamera.Camera.requestCameraPermissionsAsync.mockResolvedValue({
        status: 'denied',
        granted: false
      });

      const { getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const recordButton = getByText(/record.*video/i);
      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.anything(),
          expect.stringContaining('camera permission')
        );
      });
    });

    test('navigates to camera screen with permission', async () => {
      const mockCamera = require('expo-camera');
      mockCamera.Camera.requestCameraPermissionsAsync.mockResolvedValue({
        status: 'granted',
        granted: true
      });

      const { getByText, getByTestId } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      // Select exercise first
      const squatButton = getByTestId('exercise-squat');
      fireEvent.press(squatButton);

      const recordButton = getByText(/record.*video/i);
      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith(
          'CameraRecording',
          expect.objectContaining({
            exerciseType: 'squat'
          })
        );
      });
    });
  });

  describe('Validation', () => {
    test('requires exercise selection before upload', async () => {
      const { getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const uploadButton = getByText(/upload.*video/i);
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.anything(),
          expect.stringContaining('select.*exercise')
        );
      });
    });

    test('requires exercise selection before recording', async () => {
      const { getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const recordButton = getByText(/record.*video/i);
      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.anything(),
          expect.stringContaining('select.*exercise')
        );
      });
    });

    test('validates video file format', async () => {
      const mockImagePicker = require('expo-image-picker');
      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///image.jpg', duration: null }] // Image, not video
      });

      const { getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const uploadButton = getByText(/upload.*video/i);
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.anything(),
          expect.stringContaining('video file')
        );
      });
    });
  });

  describe('Usage Limits', () => {
    test('checks usage limits for free users', async () => {
      const mockSubscriptionService = require('../../services/poseSubscriptionService');
      mockSubscriptionService.default.checkUsageLimit.mockResolvedValue({
        allowed: true,
        remaining: 2
      });

      const { getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByText(/2.*remaining/i)).toBeTruthy();
      });
    });

    test('shows upgrade prompt when limit exceeded', async () => {
      const mockSubscriptionService = require('../../services/poseSubscriptionService');
      mockSubscriptionService.default.checkUsageLimit.mockResolvedValue({
        allowed: false,
        remaining: 0
      });

      const { getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(getByText(/upgrade.*premium/i)).toBeTruthy();
      });
    });

    test('blocks upload when limit reached', async () => {
      const mockSubscriptionService = require('../../services/poseSubscriptionService');
      mockSubscriptionService.default.checkUsageLimit.mockResolvedValue({
        allowed: false,
        remaining: 0
      });

      const { getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const uploadButton = getByText(/upload.*video/i);
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith(
          'PoseUpgradeScreen'
        );
      });
    });
  });

  describe('Error Handling', () => {
    test('handles image picker error gracefully', async () => {
      const mockImagePicker = require('expo-image-picker');
      mockImagePicker.launchImageLibraryAsync.mockRejectedValue(
        new Error('Picker failed')
      );

      const { getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const uploadButton = getByText(/upload.*video/i);
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.stringContaining('Error'),
          expect.any(String)
        );
      });
    });

    test('handles camera permission error', async () => {
      const mockCamera = require('expo-camera');
      mockCamera.Camera.requestCameraPermissionsAsync.mockRejectedValue(
        new Error('Permission request failed')
      );

      const { getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const recordButton = getByText(/record.*video/i);
      fireEvent.press(recordButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    test('upload button has accessible label', () => {
      const { getByLabelText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      expect(getByLabelText(/upload.*video/i)).toBeTruthy();
    });

    test('record button has accessible label', () => {
      const { getByLabelText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      expect(getByLabelText(/record.*video/i)).toBeTruthy();
    });

    test('exercise buttons have accessible labels', () => {
      const { getByLabelText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      expect(getByLabelText('Select Squat exercise')).toBeTruthy();
      expect(getByLabelText('Select Deadlift exercise')).toBeTruthy();
      expect(getByLabelText('Select Push Up exercise')).toBeTruthy();
    });
  });

  describe('Loading States', () => {
    test('shows loading indicator during upload validation', async () => {
      const mockImagePicker = require('expo-image-picker');
      mockImagePicker.launchImageLibraryAsync.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { getByText, getByTestId } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const uploadButton = getByText(/upload.*video/i);
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(getByTestId('upload-loading')).toBeTruthy();
      });
    });

    test('disables buttons while processing', async () => {
      const mockImagePicker = require('expo-image-picker');
      mockImagePicker.launchImageLibraryAsync.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { getByText } = render(
        <PoseAnalysisUploadScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      const uploadButton = getByText(/upload.*video/i);
      fireEvent.press(uploadButton);

      await waitFor(() => {
        expect(uploadButton).toBeDisabled();
      });
    });
  });
});
