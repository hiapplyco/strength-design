# Pose Analysis Testing Guide

## Overview

This comprehensive testing guide covers all aspects of testing the pose analysis feature in the Strength.Design mobile app, from unit tests to end-to-end testing with real devices.

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Performance Testing](#performance-testing)
6. [Device Testing](#device-testing)
7. [Manual Testing Procedures](#manual-testing-procedures)
8. [Test Data and Assets](#test-data-and-assets)
9. [Debugging and Troubleshooting](#debugging-and-troubleshooting)
10. [Continuous Integration](#continuous-integration)

## Test Environment Setup

### Prerequisites

```bash
# Install testing dependencies
npm install --save-dev
npm install --save-dev @testing-library/react-native
npm install --save-dev jest
npm install --save-dev @types/jest
npm install --save-dev detox
npm install --save-dev @react-native-async-storage/async-storage/jest/async-storage-mock
```

### Test Configuration

Create `jest.config.js`:

```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js'
  ],
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation|@react-native-ml-kit)/)',
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'services/poseDetection/**/*.{js,jsx,ts,tsx}',
    'components/PoseAnalysis/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

Create `jest.setup.js`:

```javascript
import '@testing-library/jest-native/extend-expect';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock ML Kit
jest.mock('@react-native-ml-kit/pose-detection', () => ({
  PoseDetection: jest.fn().mockImplementation(() => ({
    detectPose: jest.fn().mockResolvedValue({
      landmarks: Array.from({ length: 33 }, (_, i) => ({
        x: 0.5 + (Math.random() - 0.5) * 0.1,
        y: 0.3 + (i / 33) * 0.4,
        z: Math.random() * 0.1,
        inFrameLikelihood: 0.8 + Math.random() * 0.2
      }))
    }))
  }))
}));

// Mock Expo modules
jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1000000 }),
  readDirectoryAsync: jest.fn().mockResolvedValue([]),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue('{}'),
}));

jest.mock('expo-av', () => ({
  Video: {
    createAsync: jest.fn().mockResolvedValue({
      getDurationAsync: jest.fn().mockResolvedValue(10000),
      getStatusAsync: jest.fn().mockResolvedValue({ isLoaded: true })
    })
  }
}));

// Global test utilities
global.mockVideoUri = 'file://test-video.mp4';
global.mockExerciseType = 'squat';

// Silence console logs during tests
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.warn = jest.fn();
}
```

## Unit Testing

### Service Layer Tests

Create `services/poseDetection/__tests__/PoseAnalysisService.test.ts`:

```typescript
import poseAnalysisService, { PoseAnalysisService } from '../PoseAnalysisService';
import { ExerciseType, AnalysisErrorType } from '../types';

