# Firebase Test Lab Testing Guide

## Overview

This guide covers automated cross-device testing using Firebase Test Lab for the Pose Analysis feature. Test Lab enables testing on real physical devices across various performance tiers and network conditions.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Device Testing Matrix](#device-testing-matrix)
3. [Setup Instructions](#setup-instructions)
4. [Running Tests](#running-tests)
5. [Performance Validation](#performance-validation)
6. [Network Testing](#network-testing)
7. [Analyzing Results](#analyzing-results)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

1. **Google Cloud SDK (gcloud)**
   ```bash
   # Install gcloud CLI
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   gcloud init
   ```

2. **Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

3. **EAS CLI** (for building test APKs/IPAs)
   ```bash
   npm install -g eas-cli
   eas login
   ```

### Firebase Project Setup

1. **Enable Test Lab API**
   ```bash
   gcloud services enable testing.googleapis.com --project=strength-design
   ```

2. **Create Results Bucket**
   ```bash
   gsutil mb -p strength-design gs://strength-design-test-results
   ```

3. **Set Default Project**
   ```bash
   gcloud config set project strength-design
   firebase use strength-design
   ```

---

## Device Testing Matrix

Our testing strategy covers three device performance tiers, ensuring the pose analysis feature works optimally across all user segments.

### Low-End Tier (≤2GB RAM)
**Target**: Validate degraded experience works smoothly with optimized settings

| Device | Model ID | Android Version | RAM | CPU |
|--------|----------|-----------------|-----|-----|
| Pixel (2016) | `sailfish` | 8.1 (API 27) | 4GB | Snapdragon 821 |
| Galaxy J7 (2016) | `j7xelte` | 7.0 (API 24) | 2GB | Exynos 7870 |

**Expected Performance**:
- Video processing: 20-30 seconds per 10-second video
- Frame rate: 5-7 FPS during analysis
- Memory usage: <300MB peak
- Adaptive sampling: High (skip 70-80% of frames)

### Mid-Range Tier (2-4GB RAM)
**Target**: Most common user segment - balanced performance

| Device | Model ID | Android Version | RAM | CPU |
|--------|----------|-----------------|-----|-----|
| Galaxy A10 (2019) | `a10` | 10 (API 29) | 2GB | Exynos 7884 |
| Pixel 6 (2021) | `oriole` | 12 (API 31) | 8GB | Google Tensor |

**Expected Performance**:
- Video processing: 12-18 seconds per 10-second video
- Frame rate: 10-15 FPS during analysis
- Memory usage: <500MB peak
- Adaptive sampling: Medium (skip 50-60% of frames)

### High-End Tier (>4GB RAM)
**Target**: Premium experience with full feature set

| Device | Model ID | Android Version | RAM | CPU |
|--------|----------|-----------------|-----|-----|
| Pixel 3 (2018) | `blueline` | 9 (API 28) | 4GB | Snapdragon 845 |
| Pixel 5 (2020) | `redfin` | 11 (API 30) | 8GB | Snapdragon 765G |
| Pixel 7 (2022) | `panther` | 13 (API 33) | 8GB | Google Tensor G2 |

**Expected Performance**:
- Video processing: 8-12 seconds per 10-second video
- Frame rate: 20-30 FPS during analysis
- Memory usage: <800MB peak
- Adaptive sampling: Low (skip 30-40% of frames)

### iOS Devices

| Device | Model ID | iOS Version | RAM |
|--------|----------|-------------|-----|
| iPhone 11 (2019) | `iphone11` | 14.7 | 4GB |
| iPhone 12 Pro (2020) | `iphone12pro` | 15.7 | 6GB |
| iPhone 13 (2021) | `iphone13` | 16.6 | 4GB |
| iPhone 14 Pro Max (2022) | `iphone14promax` | 17.0 | 6GB |

**Note**: iOS Test Lab requires Xcode Cloud integration.

---

## Setup Instructions

### 1. Build Test APKs

**For Android**:
```bash
# Navigate to mobile directory
cd mobile

# Build test APK using EAS
npm run testlab:build:android

# Alternatively, build locally (requires Android Studio)
cd android
./gradlew assembleRelease assembleAndroidTest
cd ..
```

The build creates two files:
- `app-release.apk` - Main application
- `app-debug-androidTest.apk` - Test instrumentation

### 2. Build Test IPA (iOS)

```bash
# Build iOS test package
npm run testlab:build:ios

# This creates ios-test.zip containing:
# - YourApp.ipa
# - YourAppUITests-Runner.app
```

### 3. Verify Build Artifacts

```bash
# Check Android builds
ls -lh build/*.apk

# Check iOS builds
ls -lh build/*.zip
```

---

## Running Tests

### Quick Start - All Devices

```bash
# Run on all devices in the matrix
npm run testlab:run:all
```

### Tier-Specific Testing

```bash
# Test low-end devices only
npm run testlab:run:low

# Test mid-range devices only
npm run testlab:run:mid

# Test high-end devices only
npm run testlab:run:high
```

### iOS Testing

```bash
# Run iOS tests
npm run testlab:run:ios
```

### Custom Device Selection

```bash
# Run on specific device
gcloud firebase test android run \
  --type instrumentation \
  --app ./build/app-release.apk \
  --test ./build/app-debug-androidTest.apk \
  --device model=redfin,version=30,locale=en_US,orientation=portrait
```

### Advanced Options

```bash
# Run with network throttling
gcloud firebase test android run \
  --type instrumentation \
  --app ./build/app-release.apk \
  --test ./build/app-debug-androidTest.apk \
  --device model=redfin,version=30 \
  --network-profile LTE \
  --timeout 30m

# Run with custom environment variables
gcloud firebase test android run \
  --type instrumentation \
  --app ./build/app-release.apk \
  --test ./build/app-debug-androidTest.apk \
  --device model=redfin,version=30 \
  --environment-variables TEST_USER=premium,ENABLE_ANALYTICS=false
```

---

## Performance Validation

### Performance Metrics to Track

Test Lab automatically collects these metrics:

1. **CPU Usage**
   - Target: <70% average during video analysis
   - Alert: >85% sustained usage

2. **Memory Usage**
   - Low-end: <300MB peak
   - Mid-range: <500MB peak
   - High-end: <800MB peak

3. **Network Usage**
   - Video upload: Chunked, resumable
   - Results download: <2MB per analysis
   - Background sync: <500KB per session

4. **Battery Drain**
   - Target: <5% per analysis session
   - Alert: >10% per session

5. **Frame Rate**
   - Low-end: 5-7 FPS (acceptable)
   - Mid-range: 10-15 FPS (good)
   - High-end: 20-30 FPS (excellent)

### Performance Test Scenarios

Create these test cases in your E2E tests:

**Scenario 1: Quick Analysis (10-second video)**
```javascript
// Target: Complete in <30 seconds on mid-tier device
await performPoseAnalysis('squat', '10s-video.mp4');
expect(analysisTime).toBeLessThan(30000);
```

**Scenario 2: Long Video (60-second)**
```javascript
// Target: Complete in <3 minutes on mid-tier device
await performPoseAnalysis('squat', '60s-video.mp4');
expect(analysisTime).toBeLessThan(180000);
```

**Scenario 3: Rapid Succession**
```javascript
// Target: 3 analyses in <2 minutes without crashes
for (let i = 0; i < 3; i++) {
  await performPoseAnalysis('squat', '10s-video.mp4');
}
expect(crashes).toBe(0);
```

**Scenario 4: Background Processing**
```javascript
// Target: Complete when app backgrounded
await startPoseAnalysis('squat', '60s-video.mp4');
await backgroundApp();
await waitFor(() => expect(analysisComplete).toBe(true), { timeout: 300000 });
```

---

## Network Testing

### Network Profiles

Test Lab supports these network conditions:

1. **LTE** - Standard mobile (default)
   - Download: 13 Mbps
   - Upload: 5 Mbps
   - Latency: 60ms

2. **3G** - Slower connection
   - Download: 1.6 Mbps
   - Upload: 768 Kbps
   - Latency: 150ms

3. **Offline** - No connectivity
   - Tests offline fallback behavior

### Network Test Scenarios

```bash
# Test with 3G network
gcloud firebase test android run \
  --type instrumentation \
  --app ./build/app-release.apk \
  --test ./build/app-debug-androidTest.apk \
  --device model=redfin,version=30 \
  --network-profile 3G

# Test offline behavior
gcloud firebase test android run \
  --type instrumentation \
  --app ./build/app-release.apk \
  --test ./build/app-debug-androidTest.apk \
  --device model=redfin,version=30 \
  --network-profile offline
```

### Expected Behavior by Network

**LTE**:
- Video upload: <10 seconds per 10-second clip
- Results sync: Immediate
- Progress updates: Real-time

**3G**:
- Video upload: 20-40 seconds per 10-second clip
- Results sync: 2-5 seconds delay
- Progress updates: Batched every 2 seconds

**Offline**:
- Video upload: Queued for retry
- Local analysis: Continues if model cached
- Results sync: Queued until online

---

## Analyzing Results

### Viewing Results in Console

1. **Navigate to Test Lab Console**
   ```bash
   # Open in browser
   open https://console.firebase.google.com/project/strength-design/testlab/histories
   ```

2. **Results Location**
   - Console: Firebase Console > Test Lab
   - Cloud Storage: `gs://strength-design-test-results/`
   - Local download: Use `gsutil` to download results

### Download Test Results

```bash
# List recent test runs
gcloud firebase test android list

# Download specific test results
gsutil -m cp -r gs://strength-design-test-results/2024-01-15_12-00-00/ ./test-results/

# View video recordings
open ./test-results/*/artifacts/video.mp4

# View logcat logs
cat ./test-results/*/artifacts/logcat.txt

# View screenshots
open ./test-results/*/artifacts/screenshots/
```

### Key Metrics to Review

1. **Test Pass Rate**
   - Target: >95% across all devices
   - Alert: <90% on any device tier

2. **Crash Rate**
   - Target: 0% during testing
   - Alert: Any crashes

3. **Performance Degradation**
   - Compare low-end vs high-end metrics
   - Verify adaptive sampling working correctly

4. **UI Rendering**
   - Check screenshots for layout issues
   - Verify animations smooth on all tiers

### Automated Results Analysis

Create a script to parse results:

```bash
#!/bin/bash
# analyze-testlab-results.sh

RESULTS_DIR=$1

# Count test outcomes
PASSED=$(grep -r "PASSED" $RESULTS_DIR | wc -l)
FAILED=$(grep -r "FAILED" $RESULTS_DIR | wc -l)
SKIPPED=$(grep -r "SKIPPED" $RESULTS_DIR | wc -l)

# Extract performance metrics
AVG_CPU=$(grep "CPU usage" $RESULTS_DIR/*/artifacts/logcat.txt | awk '{sum+=$3; count++} END {print sum/count}')
PEAK_MEMORY=$(grep "Memory" $RESULTS_DIR/*/artifacts/logcat.txt | sort -n | tail -1)

# Generate report
echo "Test Results Summary"
echo "===================="
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "Skipped: $SKIPPED"
echo "Average CPU: $AVG_CPU%"
echo "Peak Memory: $PEAK_MEMORY MB"
```

---

## Troubleshooting

### Common Issues

**1. Build Fails**
```bash
# Error: "Could not find com.android.tools.build:gradle"
# Solution: Update Android Gradle Plugin
cd android
./gradlew wrapper --gradle-version=8.0
```

**2. Test Timeout**
```bash
# Error: "Test exceeded timeout of 30m"
# Solution: Increase timeout in .testlabrc.yml
timeout: 45m
```

**3. Device Not Available**
```bash
# Error: "Device model 'xyz' not found"
# Solution: List available devices
gcloud firebase test android models list
gcloud firebase test ios models list
```

**4. Insufficient Quota**
```bash
# Error: "Quota exceeded for test executions"
# Solution: Check quota usage
gcloud firebase test android list --limit=50
# Request quota increase in Firebase Console
```

**5. Upload Fails**
```bash
# Error: "Failed to upload APK"
# Solution: Check file size (max 4GB) and network
ls -lh build/*.apk
# Compress if needed
zip -9 app-compressed.zip build/*.apk
```

### Debug Mode

Run tests with verbose logging:

```bash
gcloud firebase test android run \
  --type instrumentation \
  --app ./build/app-release.apk \
  --test ./build/app-debug-androidTest.apk \
  --device model=redfin,version=30 \
  --verbosity=debug \
  --log-http
```

### Local Emulator Testing

Before running on Test Lab, test locally:

```bash
# Start Android emulator
emulator -avd Pixel_5_API_30 -memory 2048

# Run tests on emulator
npm run test:e2e

# Monitor performance
adb shell dumpsys meminfo com.strengthdesign.app
adb shell top | grep strengthdesign
```

---

## Best Practices

### 1. Regular Testing Schedule

- **Daily**: Run on 1 device from each tier (quick validation)
- **Weekly**: Full device matrix with all network profiles
- **Pre-release**: Comprehensive testing on all devices + stress tests

### 2. Progressive Rollout

1. Start with high-end devices (fastest feedback)
2. Expand to mid-range (largest user base)
3. Validate on low-end (critical for inclusive experience)

### 3. Test Prioritization

**P0 (Critical)**: Must pass on all devices
- Video upload and analysis
- Results display
- Navigation flows

**P1 (High)**: Must pass on mid/high-tier
- Progress tracking
- Achievement unlocking
- Export functionality

**P2 (Medium)**: Nice-to-have on all
- Animations
- Haptic feedback
- Social sharing

### 4. Cost Optimization

- Use `--num-uniform-shards=3` to parallelize tests
- Test on emulators first, then physical devices
- Archive old test results after 30 days
- Use Test Lab free tier quota efficiently

---

## Resources

- [Firebase Test Lab Documentation](https://firebase.google.com/docs/test-lab)
- [gcloud CLI Reference](https://cloud.google.com/sdk/gcloud/reference/firebase/test/android)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)

---

**Last Updated**: November 6, 2025
**Maintainer**: Development Team
**Status**: Active - Phase 3 Implementation
