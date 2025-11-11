# Device Testing Matrix - Pose Analysis Feature

## Overview

This document defines the comprehensive device testing strategy for the pose analysis feature, ensuring optimal performance across all device tiers and user segments.

---

## Testing Philosophy

**Inclusive Performance**: Every user, regardless of device, should have a functional and satisfying pose analysis experience. We achieve this through:

1. **Adaptive Processing**: Automatically adjust analysis quality based on device capabilities
2. **Tiered Expectations**: Define different performance targets per device tier
3. **Graceful Degradation**: Maintain core functionality even on lowest-end devices
4. **Progressive Enhancement**: Unlock premium features on capable devices

---

## Device Tier Classification

### Classification Criteria

Devices are automatically classified into tiers based on:

| Criteria | Low-End | Mid-Range | High-End |
|----------|---------|-----------|----------|
| RAM | ≤2GB | 2-4GB | >4GB |
| CPU Cores | ≤4 | 4-6 | >6 |
| GPU | Mali-T720 or lower | Adreno 506-618 | Adreno 620+ |
| Release Year | <2018 | 2018-2020 | >2020 |

### Auto-Detection Logic

```javascript
// mobile/services/performanceMonitor.js
const classifyDeviceTier = () => {
  const totalMemory = Device.totalMemory;
  const cpuArchitecture = Device.supportedCpuArchitectures;

  if (totalMemory <= 2147483648) { // 2GB
    return 'low';
  } else if (totalMemory <= 4294967296) { // 4GB
    return 'mid';
  } else {
    return 'high';
  }
};
```

---

## Test Coverage Matrix

### Android Devices

#### Low-End Tier

| Device | Model ID | OS | RAM | CPU | Screen | Priority |
|--------|----------|-------|-----|-----|--------|----------|
| Pixel (2016) | `sailfish` | 8.1 | 4GB | Snapdragon 821 | 1080p | P0 |
| Galaxy J7 (2016) | `j7xelte` | 7.0 | 2GB | Exynos 7870 | 720p | P0 |
| Moto G4 (2016) | `athene` | 7.0 | 2GB | Snapdragon 617 | 1080p | P1 |
| Nexus 5 (2013) | `hammerhead` | 6.0 | 2GB | Snapdragon 800 | 1080p | P2 |

**Test Focus**:
- ✅ Video analysis completes without crashes
- ✅ UI remains responsive during processing
- ✅ Memory usage stays under 300MB
- ✅ Battery drain acceptable (<10% per session)
- ✅ Adaptive sampling active (skip 70-80% frames)

#### Mid-Range Tier

| Device | Model ID | OS | RAM | CPU | Screen | Priority |
|--------|----------|-------|-----|-----|--------|----------|
| Galaxy A10 (2019) | `a10` | 10 | 2GB | Exynos 7884 | 720p | P0 |
| Pixel 6 (2021) | `oriole` | 12 | 8GB | Google Tensor | 1080p | P0 |
| Galaxy A52 (2021) | `a52xq` | 11 | 6GB | Snapdragon 720G | 1080p | P1 |
| Moto G Power (2021) | `sofia` | 10 | 4GB | Snapdragon 662 | 720p | P1 |

**Test Focus**:
- ✅ Balanced performance and quality
- ✅ Progress tracking smooth
- ✅ Charts and animations at 60fps
- ✅ Memory usage under 500MB
- ✅ Adaptive sampling moderate (skip 50-60% frames)

#### High-End Tier

| Device | Model ID | OS | RAM | CPU | Screen | Priority |
|--------|----------|-------|-----|-----|--------|----------|
| Pixel 3 (2018) | `blueline` | 9 | 4GB | Snapdragon 845 | 1080p | P0 |
| Pixel 5 (2020) | `redfin` | 11 | 8GB | Snapdragon 765G | 1080p | P0 |
| Pixel 7 (2022) | `panther` | 13 | 8GB | Tensor G2 | 1080p | P0 |
| Galaxy S22 (2022) | `dm1q` | 12 | 8GB | Snapdragon 8 Gen 1 | 1080p | P1 |

**Test Focus**:
- ✅ Premium experience with all features
- ✅ Fastest analysis times
- ✅ Highest quality feedback
- ✅ Memory usage under 800MB
- ✅ Minimal adaptive sampling (skip 30-40% frames)

### iOS Devices