describe('PoseAnalysisService', () => {
  let service: PoseAnalysisService;

  beforeEach(async () => {
    service = new PoseAnalysisService();
    await service.initialize();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      const result = await service.initialize();
      expect(result.success).toBe(true);
      expect(result.message).toContain('initialized successfully');
    });

    test('should handle initialization failure gracefully', async () => {
      const failingService = new PoseAnalysisService();
      // Mock a failure scenario
      jest.spyOn(failingService, 'checkMLKitAvailability' as any)
        .mockRejectedValue(new Error('ML Kit unavailable'));
      
      const result = await failingService.initialize();
      expect(result.success).toBe(false);
      expect(result.message).toContain('failed');
    });
  });

  describe('Video Analysis', () => {
    test('should analyze squat video successfully', async () => {
      const result = await service.analyzeVideoFile(
        global.mockVideoUri,
        ExerciseType.SQUAT
      );

      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis?.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.analysis?.overallScore).toBeLessThanOrEqual(100);
    });

    test('should handle invalid video file', async () => {
      const result = await service.analyzeVideoFile(
        'invalid://video.mp4',
        ExerciseType.SQUAT
      );

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0].type).toBe(AnalysisErrorType.POSE_DETECTION_FAILED);
    });

    test('should prevent duplicate analysis requests', async () => {
      const promise1 = service.analyzeVideoFile(global.mockVideoUri, ExerciseType.SQUAT);
      const promise2 = service.analyzeVideoFile(global.mockVideoUri, ExerciseType.SQUAT);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toEqual(result2);
    });

    test('should handle unsupported exercise type', async () => {
      const result = await service.analyzeVideoFile(
        global.mockVideoUri,
        'unsupported_exercise' as any
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0].type).toBe(AnalysisErrorType.INVALID_EXERCISE_TYPE);
    });
  });

  describe('Analysis Results', () => {
    test('should return valid squat analysis structure', async () => {
      const result = await service.analyzeVideoFile(global.mockVideoUri, ExerciseType.SQUAT);
      
      expect(result.success).toBe(true);
      expect(result.analysis).toHaveProperty('overallScore');
      expect(result.analysis).toHaveProperty('criticalErrors');
      expect(result.analysis).toHaveProperty('improvements');
      expect(result.analysis).toHaveProperty('keyPhases');
      expect(result.analysis).toHaveProperty('timing');
    });

    test('should calculate confidence metrics correctly', async () => {
      const result = await service.analyzeVideoFile(global.mockVideoUri, ExerciseType.SQUAT);
      
      expect(result.confidenceMetrics).toBeDefined();
      expect(result.confidenceMetrics.averageLandmarkConfidence).toBeGreaterThan(0);
      expect(result.confidenceMetrics.framesCoverage).toBeGreaterThan(0);
      expect(result.confidenceMetrics.analysisReliability).toBeGreaterThan(0);
    });
  });

  describe('Caching and History', () => {
    test('should save analysis to history', async () => {
      await service.analyzeVideoFile(global.mockVideoUri, ExerciseType.SQUAT, {
        saveToHistory: true
      });

      const history = await service.getAnalysisHistory(10);
      expect(history).toHaveLength(1);
      expect(history[0]).toHaveProperty('exerciseType');
      expect(history[0]).toHaveProperty('result');
    });

    test('should clear cache successfully', async () => {
      await service.analyzeVideoFile(global.mockVideoUri, ExerciseType.SQUAT);
      await service.clearCache();
      
      const status = service.getStatus();
      expect(status.cacheSize).toBe(0);
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration', async () => {
      const newConfig = { confidenceThreshold: 0.9 };
      await service.updateConfig(newConfig);
      
      const status = service.getStatus();
      expect(status.config.confidenceThreshold).toBe(0.9);
    });
  });
});
```

### Component Tests

Create `components/PoseAnalysis/__tests__/PoseAnalysisScreen.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PoseAnalysisUploadScreen } from '../PoseAnalysisUploadScreen';

// Mock the pose analysis service
jest.mock('../../../services/poseDetection/PoseAnalysisService', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn().mockResolvedValue({ success: true }),
    analyzeVideoFile: jest.fn().mockResolvedValue({
      success: true,
      analysis: {
        overallScore: 85,
        criticalErrors: [],
        improvements: []
      }
    })
  }
}));

describe('PoseAnalysisUploadScreen', () => {
  test('should render upload screen correctly', () => {
    const { getByText, getByTestId } = render(<PoseAnalysisUploadScreen />);
    
    expect(getByText('Upload Exercise Video')).toBeTruthy();
    expect(getByTestId('upload-button')).toBeTruthy();
    expect(getByTestId('exercise-type-selector')).toBeTruthy();
  });

  test('should handle video upload', async () => {
    const { getByTestId } = render(<PoseAnalysisUploadScreen />);
    
    const uploadButton = getByTestId('upload-button');
    fireEvent.press(uploadButton);

    await waitFor(() => {
      expect(getByTestId('upload-progress')).toBeTruthy();
    });
  });

  test('should display analysis results', async () => {
    const { getByTestId, getByText } = render(<PoseAnalysisUploadScreen />);
    
    // Simulate successful video upload and analysis
    const uploadButton = getByTestId('upload-button');
    fireEvent.press(uploadButton);

    await waitFor(() => {
      expect(getByText('Analysis Complete')).toBeTruthy();
      expect(getByText('Score: 85/100')).toBeTruthy();
    });
  });

  test('should handle analysis errors', async () => {
    // Mock error scenario
    const mockService = require('../../../services/poseDetection/PoseAnalysisService').default;
    mockService.analyzeVideoFile.mockResolvedValueOnce({
      success: false,
      errors: [{ message: 'Analysis failed' }]
    });

    const { getByTestId, getByText } = render(<PoseAnalysisUploadScreen />);
    
    const uploadButton = getByTestId('upload-button');
    fireEvent.press(uploadButton);

    await waitFor(() => {
      expect(getByText('Analysis Failed')).toBeTruthy();
    });
  });
});
```

### Utility Function Tests

Create `services/poseDetection/__tests__/analyzers.test.ts`:

```typescript
import { SquatAnalyzer } from '../analyzers/SquatAnalyzer';
import { calculateAngle, detectMovementPhases } from '../analyzers/MovementAnalyzer';
import { PoseSequence } from '../types';

