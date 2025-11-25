# PerformanceMonitor Service

A comprehensive performance monitoring service for tracking latency and performance metrics across various operations in the mobile_flutter app.

## Overview

The PerformanceMonitor service provides:
- Real-time latency tracking for async operations
- Statistical analysis (min, max, average, percentiles)
- Automatic threshold warnings
- Thread-safe metric collection
- JSON export for external analysis
- Performance-based feature flagging support

## Quick Start

```dart
import 'package:mobile_flutter/src/core/services/performance_monitor.dart';

final monitor = PerformanceMonitor();

// Track an operation
final result = await monitor.trackLatency('my_operation', () async {
  return await someAsyncOperation();
});

// Get statistics
final stats = monitor.getStats('my_operation');
print('Average: ${stats['average']}ms');
print('P95: ${stats['p95']}ms');
```

## Predefined Operations

The service comes with predefined thresholds for key operations:

| Operation | Threshold | Purpose |
|-----------|-----------|---------|
| `local_pose_detection` | 33ms | Maintain 30fps for pose detection |
| `gemini_api_call` | 1000ms | AI coaching API response time |
| `frame_preprocessing` | 10ms | Frame preparation before ML processing |
| `rep_counting` | 5ms | Exercise rep counting logic |
| `form_analysis` | 10ms | Form quality analysis |

## Core Methods

### trackLatency()

Wraps an async operation and measures its execution time.

```dart
Future<T> trackLatency<T>(String operation, Future<T> Function() task)
```

**Features:**
- Returns the original result of the operation
- Automatically logs warnings when thresholds are exceeded
- Records latency even if the operation fails
- Thread-safe metric collection

**Example:**
```dart
final pose = await monitor.trackLatency('local_pose_detection', () async {
  return await poseDetector.processImage(frame);
});
```

### getStats()

Get comprehensive statistics for an operation.

```dart
Map<String, double>? getStats(String operation)
```

**Returns:**
```dart
{
  'min': 15.2,        // Minimum latency (ms)
  'max': 45.8,        // Maximum latency (ms)
  'average': 28.3,    // Average latency (ms)
  'p50': 27.1,        // Median (50th percentile)
  'p95': 42.0,        // 95th percentile
  'p99': 44.5,        // 99th percentile
  'count': 150.0,     // Number of measurements
}
```

### getAverageLatencies()

Get average latencies for all tracked operations.

```dart
Map<String, double> getAverageLatencies()
```

**Example:**
```dart
final averages = monitor.getAverageLatencies();
// {
//   'local_pose_detection': 28.3,
//   'gemini_api_call': 856.7,
//   'frame_preprocessing': 8.2,
// }
```

### getPercentile()

Calculate a specific percentile for an operation.

```dart
double? getPercentile(String operation, int percentile)
```

**Example:**
```dart
final p95 = monitor.getPercentile('local_pose_detection', 95);
final p99 = monitor.getPercentile('local_pose_detection', 99);
```

### exportMetrics()

Export all metrics as JSON for analysis.

```dart
String exportMetrics()
```

**Output format:**
```json
{
  "timestamp": "2025-11-12T20:30:00.000Z",
  "operations": {
    "local_pose_detection": {
      "measurements": [25.3, 28.1, 31.5, ...],
      "stats": {
        "min": 25.3,
        "max": 45.2,
        "average": 30.1,
        "p50": 29.8,
        "p95": 42.0,
        "p99": 43.8,
        "count": 150.0
      },
      "threshold": 33.0
    }
  }
}
```

### getSummaryReport()

Generate a human-readable performance summary.

```dart
String getSummaryReport()
```

**Output example:**
```
=== Performance Monitor Summary ===
Generated: 2025-11-12T20:30:00.000Z

local_pose_detection ✓ OK
  Average: 28.30ms (threshold: 33ms)
  Min: 25.30ms, Max: 45.20ms
  P95: 42.00ms, P99: 43.80ms
  Samples: 150

gemini_api_call ⚠️ SLOW
  Average: 1250.00ms (threshold: 1000ms)
  Min: 800.00ms, Max: 2100.00ms
  P95: 1980.00ms, P99: 2050.00ms
  Samples: 50
```

### reset()

Clear all collected metrics.

```dart
void reset()
```

## Integration Patterns

### 1. With Riverpod

```dart
import 'package:hooks_riverpod/hooks_riverpod.dart';

final performanceMonitorProvider = Provider<PerformanceMonitor>((ref) {
  final monitor = PerformanceMonitor();

  ref.onDispose(() {
    final metrics = monitor.exportMetrics();
    // Log or save metrics before disposal
  });

  return monitor;
});
```

### 2. Service Integration

```dart
class PoseDetectionService {
  final PerformanceMonitor _performanceMonitor;

  PoseDetectionService(this._performanceMonitor);

  Future<Pose> detectPose(Uint8List frame) async {
    return await _performanceMonitor.trackLatency('local_pose_detection', () async {
      // Actual pose detection logic
      return await _runPoseDetection(frame);
    });
  }
}
```

### 3. Nested Tracking

```dart
Future<void> processFrame(Uint8List frame) async {
  await monitor.trackLatency('full_pipeline', () async {
    // Track sub-operations
    final preprocessed = await monitor.trackLatency(
      'frame_preprocessing',
      () => preprocessFrame(frame),
    );

    final pose = await monitor.trackLatency(
      'local_pose_detection',
      () => detectPose(preprocessed),
    );

    await monitor.trackLatency(
      'form_analysis',
      () => analyzeForm(pose),
    );
  });
}
```

