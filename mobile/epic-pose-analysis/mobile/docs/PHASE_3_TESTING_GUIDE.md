# Phase 3: Cross-Device Testing - Execution Guide

## Overview

This guide provides step-by-step instructions for executing Phase 3 cross-device testing for the pose analysis feature. Phase 3 validates performance across device tiers and network conditions using Firebase Test Lab.

## Prerequisites

Before running Phase 3 tests, ensure you have:

- ✅ Google Cloud SDK installed and configured
- ✅ Firebase CLI installed (`npm install -g firebase-tools`)
- ✅ EAS CLI installed (`npm install -g eas-cli`)
- ✅ Firebase Test Lab API enabled for your project
- ✅ Test Lab results bucket created (`gs://strength-design-test-results`)
- ✅ Phase 2 complete with 91%+ code coverage

## Phase 3 Components

Phase 3 consists of 4 sub-phases:

1. **Phase 3.1**: Firebase Test Lab Setup ✅
2. **Phase 3.2**: Device Testing Matrix ✅
3. **Phase 3.3**: Performance Validation (this guide)
4. **Phase 3.4**: Network Condition Testing (this guide)

---

## Phase 3.3: Performance Validation

### Objective

Validate that pose analysis performance meets targets for each device tier (low/mid/high-end).

### Test Suite

**Location**: `mobile/__tests__/performance/deviceTierValidation.test.js`

**Coverage**:
- Processing time validation (10s, 30s, 60s videos)
- Memory usage validation
- Frame rate validation
- Battery consumption validation
- Concurrent analysis stress tests
- Device-specific optimization verification
- Performance regression detection

### Step 1: Run Local Performance Tests

Before running on Test Lab, validate performance locally:

```bash
# Run all performance tests
npm run test:performance

# Run with verbose output
npm run test:performance -- --verbose

# Run specific test
npm run test:performance -- --testNamePattern="processing time"
```

**Expected Output**:
```
Device Tier Performance Validation
  ✓ 10-second video meets processing time target (10s target, 12s acceptable)
  ✓ memory usage stays within tier limits during analysis
  ✓ frame processing rate meets tier target
  ✓ battery drain per analysis is acceptable
```

### Step 2: Build Test APKs

Build the application and test APKs for Firebase Test Lab:

```bash
# Build Android test APKs
npm run testlab:build:android

# This creates:
# - app-release.apk (main application)
# - app-debug-androidTest.apk (instrumentation tests)
```

**Note**: Building takes 10-15 minutes. Monitor progress in EAS dashboard.

### Step 3: Run Tests on Low-End Devices

Test on devices with ≤2GB RAM to validate degraded experience:

```bash
# Run on low-end device tier
npm run testlab:run:low
```

**Devices Tested**:
- Pixel (2016) - 4GB RAM, Snapdragon 821
- Galaxy J7 (2016) - 2GB RAM, Exynos 7870

**Performance Targets**:
- Processing time: ≤35s (target: 25s)
- Memory usage: <300MB
- Frame rate: ≥3 FPS (target: 6 FPS)
- Battery drain: <15% per analysis

### Step 4: Run Tests on Mid-Range Devices

Test on devices with 2-4GB RAM for balanced performance:

```bash
# Run on mid-range device tier
npm run testlab:run:mid
```

**Devices Tested**:
- Galaxy A10 (2019) - 2GB RAM, Exynos 7884
- Pixel 6 (2021) - 8GB RAM, Google Tensor

**Performance Targets**:
- Processing time: ≤20s (target: 15s)
- Memory usage: <500MB
- Frame rate: ≥8 FPS (target: 12 FPS)
- Battery drain: <12% per analysis

### Step 5: Run Tests on High-End Devices

Test on devices with >4GB RAM for premium experience:

```bash
# Run on high-end device tier
npm run testlab:run:high
```

**Devices Tested**:
- Pixel 3 (2018) - 4GB RAM, Snapdragon 845
- Pixel 5 (2020) - 8GB RAM, Snapdragon 765G
- Pixel 7 (2022) - 8GB RAM, Tensor G2