describe('Movement Analyzers', () => {
  describe('SquatAnalyzer', () => {
    let analyzer: SquatAnalyzer;

    beforeEach(() => {
      analyzer = new SquatAnalyzer();
    });

    test('should detect squat depth correctly', () => {
      const mockPoseSequence: PoseSequence = [
        // Mock pose data representing a squat movement
        {
          landmarks: Array.from({ length: 33 }, () => ({
            x: 0.5, y: 0.5, z: 0, inFrameLikelihood: 0.9
          })),
          timestamp: 0,
          frameIndex: 0
        }
      ];

      const analysis = analyzer.analyzeDepth(mockPoseSequence);
      
      expect(analysis).toHaveProperty('maxDepth');
      expect(analysis).toHaveProperty('reachedParallel');
      expect(analysis.depthScore).toBeGreaterThanOrEqual(0);
      expect(analysis.depthScore).toBeLessThanOrEqual(100);
    });

    test('should detect knee alignment issues', () => {
      const mockPoseSequence: PoseSequence = [
        // Mock pose data with knee valgus
        {
          landmarks: Array.from({ length: 33 }, (_, i) => ({
            x: i === 25 ? 0.3 : 0.5, // Left knee inward
            y: 0.5,
            z: 0,
            inFrameLikelihood: 0.9
          })),
          timestamp: 0,
          frameIndex: 0
        }
      ];

      const analysis = analyzer.analyzeKneeAlignment(mockPoseSequence);
      
      expect(analysis.valgusCollapse).toBe(true);
      expect(analysis.maxInwardDeviation).toBeGreaterThan(0);
    });
  });

  describe('Movement Analysis Utilities', () => {
    test('should calculate joint angles correctly', () => {
      const point1 = { x: 0, y: 0, z: 0, inFrameLikelihood: 1 };
      const point2 = { x: 1, y: 0, z: 0, inFrameLikelihood: 1 };
      const point3 = { x: 1, y: 1, z: 0, inFrameLikelihood: 1 };

      const angle = calculateAngle(point1, point2, point3);
      
      expect(angle).toBeCloseTo(90, 1); // 90 degree angle
    });

    test('should detect movement phases', () => {
      const mockPoseSequence: PoseSequence = Array.from({ length: 30 }, (_, i) => ({
        landmarks: Array.from({ length: 33 }, () => ({
          x: 0.5,
          y: 0.5 + Math.sin(i / 10) * 0.2, // Simulate up-down movement
          z: 0,
          inFrameLikelihood: 0.9
        })),
        timestamp: i * 100,
        frameIndex: i
      }));

      const phases = detectMovementPhases(mockPoseSequence, 'squat');
      
      expect(phases).toHaveLength(3); // descent, bottom, ascent
      expect(phases[0].type).toBe('descent');
      expect(phases[1].type).toBe('bottom');
      expect(phases[2].type).toBe('ascent');
    });
  });
});
```

## Integration Testing

### API Integration Tests

Create `__tests__/integration/poseAnalysisIntegration.test.ts`:

```typescript
import poseAnalysisService from '../../services/poseDetection/PoseAnalysisService';
import { ExerciseType } from '../../services/poseDetection/types';
import * as FileSystem from 'expo-file-system';

