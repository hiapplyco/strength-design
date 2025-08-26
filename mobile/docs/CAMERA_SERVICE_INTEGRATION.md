# Camera Service Integration Guide

This guide demonstrates how to integrate the pose analysis camera service with video recording and upload components.

## Quick Start

```javascript
import cameraService, { CameraUtils, CAMERA_CONSTANTS } from '../services/cameraService';

// Initialize service (typically in App.js or main component)
await cameraService.initialize();
```

## Basic Integration Examples

### 1. Video Recording Component Integration

```javascript
import React, { useState, useEffect } from 'react';
import cameraService, { CameraUtils } from '../services/cameraService';

function VideoCaptureComponent({ selectedExercise, onVideoRecorded }) {
  const [config, setConfig] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    if (selectedExercise) {
      // Get optimal configuration for exercise
      const optimalConfig = cameraService.getOptimalVideoConfig(selectedExercise.name, {
        quality: 'pose_analysis',
        maxDuration: 30
      });
      setConfig(optimalConfig);
    }
  }, [selectedExercise]);

  const startRecording = async () => {
    const newSessionId = CameraUtils.generateSessionId();
    setSessionId(newSessionId);
    
    // Start session tracking
    cameraService.startRecordingSession(newSessionId, selectedExercise.name, config);
    
    // Use config for camera recording
    const recordingOptions = config.recordingOptions;
    // ... implement actual recording with expo-camera
  };

  const handleRecordingComplete = async (videoUri, duration) => {
    try {
      // Create metadata
      const metadata = {
        duration,
        exercise: selectedExercise.name,
        timestamp: new Date().toISOString(),
        quality: config.qualityInfo.name
      };

      // Validate video
      const validation = await cameraService.validateVideoFile(videoUri, metadata);
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Complete session
      cameraService.completeRecordingSession(sessionId, {
        uri: videoUri,
        ...metadata,
        fileSize: validation.fileInfo?.size
      });

      onVideoRecorded(videoUri, metadata);
    } catch (error) {
      cameraService.failRecordingSession(sessionId, error);
      console.error('Recording failed:', error);
    }
  };

  return (
    // Your camera UI with config.exerciseSettings for guidance
    <div>
      {config && (
        <div>
          <p>Position camera: {config.exerciseSettings.recommendedAngle}</p>
          <p>Distance: {config.exerciseSettings.optimalDistance}</p>
          <p>Min duration: {config.exerciseSettings.minDuration}s</p>
        </div>
      )}
    </div>
  );
}
```

### 2. Video Upload Component Integration

```javascript
import React, { useState } from 'react';
import cameraService, { CameraUtils } from '../services/cameraService';

function VideoUploadComponent({ selectedExercise, onVideoUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleGalleryUpload = async () => {
    try {
      setUploading(true);
      setError(null);

      const result = await cameraService.uploadFromGallery({
        exerciseType: selectedExercise?.name,
        maxDuration: 60,
        allowEditing: true
      });

      if (result.success) {
        if (!result.validation.isValid) {
          setError(result.validation.errors.join(', '));
          return;
        }

        // Show warnings to user if any
        if (result.validation.warnings.length > 0) {
          console.warn('Video upload warnings:', result.validation.warnings);
        }

        onVideoUploaded(result.uri, result.asset);
      }
    } catch (error) {
      setError(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <button onClick={handleGalleryUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload from Gallery'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

### 3. Quality Selection Component

```javascript
import React, { useState } from 'react';
import { CameraUtils } from '../services/cameraService';

function QualitySelector({ onQualityChange }) {
  const [selectedQuality, setSelectedQuality] = useState('pose_analysis');
  const qualityOptions = CameraUtils.getQualityOptions();

  return (
    <select 
      value={selectedQuality} 
      onChange={(e) => {
        setSelectedQuality(e.target.value);
        onQualityChange(e.target.value);
      }}
    >
      {qualityOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label} - {option.fileSize}
        </option>
      ))}
    </select>
  );
}
```

## Advanced Integration Patterns

### 1. Exercise-Specific Configuration

```javascript
// Get requirements for different exercises
const squatRequirements = CameraUtils.getExerciseRequirements('squat');
// { minDuration: 10, recommendedAngle: 'side', requiredFraming: 'full_body' }

const deadliftRequirements = CameraUtils.getExerciseRequirements('deadlift');
// { minDuration: 8, recommendedAngle: 'side', requiredFraming: 'full_body' }
```

### 2. Device Capability Checking

```javascript
// Check device capabilities after initialization
const capabilities = await cameraService.getDetailedCameraCapabilities();