**Performance Targets**:
- Processing time: ≤12s (target: 10s)
- Memory usage: <800MB
- Frame rate: ≥15 FPS (target: 25 FPS)
- Battery drain: <10% per analysis

### Step 6: Analyze Performance Results

After tests complete, analyze the results:

```bash
# Download results from Test Lab
gsutil -m cp -r gs://strength-design-test-results/latest/ ./test-results/

# Analyze results
npm run testlab:analyze ./test-results
```

**Expected Output**:
```
📊 Test Outcomes Analysis
  sailfish (low): 15/15 (100%)
  a10 (mid): 15/15 (100%)
  redfin (high): 15/15 (100%)

⚡ Performance Metrics Analysis
  sailfish (low):
    Processing: 28000ms ⚠️
    Memory: 245MB ✅
    Frame Rate: 6 FPS ✅
    Battery: 6% ⚠️

  redfin (high):
    Processing: 9500ms ✅
    Memory: 520MB ✅
    Frame Rate: 28 FPS ✅
    Battery: 3% ✅

📋 Summary
  Total Tests: 45
  Passed: 45 (100%)
  Performance Issues: 2 (acceptable)
  Regressions: 0

✅ All tests passed with acceptable performance!
```

### Step 7: Update Performance Baselines

If performance meets or exceeds targets, update baselines:

```bash
# View current baselines
npm run benchmark

# Update baselines (if improvements confirmed)
npm run benchmark:compare ./test-results
```

### Acceptance Criteria

Phase 3.3 passes if:

- ✅ All device tiers have ≥95% test pass rate
- ✅ Processing times within acceptable range for all tiers
- ✅ Memory usage below alert thresholds
- ✅ Frame rates above minimum for all tiers
- ✅ No critical performance regressions (>20% degradation)
- ✅ Battery consumption acceptable for all tiers

---

## Phase 3.4: Network Condition Testing

### Objective

Validate pose analysis behavior under various network conditions (LTE, 3G, offline).

### Test Suite

**Location**: `mobile/__tests__/performance/networkConditionTests.test.js`

**Coverage**:
- LTE network (standard performance)
- 3G network (degraded performance)
- Slow 3G network (poor connectivity)
- Offline mode (queue and retry)
- Network transition handling
- Error recovery with exponential backoff

### Step 1: Run Local Network Tests

```bash
# Run all network condition tests
npm run test:network

# Run with verbose logging
npm run test:network -- --verbose
```

**Expected Output**:
```
Network Condition Testing
  LTE Network (Standard)
    ✓ video upload completes smoothly on LTE
    ✓ realtime updates occur frequently on LTE
    ✓ results sync immediately on LTE

  3G Network (Degraded)
    ✓ video upload uses chunked transfer on 3G
    ✓ progress updates are batched on 3G
    ✓ retry logic activates on 3G failures

  Offline Mode
    ✓ video upload is queued when offline
    ✓ local analysis continues when offline
    ✓ results are queued for sync when offline
```

### Step 2: Run Tests with Network Profiles

Firebase Test Lab supports network condition simulation:

```bash
# Test with LTE network profile
gcloud firebase test android run \
  --type instrumentation \
  --app ./build/app-release.apk \
  --test ./build/app-test.apk \
  --device model=redfin,version=30 \
  --network-profile LTE

# Test with 3G network profile
gcloud firebase test android run \
  --type instrumentation \
  --app ./build/app-release.apk \
  --test ./build/app-test.apk \
  --device model=redfin,version=30 \
  --network-profile 3G

# Test with offline profile
gcloud firebase test android run \
  --type instrumentation \
  --app ./build/app-release.apk \
  --test ./build/app-test.apk \
  --device model=redfin,version=30 \
  --network-profile offline
```

### Step 3: Validate Network Behaviors

**LTE Expectations**:
- Upload time: <10s per 10-second video
- Update frequency: Every 500ms
- Sync delay: <1s

**3G Expectations**:
- Upload time: 20-40s per 10-second video
- Update frequency: Every 2s (batched)
- Sync delay: 2-5s
- Chunked transfer enabled
- Retry on intermittent failures

**Slow 3G Expectations**:
- Upload time: 40-60s per 10-second video
- Update frequency: Every 5s (heavily batched)
- Sync delay: 5-10s
- Small chunk sizes
- Offline queue enabled