describe('Pose Analysis Integration Tests', () => {
  beforeAll(async () => {
    await poseAnalysisService.initialize();
  });

  afterAll(() => {
    poseAnalysisService.destroy();
  });

  test('should complete full analysis workflow', async () => {
    // Create a mock video file
    const mockVideoPath = `${FileSystem.documentDirectory}test-squat.mp4`;
    await FileSystem.writeAsStringAsync(mockVideoPath, 'mock video content');

    // Perform analysis
    const result = await poseAnalysisService.analyzeVideoFile(
      mockVideoPath,
      ExerciseType.SQUAT,
      {
        frameExtractionOptions: {
          frameRate: 10,
          quality: 'medium'
        },
        saveToHistory: true
      }
    );

    // Verify results
    expect(result.success).toBe(true);
    expect(result.analysis).toBeDefined();
    expect(result.framesProcessed).toBeGreaterThan(0);
    expect(result.processingTime).toBeGreaterThan(0);

    // Verify history was saved
    const history = await poseAnalysisService.getAnalysisHistory(1);
    expect(history).toHaveLength(1);

    // Cleanup
    await FileSystem.deleteAsync(mockVideoPath);
  });

  test('should handle concurrent analysis requests', async () => {
    const videoPath1 = `${FileSystem.documentDirectory}test1.mp4`;
    const videoPath2 = `${FileSystem.documentDirectory}test2.mp4`;
    
    await FileSystem.writeAsStringAsync(videoPath1, 'mock video 1');
    await FileSystem.writeAsStringAsync(videoPath2, 'mock video 2');

    const [result1, result2] = await Promise.all([
      poseAnalysisService.analyzeVideoFile(videoPath1, ExerciseType.SQUAT),
      poseAnalysisService.analyzeVideoFile(videoPath2, ExerciseType.DEADLIFT)
    ]);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);

    // Cleanup
    await FileSystem.deleteAsync(videoPath1);
    await FileSystem.deleteAsync(videoPath2);
  });
});
```

### Camera Integration Tests

Create `__tests__/integration/cameraIntegration.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { WorkoutVideoRecorderAI } from '../../components/WorkoutVideoRecorderAI';

// Mock expo-camera
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    Constants: {
      Type: { back: 'back', front: 'front' }
    }
  }
}));

describe('Camera Integration with Pose Analysis', () => {
  test('should record video and trigger pose analysis', async () => {
    const mockOnAnalysisComplete = jest.fn();
    
    const { getByTestId } = render(
      <WorkoutVideoRecorderAI
        exerciseType="squat"
        onAnalysisComplete={mockOnAnalysisComplete}
      />
    );

    // Start recording
    const recordButton = getByTestId('record-button');
    fireEvent.press(recordButton);

    await waitFor(() => {
      expect(getByTestId('recording-indicator')).toBeTruthy();
    });

    // Stop recording
    fireEvent.press(recordButton);

    await waitFor(() => {
      expect(mockOnAnalysisComplete).toHaveBeenCalled();
    }, { timeout: 10000 });
  });
});
```

## End-to-End Testing

### Detox E2E Tests

Create `e2e/poseAnalysis.e2e.js`:

```javascript
describe('Pose Analysis E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete pose analysis workflow', async () => {
    // Navigate to pose analysis screen
    await element(by.text('Pose Analysis')).tap();
    
    // Select exercise type
    await element(by.id('exercise-type-selector')).tap();
    await element(by.text('Squat')).tap();
    
    // Upload video (in real test, this would be a test video file)
    await element(by.id('upload-video-button')).tap();
    await element(by.text('Choose from Library')).tap();
    
    // Wait for analysis to complete
    await waitFor(element(by.text('Analysis Complete')))
      .toBeVisible()
      .withTimeout(30000);
    
    // Verify results are displayed
    await expect(element(by.id('analysis-score'))).toBeVisible();
    await expect(element(by.id('form-feedback'))).toBeVisible();
  });

  it('should handle camera recording', async () => {
    await element(by.text('Pose Analysis')).tap();
    await element(by.id('record-video-button')).tap();
    
    // Grant camera permissions if prompted
    await element(by.text('Allow')).tap();
    
    // Start recording
    await element(by.id('camera-record-button')).tap();
    
    // Record for 5 seconds
    await device.sleep(5000);
    
    // Stop recording
    await element(by.id('camera-record-button')).tap();
    
    // Verify analysis starts
    await waitFor(element(by.text('Analyzing...')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should display error for invalid video', async () => {
    await element(by.text('Pose Analysis')).tap();
    
    // Upload invalid video file
    await element(by.id('upload-video-button')).tap();
    // Select corrupted or invalid video
    
    await waitFor(element(by.text('Analysis Failed')))
      .toBeVisible()
      .withTimeout(15000);
      
    await expect(element(by.text('Please try with a different video')))
      .toBeVisible();
  });
});
```

## Performance Testing

### Performance Benchmarks

Create `__tests__/performance/poseAnalysisPerformance.test.ts`:

```typescript
import poseAnalysisService from '../../services/poseDetection/PoseAnalysisService';
import { ExerciseType } from '../../services/poseDetection/types';

