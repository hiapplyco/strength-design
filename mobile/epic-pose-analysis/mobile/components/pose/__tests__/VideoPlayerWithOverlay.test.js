/**
 * VideoPlayerWithOverlay Test Suite
 * Tests for video playback with pose landmark overlay rendering
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import VideoPlayerWithOverlay from '../VideoPlayerWithOverlay';

const mockVideoUri = 'file:///mock/analysis-video.mp4';

const mockLandmarks = [
  {
    landmarks: Array.from({ length: 33 }, (_, i) => ({
      x: 0.5,
      y: 0.5,
      z: 0.0,
      visibility: 0.9,
      presence: 0.95
    })),
    timestamp: 0,
    frameNumber: 0,
    confidence: 0.92
  }
];

describe('VideoPlayerWithOverlay', () => {
  describe('Video Playback', () => {
    test('renders video player with controls', () => {
      const { getByTestId } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={mockLandmarks}
        />
      );

      expect(getByTestId('video-player')).toBeTruthy();
      expect(getByTestId('play-pause-button')).toBeTruthy();
    });

    test('plays video when play button pressed', async () => {
      const { getByTestId } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={mockLandmarks}
        />
      );

      const playButton = getByTestId('play-pause-button');

      fireEvent.press(playButton);

      await waitFor(() => {
        expect(getByTestId('video-player')).toHaveProp('isPlaying', true);
      });
    });

    test('pauses video when pause button pressed', async () => {
      const { getByTestId } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={mockLandmarks}
        />
      );

      const playButton = getByTestId('play-pause-button');

      // Play
      fireEvent.press(playButton);
      await waitFor(() => {
        expect(getByTestId('video-player')).toHaveProp('isPlaying', true);
      });

      // Pause
      fireEvent.press(playButton);
      await waitFor(() => {
        expect(getByTestId('video-player')).toHaveProp('isPlaying', false);
      });
    });

    test('seeks to specific position when scrubber moved', async () => {
      const { getByTestId } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={mockLandmarks}
          duration={60000}
        />
      );

      const scrubber = getByTestId('video-scrubber');

      fireEvent(scrubber, 'onValueChange', 30000); // Seek to 30s

      await waitFor(() => {
        expect(getByTestId('video-player')).toHaveProp('positionMillis', 30000);
      });
    });
  });

  describe('Pose Overlay Rendering', () => {
    test('renders pose landmarks overlay', () => {
      const { getByTestId } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={mockLandmarks}
          showOverlay={true}
        />
      );

      expect(getByTestId('pose-overlay')).toBeTruthy();
    });

    test('hides overlay when showOverlay is false', () => {
      const { queryByTestId } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={mockLandmarks}
          showOverlay={false}
        />
      );

      expect(queryByTestId('pose-overlay')).toBeNull();
    });

    test('toggles overlay when toggle button pressed', async () => {
      const { getByTestId, queryByTestId } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={mockLandmarks}
          showOverlay={true}
        />
      );

      const toggleButton = getByTestId('toggle-overlay-button');

      // Overlay visible initially
      expect(getByTestId('pose-overlay')).toBeTruthy();

      // Hide
      fireEvent.press(toggleButton);
      await waitFor(() => {
        expect(queryByTestId('pose-overlay')).toBeNull();
      });

      // Show
      fireEvent.press(toggleButton);
      await waitFor(() => {
        expect(getByTestId('pose-overlay')).toBeTruthy();
      });
    });

    test('syncs overlay with video position', async () => {
      const multipleLandmarks = [
        { ...mockLandmarks[0], timestamp: 0 },
        { ...mockLandmarks[0], timestamp: 1000 },
        { ...mockLandmarks[0], timestamp: 2000 }
      ];

      const { getByTestId } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={multipleLandmarks}
          showOverlay={true}
        />
      );

      // Seek to 1500ms
      const scrubber = getByTestId('video-scrubber');
      fireEvent(scrubber, 'onValueChange', 1500);

      await waitFor(() => {
        // Should show landmarks for timestamp 1000 (closest)
        const overlay = getByTestId('pose-overlay');
        expect(overlay).toHaveProp('currentTimestamp', 1000);
      });
    });
  });

  describe('Controls', () => {
    test('renders all video controls', () => {
      const { getByTestId } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={mockLandmarks}
        />
      );

      expect(getByTestId('play-pause-button')).toBeTruthy();
      expect(getByTestId('video-scrubber')).toBeTruthy();
      expect(getByTestId('current-time')).toBeTruthy();
      expect(getByTestId('duration')).toBeTruthy();
      expect(getByTestId('toggle-overlay-button')).toBeTruthy();
    });

    test('displays current playback time', async () => {
      const { getByTestId } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={mockLandmarks}
          duration={60000}
        />
      );

      const currentTimeDisplay = getByTestId('current-time');

      // Initially 0:00
      expect(currentTimeDisplay).toHaveTextContent('0:00');

      // Seek to 30s
      const scrubber = getByTestId('video-scrubber');
      fireEvent(scrubber, 'onValueChange', 30000);

      await waitFor(() => {
        expect(currentTimeDisplay).toHaveTextContent('0:30');
      });
    });

    test('displays total duration', () => {
      const { getByTestId } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={mockLandmarks}
          duration={90000} // 1:30
        />
      );

      const durationDisplay = getByTestId('duration');

      expect(durationDisplay).toHaveTextContent('1:30');
    });
  });

  describe('Performance', () => {
    test('maintains 60fps during playback', async () => {
      const { getByTestId } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={mockLandmarks}
          showOverlay={true}
        />
      );

      const playButton = getByTestId('play-pause-button');
      fireEvent.press(playButton);

      // Check frame rate after a short time
      await waitFor(() => {
        const fpsIndicator = getByTestId('fps-indicator');
        const fps = parseInt(fpsIndicator.props.children);

        expect(fps).toBeGreaterThanOrEqual(55); // Allow some variance
      }, { timeout: 2000 });
    });

    test('uses optimized rendering for overlay', () => {
      const manyLandmarks = Array.from({ length: 100 }, (_, i) => ({
        ...mockLandmarks[0],
        timestamp: i * 100
      }));

      const { getByTestId } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={manyLandmarks}
          showOverlay={true}
        />
      );

      // Should render without crashing even with many landmarks
      expect(getByTestId('pose-overlay')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('handles video load error', async () => {
      const { getByTestId, getByText } = render(
        <VideoPlayerWithOverlay
          videoUri="invalid://video.mp4"
          landmarks={mockLandmarks}
        />
      );

      await waitFor(() => {
        expect(getByText(/failed to load/i)).toBeTruthy();
      });
    });

    test('handles missing landmarks gracefully', () => {
      const { getByTestId, queryByTestId } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={[]}
          showOverlay={true}
        />
      );

      expect(getByTestId('video-player')).toBeTruthy();
      // Overlay should not crash, just show empty
      expect(queryByTestId('pose-overlay')).toBeTruthy();
    });

    test('handles corrupted landmark data', () => {
      const corruptedLandmarks = [
        {
          landmarks: null, // Invalid
          timestamp: 0,
          frameNumber: 0,
          confidence: 0.5
        }
      ];

      expect(() => {
        render(
          <VideoPlayerWithOverlay
            videoUri={mockVideoUri}
            landmarks={corruptedLandmarks}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    test('play button has accessible label', () => {
      const { getByLabelText } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={mockLandmarks}
        />
      );

      expect(getByLabelText('Play')).toBeTruthy();
    });

    test('overlay toggle has accessible label', () => {
      const { getByLabelText } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={mockLandmarks}
        />
      );

      expect(getByLabelText(/toggle.*overlay/i)).toBeTruthy();
    });

    test('scrubber has accessible role', () => {
      const { getByRole } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={mockLandmarks}
        />
      );

      expect(getByRole('slider')).toBeTruthy();
    });
  });

  describe('Callbacks', () => {
    test('calls onPlaybackStatusUpdate with current status', async () => {
      const onStatusUpdate = jest.fn();

      const { getByTestId } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={mockLandmarks}
          onPlaybackStatusUpdate={onStatusUpdate}
        />
      );

      const playButton = getByTestId('play-pause-button');
      fireEvent.press(playButton);

      await waitFor(() => {
        expect(onStatusUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            isPlaying: true,
            positionMillis: expect.any(Number)
          })
        );
      });
    });

    test('calls onOverlayToggle when overlay toggled', async () => {
      const onToggle = jest.fn();

      const { getByTestId } = render(
        <VideoPlayerWithOverlay
          videoUri={mockVideoUri}
          landmarks={mockLandmarks}
          onOverlayToggle={onToggle}
        />
      );

      const toggleButton = getByTestId('toggle-overlay-button');
      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(onToggle).toHaveBeenCalledWith(false);
      });
    });
  });
});