**Offline Expectations**:
- Upload queued for later
- Local analysis continues (if model cached)
- Results queued for sync
- UI shows offline indicator
- Queue processes when connection restored

### Step 4: Verify Offline Queue

Test the offline job queue functionality:

```bash
# Run offline mode test
npm run test:network -- --testNamePattern="Offline"
```

**Validation Points**:
- Jobs are queued when offline
- Jobs persist across app restarts
- Jobs process automatically when online
- Failed jobs retry with exponential backoff
- Queue handles multiple job types (upload, sync)

### Step 5: Test Network Transitions

Validate graceful handling of network changes:

```bash
# Run network transition tests
npm run test:network -- --testNamePattern="transition"
```

**Scenarios**:
1. LTE → Offline during upload
2. Offline → LTE (queue processing)
3. Slow 3G → LTE (resumed upload)
4. LTE → 3G (adapted batch size)

### Acceptance Criteria

Phase 3.4 passes if:

- ✅ LTE performance meets fast network expectations
- ✅ 3G gracefully degrades with chunking and batching
- ✅ Offline mode queues jobs without data loss
- ✅ Network transitions handled without crashes
- ✅ Retry logic works with exponential backoff
- ✅ User receives clear network status indicators
- ✅ No data corruption during network issues

---

## Complete Phase 3 Workflow

### Full Test Execution

Run all Phase 3 tests across all device tiers and network conditions:

```bash
# 1. Run all local performance and network tests
npm run test:performance
npm run test:network

# 2. Build test APKs
npm run testlab:build:android

# 3. Run on all devices with all network profiles
npm run testlab:run:all

# 4. Analyze results
npm run testlab:analyze ./test-results

# 5. Update baselines if performance improved
npm run benchmark:compare ./test-results
```

### Estimated Time

- **Local tests**: 30 minutes
- **Build APKs**: 15 minutes
- **Test Lab execution**: 45-60 minutes (parallelized)
- **Results analysis**: 15 minutes

**Total**: ~2 hours

---

## Troubleshooting

### Issue: Test Lab quota exceeded

**Error**: "Quota exceeded for test executions"

**Solution**:
```bash
# Check quota usage
gcloud firebase test android list --limit=50

# Request quota increase in Firebase Console
# Or wait for daily quota reset
```

### Issue: Device not available

**Error**: "Device model 'xyz' not found"

**Solution**:
```bash
# List currently available devices
gcloud firebase test android models list

# Use alternative device from same tier
# Refer to DEVICE_TESTING_MATRIX.md for tier mappings
```

### Issue: Tests timing out

**Error**: "Test exceeded timeout of 30m"

**Solution**:
Update `.testlabrc.yml`:
```yaml
timeout: 45m  # Increase from 30m
```

### Issue: Build fails

**Error**: "Build failed with exit code 1"

**Solution**:
```bash
# Check build logs
eas build:list

# Clear cache and rebuild
cd android
./gradlew clean
cd ..
npm run testlab:build:android
```

---

## Success Metrics

Phase 3 is successful when:

### Test Coverage
- ✅ All device tiers tested (low/mid/high)
- ✅ All network conditions tested (LTE/3G/offline)
- ✅ ≥95% test pass rate overall

### Performance
- ✅ Processing times within targets
- ✅ Memory usage below limits
- ✅ Frame rates above minimums
- ✅ Battery drain acceptable

### Reliability
- ✅ Zero crashes during testing
- ✅ Graceful degradation on poor networks
- ✅ Successful offline queue operation
- ✅ No data loss during network issues

### Regression
- ✅ No performance regressions >20%
- ✅ Baselines updated if improved
- ✅ Issues documented and tracked

---

## Next Steps

After Phase 3 completion:

1. **Phase 4**: Performance Validation (load/stress testing)
2. **Phase 5**: Security & Privacy Audit
3. **Phase 6**: User Acceptance Testing
4. **Phase 7**: Beta Launch
5. **Phase 8**: Production Deployment

---

**Document Version**: 1.0
**Last Updated**: November 6, 2025
**Status**: Phase 3 Testing Framework Complete