describe('Pose Analysis Performance Tests', () => {
  beforeAll(async () => {
    await poseAnalysisService.initialize();
  });

  test('should complete analysis within time limits', async () => {
    const startTime = Date.now();
    
    const result = await poseAnalysisService.analyzeVideoFile(
      global.mockVideoUri,
      ExerciseType.SQUAT
    );
    
    const processingTime = Date.now() - startTime;
    
    expect(result.success).toBe(true);
    expect(processingTime).toBeLessThan(30000); // 30 seconds max
  });

  test('should handle memory efficiently', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Run multiple analyses
    for (let i = 0; i < 5; i++) {
      await poseAnalysisService.analyzeVideoFile(
        `mock://video-${i}.mp4`,
        ExerciseType.SQUAT
      );
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be reasonable (less than 100MB)
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
  });

  test('should process frames at target rate', async () => {
    const mockFrames = Array.from({ length: 150 }, (_, i) => ({
      uri: `frame-${i}`,
      timestamp: i * 33.33, // 30fps
      duration: 33.33
    }));

    const startTime = Date.now();
    const result = await poseAnalysisService['processFramesForPoseDetection'](mockFrames);
    const processingTime = Date.now() - startTime;
    
    const framesPerSecond = mockFrames.length / (processingTime / 1000);
    
    expect(framesPerSecond).toBeGreaterThan(10); // At least 10 fps processing
    expect(result.length).toBeGreaterThan(0);
  });
});
```

### Memory Leak Tests

```typescript
describe('Memory Leak Tests', () => {
  test('should not leak memory on repeated analyses', async () => {
    const iterations = 10;
    const memoryMeasurements: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      await poseAnalysisService.analyzeVideoFile(global.mockVideoUri, ExerciseType.SQUAT);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      memoryMeasurements.push(process.memoryUsage().heapUsed);
    }
    
    // Memory should not consistently increase
    const trend = memoryMeasurements.slice(-3).reduce((a, b) => a + b) / 3 - 
                  memoryMeasurements.slice(0, 3).reduce((a, b) => a + b) / 3;
    
    expect(trend).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
  });
});
```

## Device Testing

### Device Test Matrix

Test on the following device categories:

#### iOS Devices
- **iPhone 12 Pro** (iOS 15.0) - High-end device
- **iPhone SE 3rd Gen** (iOS 15.0) - Mid-range device
- **iPad Air 5th Gen** (iPadOS 15.0) - Tablet testing

#### Android Devices
- **Google Pixel 6** (Android 12) - High-end Android
- **Samsung Galaxy A52** (Android 11) - Mid-range device
- **OnePlus 8** (Android 10) - Different OEM

### Device-Specific Test Scripts

Create `scripts/test-on-device.sh`:

```bash
#!/bin/bash

# Test script for device-specific pose analysis testing
DEVICE_TYPE=$1
TEST_VIDEO_PATH=$2

echo "Starting pose analysis tests on $DEVICE_TYPE"

# Install app
if [ "$DEVICE_TYPE" = "ios" ]; then
    npx expo run:ios --device
elif [ "$DEVICE_TYPE" = "android" ]; then
    npx expo run:android --device
fi

# Wait for app to load
sleep 10

# Run automated tests
npx detox test --configuration $DEVICE_TYPE.release

# Performance monitoring
echo "Running performance tests..."
node scripts/performance-monitor.js $DEVICE_TYPE

echo "Tests completed for $DEVICE_TYPE"
```

### Performance Monitoring Script

Create `scripts/performance-monitor.js`:

```javascript
const { execSync } = require('child_process');