if (capabilities.recommendedConfiguration.qualityInfo.name === 'basic') {
  // Show message about limited device performance
  console.log('Device has limited performance, using basic quality');
}

// Check storage
if (capabilities.availableStorage < 100 * 1024 * 1024) { // 100MB
  alert('Low storage space detected. Consider freeing up space for better recording quality.');
}
```

### 3. Analytics and Monitoring

```javascript
// Get service analytics
const analytics = cameraService.getAnalytics();
console.log('Recording success rate:', analytics.successRate + '%');
console.log('Average file size:', CameraUtils.formatFileSize(analytics.averageFileSize));
console.log('Total recording time:', CameraUtils.formatDuration(analytics.totalRecordingTime));
```

### 4. Error Handling Patterns

```javascript
// Comprehensive error handling
const handleCameraError = (error) => {
  console.error('Camera error:', error);
  
  if (error.message.includes('permission')) {
    // Handle permission errors
    Alert.alert(
      'Camera Access Required',
      'Please enable camera access to record videos.',
      [{ text: 'Settings', onPress: () => Linking.openSettings() }]
    );
  } else if (error.message.includes('storage')) {
    // Handle storage errors
    Alert.alert('Storage Full', 'Please free up storage space to continue recording.');
  } else {
    // Generic error handling
    Alert.alert('Recording Error', 'An error occurred. Please try again.');
  }
};
```

## Permission Management

```javascript
// Check permissions before using camera
if (!cameraService.hasRequiredPermissions()) {
  const result = await cameraService.requestAllPermissions();
  
  if (!result.success) {
    console.log('Permissions not granted:', result.granted);
    // Handle permission denial
    return;
  }
}
```

## File Validation

```javascript
// Validate any video file
const validation = await cameraService.validateVideoFile(videoUri, {
  duration: 15,
  exercise: 'squat',
  fileSize: 25 * 1024 * 1024
});

if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}

// Show warnings to user
if (validation.warnings.length > 0) {
  console.warn('Validation warnings:', validation.warnings);
}

// Show recommendations
validation.recommendations.forEach(rec => {
  console.log('Recommendation:', rec);
});
```

## Utility Functions

```javascript
import { CameraUtils } from '../services/cameraService';

// Format file sizes for display
const fileSizeText = CameraUtils.formatFileSize(25 * 1024 * 1024);
// "25 MB"

// Format duration for display
const durationText = CameraUtils.formatDuration(125);
// "2:05"

// Check file size limits
const isAcceptable = CameraUtils.isFileSizeAcceptable(fileSize);

// Generate unique session IDs
const sessionId = CameraUtils.generateSessionId();
// "camera_1692818400000_xyz123abc"
```

## Constants Usage

```javascript
import { CAMERA_CONSTANTS } from '../services/cameraService';

// Video quality options
const qualityOptions = Object.values(CAMERA_CONSTANTS.VIDEO_QUALITY);
// ['pose_analysis', 'high_quality', 'balanced', 'basic', 'streaming']

// File constraints
const maxFileSize = CAMERA_CONSTANTS.MAX_FILE_SIZE; // 2GB
const maxDuration = CAMERA_CONSTANTS.MAX_DURATION;  // 120 seconds

// Exercise requirements
const exercises = Object.keys(CAMERA_CONSTANTS.EXERCISE_REQUIREMENTS);
// ['squat', 'deadlift', 'benchPress', 'pullUp', 'default']
```

## Best Practices

1. **Initialize Once**: Initialize the camera service once in your app's main component
2. **Check Permissions**: Always check permissions before camera operations
3. **Handle Errors**: Implement comprehensive error handling with user-friendly messages
4. **Validate Videos**: Always validate videos before processing for pose analysis
5. **Monitor Performance**: Use analytics to track and improve user experience
6. **Optimize Quality**: Use exercise-specific configurations for optimal pose analysis results
7. **Manage Storage**: Consider device storage constraints when selecting quality settings

## Integration Checklist

- [ ] Service initialized in app startup
- [ ] Permission handling implemented
- [ ] Exercise-specific configurations used
- [ ] Video validation implemented
- [ ] Error handling with user-friendly messages
- [ ] Quality selection based on device capabilities
- [ ] Analytics tracking enabled
- [ ] Cross-platform compatibility tested
- [ ] Storage constraint handling
- [ ] User guidance for optimal recording