### 4. Performance-Based Feature Flags

```dart
class FeatureManager {
  final PerformanceMonitor _monitor;

  bool shouldUseLocalPoseDetection() {
    final stats = _monitor.getStats('local_pose_detection');
    if (stats == null) return true;

    // If P95 > 50ms, can't maintain 30fps
    return stats['p95']! <= 50;
  }

  int getOptimalFrameRate() {
    final stats = _monitor.getStats('local_pose_detection');
    if (stats == null) return 30;

    final avg = stats['average']!;
    if (avg < 20) return 30;
    if (avg < 50) return 15;
    return 10;
  }
}
```

### 5. Periodic Reporting

```dart
class PerformanceReporter {
  final PerformanceMonitor _monitor;
  Timer? _timer;

  void startReporting({Duration interval = const Duration(minutes: 5)}) {
    _timer = Timer.periodic(interval, (_) {
      final report = _monitor.getSummaryReport();
      debugPrint(report);

      // Send to analytics
      final metrics = _monitor.exportMetrics();
      analyticsService.logPerformanceMetrics(metrics);
    });
  }

  void stop() {
    _timer?.cancel();
  }
}
```

## Best Practices

### 1. Consistent Naming
Use consistent operation names throughout your app:
```dart
// Good
monitor.trackLatency('local_pose_detection', ...)
monitor.trackLatency('local_pose_detection', ...)

// Bad
monitor.trackLatency('pose_detection', ...)
monitor.trackLatency('local_pose', ...)
```

### 2. Granular Tracking
Track at the right level of granularity:
```dart
// Too broad - hard to identify bottlenecks
monitor.trackLatency('process_everything', () async {
  await step1();
  await step2();
  await step3();
});

// Good - track individual steps
await monitor.trackLatency('step1', step1);
await monitor.trackLatency('step2', step2);
await monitor.trackLatency('step3', step3);
```

### 3. Threshold Monitoring
Regularly check if operations exceed thresholds:
```dart
void checkPerformance() {
  final averages = monitor.getAverageLatencies();
  for (final entry in averages.entries) {
    if (entry.value > getThreshold(entry.key)) {
      logWarning('${entry.key} exceeding threshold');
    }
  }
}
```

### 4. Export Metrics
Periodically export metrics for offline analysis:
```dart
// On app background or after workout session
void onSessionEnd() {
  final metrics = monitor.exportMetrics();

  // Save locally
  await File('metrics.json').writeAsString(metrics);

  // Upload to analytics
  await analyticsService.upload(metrics);

  // Reset for next session
  monitor.reset();
}
```

### 5. Error Handling
The monitor tracks latency even for failed operations:
```dart
try {
  await monitor.trackLatency('risky_operation', () async {
    return await riskyOperation();
  });
} catch (e) {
  // Error is automatically logged with latency context
  // Additional handling here
}
```

## Performance Optimization Tips

### Target 30fps for Real-time Processing
```dart
// Each frame has 33ms budget for 30fps
const frameBudgetMs = 33.0;

final stats = monitor.getStats('local_pose_detection');
if (stats != null && stats['p95']! > frameBudgetMs) {
  // Optimization needed:
  // - Reduce resolution
  // - Skip frames
  // - Use faster model
}
```

### Adaptive Quality
```dart
void adjustQuality() {
  final p95 = monitor.getPercentile('local_pose_detection', 95);
  if (p95 == null) return;

  if (p95 > 50) {
    // Drop to lower quality/frame rate
    setFrameRate(15);
  } else if (p95 < 25) {
    // Can increase quality
    setFrameRate(30);
  }
}
```

### Identify Bottlenecks
```dart
void identifyBottlenecks() {
  final report = monitor.getSummaryReport();
  final averages = monitor.getAverageLatencies();

  // Find slowest operation
  final slowest = averages.entries
      .reduce((a, b) => a.value > b.value ? a : b);

  print('Bottleneck: ${slowest.key} (${slowest.value.toStringAsFixed(2)}ms)');
}
```

## Thread Safety

The PerformanceMonitor is designed to be thread-safe for Dart's async concurrency model:

```dart
// Multiple concurrent operations are safe
await Future.wait([
  monitor.trackLatency('op1', operation1),
  monitor.trackLatency('op2', operation2),
  monitor.trackLatency('op3', operation3),
]);
```

Note: For true multi-isolate scenarios, consider using `package:synchronized` for more robust locking.

## Testing

The service includes comprehensive tests. Run them with:

```bash
flutter test test/core/services/performance_monitor_test.dart
```

See `performance_monitor.example.dart` for detailed integration examples.

## Related Files

- **Implementation**: `lib/src/core/services/performance_monitor.dart`
- **Tests**: `test/core/services/performance_monitor_test.dart`
- **Examples**: `lib/src/core/services/performance_monitor.example.dart`

## References

Based on PRD section 3.5 (Performance Thresholds):
- Local pose detection: 33ms target (30fps)
- Gemini API calls: 1000ms threshold
- Frame preprocessing: 10ms target
- Rep counting: 5ms target
- Form analysis: 10ms target