function monitorPerformance(deviceType) {
  console.log(`Monitoring performance on ${deviceType}...`);
  
  const startTime = Date.now();
  
  // Simulate video analysis
  const analysisCommand = deviceType === 'ios' 
    ? 'xcrun simctl io booted recordVideo test-recording.mov'
    : 'adb shell screenrecord /sdcard/test-recording.mp4';
    
  try {
    execSync(analysisCommand, { timeout: 30000 });
    console.log('Video recording completed successfully');
  } catch (error) {
    console.error('Performance test failed:', error.message);
  }
  
  const totalTime = Date.now() - startTime;
  console.log(`Total test time: ${totalTime}ms`);
}

const deviceType = process.argv[2];
monitorPerformance(deviceType);
```

## Manual Testing Procedures

### Pre-Testing Checklist

- [ ] Latest app build installed on test device
- [ ] Camera and storage permissions granted
- [ ] Sufficient storage space (>1GB) available
- [ ] Network connectivity available
- [ ] Test video files prepared

### Exercise Analysis Testing

#### Squat Analysis Test

1. **Setup**
   - Record 15-second squat video with good lighting
   - Ensure full body is visible in frame
   - Use stable camera position

2. **Test Steps**
   - Navigate to Pose Analysis screen
   - Select "Squat" exercise type
   - Upload or record test video
   - Wait for analysis completion (should be <30 seconds)

3. **Expected Results**
   - Analysis score between 0-100
   - Depth analysis showing parallel achievement
   - Knee tracking feedback
   - Spinal alignment assessment
   - Form improvement suggestions

4. **Edge Cases to Test**
   - Poor lighting conditions
   - Partial body visibility
   - Multiple people in frame
   - Very short videos (<3 seconds)
   - Very long videos (>60 seconds)

#### Error Handling Test

1. **Invalid Video Formats**
   - Try uploading non-video files
   - Upload corrupted video files
   - Upload extremely large video files

2. **Network Conditions**
   - Test with no internet connection
   - Test with slow network
   - Test network interruption during analysis

3. **Permission Scenarios**
   - Deny camera permissions
   - Deny storage permissions
   - Revoke permissions during usage

### User Experience Testing

#### Accessibility Testing

- Test with VoiceOver (iOS) / TalkBack (Android)
- Test with larger text sizes
- Test color contrast in different lighting
- Test touch target sizes

#### Performance Testing

- Monitor app responsiveness during analysis
- Check memory usage during long sessions
- Test app stability with multiple analyses
- Monitor battery consumption

## Test Data and Assets

### Test Video Library

Create a library of test videos in `assets/test-videos/`:

```
assets/test-videos/
├── squats/
│   ├── perfect-form-10sec.mp4
│   ├── knee-cave-issue-15sec.mp4
│   ├── shallow-depth-12sec.mp4
│   └── good-lighting-20sec.mp4
├── deadlifts/
│   ├── conventional-good-form.mp4
│   └── rounded-back-issue.mp4
├── push-ups/
│   └── standard-push-up-set.mp4
└── edge-cases/
    ├── poor-lighting.mp4
    ├── multiple-people.mp4
    ├── camera-shake.mp4
    └── partial-visibility.mp4
```

### Mock Data Generators

Create `__tests__/utils/mockDataGenerators.ts`:

```typescript
import { PoseSequence, Landmark } from '../../services/poseDetection/types';

export function generateMockSquatSequence(duration: number = 3000): PoseSequence {
  const frames = Math.floor(duration / 33.33); // 30fps
  const sequence: PoseSequence = [];
  
  for (let i = 0; i < frames; i++) {
    const timestamp = i * 33.33;
    const progress = i / frames;
    
    // Simulate squat movement pattern
    const squatDepth = Math.sin(progress * Math.PI * 2) * 0.3 + 0.7;
    
    const landmarks: Landmark[] = Array.from({ length: 33 }, (_, landmarkIndex) => ({
      x: 0.5 + (Math.random() - 0.5) * 0.1,
      y: landmarkIndex < 11 ? 0.2 : 0.2 + (landmarkIndex / 33) * 0.6 * squatDepth,
      z: Math.random() * 0.1,
      inFrameLikelihood: 0.8 + Math.random() * 0.2
    }));
    
    sequence.push({
      landmarks,
      timestamp,
      frameIndex: i
    });
  }
  
  return sequence;
}

