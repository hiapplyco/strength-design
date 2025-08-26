# Pose Analysis Setup Guide

## Overview

This guide provides comprehensive instructions for setting up and using the pose analysis feature in the Strength.Design mobile app. The implementation uses Google ML Kit's Pose Detection API for real-time form analysis of exercises and sports movements.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Platform-Specific Setup](#platform-specific-setup)
4. [Configuration](#configuration)
5. [Development Setup](#development-setup)
6. [Testing](#testing)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)
9. [Performance Optimization](#performance-optimization)
10. [API Reference](#api-reference)

## Prerequisites

### System Requirements

- **iOS**: iOS 14.0+ (Xcode 14+, iOS Simulator)
- **Android**: Android API level 21+ (Android Studio, Android emulator)
- **Node.js**: 18.0+ 
- **React Native**: 0.72+
- **Expo**: SDK 49+

### Required Accounts

- Firebase project with Blaze plan (for Cloud Functions)
- Apple Developer Account (for iOS deployment)
- Google Play Console Account (for Android deployment)

## Installation

### 1. Install Dependencies

The following dependencies have been added to support pose analysis:

```bash
# Core ML Kit dependency
@react-native-ml-kit/pose-detection: ^2.0.0

# Video processing dependencies
expo-av: ~15.1.7
expo-video-thumbnails: ~8.1.7
react-native-video: ^6.6.2
expo-image-manipulator: ~12.1.7

# File system dependencies
react-native-fs: ^2.20.0
expo-file-system: ~18.1.11

# Animation dependencies
react-native-reanimated: ~3.15.4
```

### 2. Install All Dependencies

```bash
cd mobile
npm install

# For iOS
cd ios && pod install && cd ..

# For Android (if using bare workflow)
cd android && ./gradlew clean && cd ..
```

## Platform-Specific Setup

### iOS Setup

#### 1. Update iOS Deployment Target

Ensure your iOS deployment target is set to 14.0 or higher:

```ruby
# ios/Podfile
platform :ios, '14.0'
```

#### 2. Add Privacy Usage Descriptions

Add the following to `ios/StrengthDesign/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app uses the camera to record exercise videos for form analysis.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app accesses your photo library to analyze exercise videos.</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app may record audio with exercise videos for complete analysis.</string>
```

#### 3. Enable ML Kit in Podfile

Add ML Kit dependencies to `ios/Podfile`:

```ruby
# Add after other pods
pod 'GoogleMLKit/PoseDetection', '~> 4.0.0'
```

#### 4. Build Configuration

Update `ios/StrengthDesign/Info.plist` for performance:

```xml
<key>UIFileSharingEnabled</key>
<true/>
<key>LSSupportsOpeningDocumentsInPlace</key>
<true/>
```

### Android Setup

#### 1. Update Minimum SDK Version

Update `android/build.gradle`:

```gradle
buildscript {
    ext {
        minSdkVersion = 21
        compileSdkVersion = 34
        targetSdkVersion = 34
    }
}
```

#### 2. Add Permissions

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- ML Kit requirements -->
<uses-feature
    android:name="android.hardware.camera"
    android:required="false" />
<uses-feature
    android:name="android.hardware.camera.autofocus"
    android:required="false" />
```

#### 3. Add ML Kit Dependencies

Update `android/app/build.gradle`:

```gradle
dependencies {
    implementation 'com.google.mlkit:pose-detection:18.0.0-beta3'
    implementation 'com.google.mlkit:pose-detection-accurate:18.0.0-beta3'
    
    // Optional: For better performance
    implementation 'com.google.android.gms:play-services-mlkit-pose-detection:16.0.0-beta1'
}
```

#### 4. ProGuard Configuration

Add to `android/app/proguard-rules.pro`:

```proguard
# ML Kit
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.internal.** { *; }
-dontwarn com.google.mlkit.**
```

## Configuration

### Environment Variables

Create or update `.env` files:

```bash
# .env.local (for development)
EXPO_PUBLIC_POSE_ANALYSIS_ENABLED=true
EXPO_PUBLIC_POSE_DEBUG_MODE=true
EXPO_PUBLIC_MAX_VIDEO_DURATION=30
EXPO_PUBLIC_MAX_FILE_SIZE=50000000

# Firebase configuration (already exists)
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

### Firebase Functions Configuration

Set required environment variables for Firebase Functions:

```bash
# Set ML Kit configuration
firebase functions:config:set mlkit.api_key="your-mlkit-api-key"
firebase functions:config:set pose.max_video_duration=30
firebase functions:config:set pose.max_file_size=50000000
```

### App Configuration

Update `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow Strength.Design to record exercise videos for form analysis."
        }
      ],
      [
        "expo-media-library",
        {
          "photosPermission": "Allow Strength.Design to save and analyze exercise videos.",
          "savePhotosPermission": "Allow Strength.Design to save analyzed exercise videos."
        }
      ]
    ]
  }
}
```

## Development Setup

### 1. Start Development Server

```bash
# Start Expo development server
npm run web

# Or for specific platforms
npm run ios
npm run android
```

### 2. Firebase Emulator Setup

```bash
# Start Firebase emulators for local development
firebase emulators:start --project demo-strength-design
```

### 3. Development Mode Features

In development mode, the pose analysis includes:

- Mock pose detection data for testing
- Extended logging and debugging
- Simulation of video processing
- Performance metrics display

### 4. Debug Configuration

Enable debug mode in the app:

```typescript
// In your app configuration
const POSE_DEBUG_CONFIG = {
  enableMockData: __DEV__,
  showPerformanceMetrics: __DEV__,
  logAnalysisSteps: __DEV__,
  visualizeDetectedPose: __DEV__
};
```

## Testing

### Unit Tests

Run pose analysis unit tests:

```bash
# Run all tests
npm test

# Run pose-specific tests
npm test -- --testPathPattern=pose
```

### Integration Tests

Test the complete pose analysis flow:

```bash
# Test with mock video data
npm run test:pose-integration

# Test with real device camera
npm run test:pose-e2e
```

### Manual Testing Checklist

- [ ] Video upload functionality
- [ ] Camera recording integration
- [ ] Pose detection accuracy
- [ ] Analysis result display
- [ ] Error handling and recovery
- [ ] Performance on target devices
- [ ] Network connectivity handling
- [ ] Offline functionality

### Performance Testing

```bash
# Monitor performance during development
npm run analyze-bundle
npm run test:performance
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] All dependencies installed and compatible
- [ ] Platform-specific configurations complete
- [ ] Environment variables set for production
- [ ] Firebase Functions deployed with ML dependencies
- [ ] App permissions configured correctly
- [ ] Performance optimization applied
- [ ] Error tracking (Sentry) configured
- [ ] Analytics events implemented

### iOS Deployment

1. **Build Configuration**
   ```bash
   # Build for iOS
   eas build --platform ios --profile production
   ```

2. **App Store Requirements**
   - Privacy policy updated with camera/photo usage
   - App Store description mentions pose analysis
   - Screenshots showing pose analysis features

### Android Deployment

1. **Build Configuration**
   ```bash
   # Build for Android
   eas build --platform android --profile production
   ```

2. **Google Play Requirements**
   - Camera permission justification provided
   - Feature description in Play Console
   - Target Android API level compliance

### Firebase Functions Deployment

Update and deploy Firebase Functions with ML dependencies:

```bash
cd functions
npm install

# Deploy functions
firebase deploy --only functions
```

## Troubleshooting

### Common Issues and Solutions

#### 1. ML Kit Installation Issues

**Problem**: ML Kit not installing correctly on iOS
```bash
# Solution
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
```

**Problem**: Android build failing with ML Kit
```bash
# Solution
cd android
./gradlew clean
./gradlew build
```

#### 2. Pose Detection Issues

**Problem**: No poses detected in video
- Check video quality and lighting
- Ensure person is clearly visible
- Verify minimum video duration (3 seconds)
- Check camera permissions

**Problem**: Low accuracy results
- Improve lighting conditions
- Use stable camera mounting
- Ensure full body is visible
- Check video resolution settings

#### 3. Performance Issues

**Problem**: App crashes during video processing
- Reduce video quality settings
- Implement memory management
- Use background processing
- Add error boundaries

**Problem**: Slow analysis processing
- Optimize frame extraction rate
- Use performance configuration
- Enable hardware acceleration
- Implement caching strategies

#### 4. Platform-Specific Issues

**iOS Specific:**
- Check iOS deployment target (14.0+)
- Verify Podfile ML Kit integration
- Update Xcode to latest version
- Check device compatibility

**Android Specific:**
- Verify minimum SDK version (21+)
- Check ProGuard configuration
- Update Android SDK tools
- Test on various Android versions

### Debug Commands

```bash
# Clear all caches
npm run clean

# Reset Metro bundler
npx metro --reset-cache

# Clean iOS build
cd ios && xcodebuild clean && cd ..

# Clean Android build
cd android && ./gradlew clean && cd ..

# Restart development environment
npm run restart
```

### Logging and Monitoring

Enable comprehensive logging:

```typescript
// In production, integrate with crash reporting
import crashlytics from '@react-native-firebase/crashlytics';

const logPoseAnalysisError = (error: Error, context: any) => {
  if (__DEV__) {
    console.error('Pose Analysis Error:', error, context);
  } else {
    crashlytics().recordError(error);
  }
};
```

## Performance Optimization

### Video Processing Optimization

```typescript
const PERFORMANCE_CONFIG = {
  // Process every 2nd frame for better performance
  frameSkip: 2,
  
  // Reduce video quality for faster processing
  videoQuality: 'medium',
  
  // Limit video duration
  maxDuration: 30, // seconds
  
  // Batch processing
  batchSize: 10,
  
  // Background processing
  useWorkerThread: true
};
```

### Memory Management

```typescript
// Implement proper cleanup
useEffect(() => {
  return () => {
    // Cleanup pose analysis resources
    poseAnalysisService.destroy();
  };
}, []);
```

### Caching Strategy

```typescript
// Cache analysis results
const CACHE_CONFIG = {
  maxCacheSize: 50, // Number of cached analyses
  cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
  compressionEnabled: true
};
```

## API Reference

### PoseAnalysisService

```typescript
import poseAnalysisService from './services/poseDetection/PoseAnalysisService';

// Initialize service
await poseAnalysisService.initialize();

// Analyze video
const result = await poseAnalysisService.analyzeVideoFile(
  videoUri,
  ExerciseType.SQUAT,
  {
    frameExtractionOptions: {
      frameRate: 15,
      quality: 'medium'
    },
    saveToHistory: true
  }
);

// Get analysis history
const history = await poseAnalysisService.getAnalysisHistory(20);
```

### Exercise Types

```typescript
enum ExerciseType {
  SQUAT = 'squat',
  DEADLIFT = 'deadlift',
  PUSH_UP = 'pushup',
  BENCH_PRESS = 'bench_press',
  OVERHEAD_PRESS = 'overhead_press'
}

enum SportType {
  BASEBALL_PITCH = 'baseball_pitch',
  TENNIS_SERVE = 'tennis_serve',
  GOLF_SWING = 'golf_swing',
  BASKETBALL_SHOT = 'basketball_shot'
}
```

### Configuration Options

```typescript
interface PoseDetectionConfig {
  mode: 'fast' | 'accurate';
  detectAllPoses: boolean;
  enableTracking: boolean;
  confidenceThreshold: number;
  frameSkip: number;
  batchSize: number;
  useWorkerThread: boolean;
}
```

## Support and Resources

### Documentation
- [Google ML Kit Pose Detection](https://developers.google.com/ml-kit/vision/pose-detection)
- [React Native ML Kit](https://github.com/react-native-ml-kit/react-native-ml-kit)
- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)

### Community
- GitHub Issues: Report bugs and feature requests
- Discord: Real-time development support
- Stack Overflow: Technical questions with `strength-design` tag

### Professional Support
For enterprise support and custom implementations, contact the development team.

---

**Note**: This setup guide is specifically for the Strength.Design pose analysis implementation. For general ML Kit setup, refer to the official Google ML Kit documentation.