| Device | Model ID | iOS | RAM | CPU | Screen | Priority |
|--------|----------|-----|-----|-----|--------|----------|
| iPhone 11 (2019) | `iphone11` | 14.7 | 4GB | A13 Bionic | 828p | P0 |
| iPhone 12 Pro (2020) | `iphone12pro` | 15.7 | 6GB | A14 Bionic | 1170p | P0 |
| iPhone 13 (2021) | `iphone13` | 16.6 | 4GB | A15 Bionic | 1170p | P0 |
| iPhone 14 Pro Max (2022) | `iphone14promax` | 17.0 | 6GB | A16 Bionic | 1290p | P1 |

**Test Focus**:
- ✅ Cross-platform consistency
- ✅ iOS-specific permissions (Camera, Photos, Motion)
- ✅ Background processing with iOS restrictions
- ✅ iCloud sync integration

---

## Performance Targets by Tier

### Processing Time Benchmarks

**10-Second Video Analysis**:

| Tier | Target | Acceptable | Alert |
|------|--------|------------|-------|
| Low-End | 25s | 35s | >45s |
| Mid-Range | 15s | 20s | >25s |
| High-End | 10s | 12s | >15s |

**60-Second Video Analysis**:

| Tier | Target | Acceptable | Alert |
|------|--------|------------|-------|
| Low-End | 2m 30s | 3m 30s | >4m 30s |
| Mid-Range | 1m 30s | 2m | >2m 30s |
| High-End | 1m | 1m 15s | >1m 30s |

### Memory Usage Targets

| Tier | Baseline | Peak (Analysis) | Alert |
|------|----------|----------------|-------|
| Low-End | 80MB | 250MB | >300MB |
| Mid-Range | 120MB | 400MB | >500MB |
| High-End | 180MB | 600MB | >800MB |

### Frame Processing Rates

| Tier | Target FPS | Min FPS | Frames Analyzed |
|------|-----------|---------|-----------------|
| Low-End | 5-7 | 3 | 20-30% |
| Mid-Range | 10-15 | 8 | 40-50% |
| High-End | 20-30 | 15 | 60-70% |

### Battery Consumption

| Tier | Per Analysis | Per Hour | Alert |
|------|-------------|----------|-------|
| Low-End | 5% | 12% | >15% |
| Mid-Range | 4% | 10% | >12% |
| High-End | 3% | 8% | >10% |

---

## Test Scenarios by Feature

### Core Functionality Tests

#### Scenario 1: Video Upload & Analysis
**Priority**: P0 (Must work on ALL devices)

| Step | Expected Behavior | Low-End | Mid-Range | High-End |
|------|-------------------|---------|-----------|----------|
| 1. Open upload screen | UI renders | ≤2s | ≤1s | ≤0.5s |
| 2. Select exercise type | Responsive tap | ≤500ms | ≤300ms | ≤200ms |
| 3. Upload 10s video | Upload complete | ≤15s (3G) | ≤10s (LTE) | ≤8s (LTE) |
| 4. Start analysis | Processing starts | Immediate | Immediate | Immediate |
| 5. Show progress | Updates every 2s | ✓ | Updates every 1s | Updates every 500ms |
| 6. Complete analysis | Results shown | 25s total | 15s total | 10s total |

**Validation**:
```javascript
test('Video upload and analysis completes on all tiers', async () => {
  const deviceTier = await getDeviceTier();
  const maxTime = deviceTier === 'low' ? 35000 : deviceTier === 'mid' ? 20000 : 12000;

  const startTime = Date.now();
  await uploadAndAnalyzeVideo('squat', '10s-video.mp4');
  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(maxTime);
  expect(analysisResult).toBeDefined();
  expect(analysisResult.score).toBeGreaterThan(0);
});
```

#### Scenario 2: Results Display
**Priority**: P0

| Feature | Low-End | Mid-Range | High-End |
|---------|---------|-----------|----------|
| Score rendering | Static | Animated (30fps) | Animated (60fps) |
| Feedback cards | Scrollable list | Smooth scroll | Smooth scroll + transitions |
| Video playback | 480p @ 15fps | 720p @ 30fps | 1080p @ 60fps |
| Overlay rendering | Frame-by-frame | Frame-by-frame | Real-time |

#### Scenario 3: Progress Tracking
**Priority**: P1

| Feature | Low-End | Mid-Range | High-End |
|---------|---------|-----------|----------|
| Charts rendering | Basic line chart | Line + bar charts | All chart types + animations |
| Data loading | 3-5s | 2-3s | <2s |
| Chart interactions | Basic tap | Tap + zoom | Full gestures (tap/zoom/pan) |
| Achievement animations | Minimal | Standard | Rich animations + haptics |

---

## Network Condition Testing