export function generateMockVideoFrame(timestamp: number, index: number) {
  return {
    uri: `mock://frame-${index}`,
    timestamp,
    duration: 33.33
  };
}
```

## Debugging and Troubleshooting

### Debug Configuration

Create `config/debug.ts`:

```typescript
export const DEBUG_CONFIG = {
  ENABLE_POSE_VISUALIZATION: __DEV__,
  LOG_ANALYSIS_STEPS: __DEV__,
  SHOW_PERFORMANCE_METRICS: __DEV__,
  MOCK_ML_KIT: __DEV__,
  SAVE_DEBUG_VIDEOS: false,
  LOG_LEVEL: __DEV__ ? 'debug' : 'error'
};

export function debugLog(level: string, message: string, data?: any) {
  if (__DEV__ || DEBUG_CONFIG.LOG_LEVEL === 'debug') {
    console.log(`[POSE_DEBUG_${level.toUpperCase()}]`, message, data);
  }
}
```

### Common Test Issues and Solutions

#### Issue: Tests failing with ML Kit errors
```typescript
// Solution: Ensure proper mocking
jest.mock('@react-native-ml-kit/pose-detection', () => ({
  // Complete mock implementation
}));
```

#### Issue: Timeout errors in analysis tests
```typescript
// Solution: Increase timeout for heavy operations
test('should analyze video', async () => {
  // Test implementation
}, 60000); // 60 second timeout
```

#### Issue: Memory-related test failures
```typescript
// Solution: Cleanup resources properly
afterEach(() => {
  // Clear caches, destroy services
  poseAnalysisService.destroy();
});
```

### Testing Utilities

Create `__tests__/utils/testHelpers.ts`:

```typescript
import { act } from '@testing-library/react-native';

export async function waitForAnalysisComplete(getByTestId: any, timeout = 30000) {
  return act(async () => {
    await new Promise(resolve => {
      const checkForCompletion = () => {
        try {
          getByTestId('analysis-complete');
          resolve(true);
        } catch {
          setTimeout(checkForCompletion, 100);
        }
      };
      checkForCompletion();
      
      // Timeout fallback
      setTimeout(() => resolve(false), timeout);
    });
  });
}

export function createMockVideoFile(name: string, duration: number = 10000) {
  return {
    uri: `file://test-videos/${name}`,
    type: 'video/mp4',
    duration,
    size: 1024 * 1024 * 5 // 5MB
  };
}
```

## Continuous Integration

### GitHub Actions Workflow

Create `.github/workflows/pose-analysis-tests.yml`:

```yaml
name: Pose Analysis Tests

on:
  push:
    branches: [main, develop]
    paths:
      - 'services/poseDetection/**'
      - 'components/PoseAnalysis/**'
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: |
        cd mobile
        npm ci
        
    - name: Run pose analysis unit tests
      run: |
        cd mobile
        npm run test:pose -- --coverage
        
    - name: Run integration tests
      run: |
        cd mobile
        npm run test:integration:pose
        
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./mobile/coverage/lcov.info
        
  e2e-test:
    runs-on: macos-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup iOS Simulator
      run: |
        xcrun simctl boot "iPhone 13"
        
    - name: Install dependencies
      run: |
        cd mobile
        npm ci
        
    - name: Build iOS app
      run: |
        cd mobile
        npx detox build --configuration ios.sim.release
        
    - name: Run E2E tests
      run: |
        cd mobile
        npx detox test --configuration ios.sim.release --record-videos failing
        
    - name: Upload test artifacts
      if: failure()
      uses: actions/upload-artifact@v3
      with:
        name: detox-artifacts
        path: mobile/artifacts/
```

### Test Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:pose": "jest --testPathPattern=poseDetection",
    "test:integration": "jest --testPathPattern=integration",
    "test:integration:pose": "jest --testPathPattern=integration.*pose",
    "test:e2e": "detox test",
    "test:e2e:ios": "detox test --configuration ios.sim.release",
    "test:e2e:android": "detox test --configuration android.emu.release",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:performance": "jest --testPathPattern=performance"
  }
}
```

This comprehensive testing guide ensures thorough validation of the pose analysis feature across all aspects - from unit tests to real device testing, providing confidence in the production deployment.