### Network Profiles

| Profile | Download | Upload | Latency | Packet Loss |
|---------|----------|--------|---------|-------------|
| LTE | 13 Mbps | 5 Mbps | 60ms | 0% |
| 3G | 1.6 Mbps | 768 Kbps | 150ms | 0% |
| Slow 3G | 400 Kbps | 400 Kbps | 400ms | 0% |
| Offline | 0 | 0 | N/A | 100% |

### Expected Behavior by Network

#### LTE (Standard)
- Video upload: Smooth progress bar
- Realtime updates: Every 500ms
- Sync delay: <1s

#### 3G (Degraded)
- Video upload: Chunked with retry
- Realtime updates: Every 2s
- Sync delay: 2-5s

#### Slow 3G (Poor)
- Video upload: Extended time, chunked
- Realtime updates: Every 5s
- Sync delay: 5-10s
- Offline queue: Enabled

#### Offline
- Video upload: Queued for later
- Analysis: Local model if cached
- Sync: Queued until online
- UI: Offline indicator shown

---

## Test Execution Strategy

### Phase 3.1: Setup ✅ **COMPLETE**
- [x] Firebase Test Lab configured
- [x] Device matrix defined
- [x] Build profiles created
- [x] Documentation written

### Phase 3.2: Device Matrix Validation
**Duration**: 2 hours
**Tasks**:
- [ ] Run tests on all low-end devices
- [ ] Run tests on all mid-range devices
- [ ] Run tests on all high-end devices
- [ ] Validate tier classification accuracy
- [ ] Document device-specific issues

### Phase 3.3: Performance Validation
**Duration**: 1 hour
**Tasks**:
- [ ] Measure processing times per tier
- [ ] Monitor memory usage patterns
- [ ] Track battery consumption
- [ ] Verify adaptive sampling working
- [ ] Compare against targets

### Phase 3.4: Network Condition Testing
**Duration**: 1 hour
**Tasks**:
- [ ] Test on LTE network
- [ ] Test on 3G network
- [ ] Test on Slow 3G network
- [ ] Test offline behavior
- [ ] Verify retry logic

---

## Success Criteria

### Must Have (All Devices)
- ✅ Zero crashes during normal usage
- ✅ Video analysis completes successfully
- ✅ Results display correctly
- ✅ Memory stays within tier limits
- ✅ UI remains responsive throughout

### Should Have (Mid/High Tiers)
- ✅ Processing times meet targets
- ✅ Charts render smoothly
- ✅ Animations at 30+ FPS
- ✅ Background processing works
- ✅ Offline queue functions

### Nice to Have (High Tier Only)
- ✅ 60 FPS animations
- ✅ Real-time overlay rendering
- ✅ Advanced chart interactions
- ✅ Haptic feedback
- ✅ Rich notifications

---

## Monitoring and Alerts

### Automated Alerts

Set up alerts for:

1. **Crash Rate**: >0.1% on any device
2. **Processing Time**: Exceeds tier alert threshold
3. **Memory Usage**: Exceeds tier maximum
4. **Battery Drain**: Exceeds tier alert threshold
5. **Test Failure Rate**: >5% on any device tier

### Dashboard Metrics

Track in Firebase Console:

- Test pass rate by device tier
- Average processing time by tier
- Memory usage distribution
- Battery consumption trends
- Network failure rates

---

## Troubleshooting Guide

### Common Issues by Device Tier

#### Low-End Devices

**Issue**: Out of memory crashes
**Solution**:
- Reduce frame sampling rate
- Clear cache more aggressively
- Process in smaller chunks

**Issue**: Processing timeout
**Solution**:
- Increase timeout limits
- Skip quality enhancement steps
- Use lower resolution frames

#### Mid-Range Devices

**Issue**: Inconsistent performance
**Solution**:
- Better tier boundary detection
- Dynamic adjustment of sampling
- Monitor background apps

#### High-End Devices

**Issue**: Underutilized resources
**Solution**:
- Increase processing quality
- Enable advanced features
- Parallel frame processing

---

## Continuous Improvement

### Weekly Reviews
- Analyze test results from past week
- Identify trending issues
- Update device matrix as needed
- Adjust performance targets

### Monthly Updates
- Add newly released devices
- Retire obsolete device models
- Refine tier classification
- Update documentation

### Quarterly Assessments
- Full device matrix review
- Performance target reassessment
- User feedback integration
- Strategy refinement

---

**Last Updated**: November 6, 2025
**Next Review**: December 6, 2025
**Status**: Phase 3 Implementation
