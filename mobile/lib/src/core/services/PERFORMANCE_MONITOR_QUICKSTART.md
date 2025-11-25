# PerformanceMonitor Quick Start Guide

## Installation (Already Done)

The PerformanceMonitor is already integrated in the app via Riverpod:

```dart
// Available in: lib/src/core/providers/service_providers.dart
final performanceMonitorProvider = Provider((ref) => PerformanceMonitor());
```

## Basic Usage

### 1. Track a Simple Operation

```dart
import 'package:hooks_riverpod/hooks_riverpod.dart';

class MyService extends ConsumerWidget {
  Future<void> doSomething(WidgetRef ref) async {
    final monitor = ref.read(performanceMonitorProvider);

    await monitor.trackLatency('my_operation', () async {
      // Your async code here
      await someAsyncTask();
    });
  }
}
```

### 2. Track and Use Result

```dart
final result = await monitor.trackLatency('data_fetch', () async {
  return await api.fetchData();
});
// Use result here - it's returned from trackLatency()
```

### 3. Get Performance Stats

```dart
// Get detailed stats for an operation
final stats = monitor.getStats('local_pose_detection');
if (stats != null) {
  print('Average: ${stats['average']?.toStringAsFixed(2)}ms');
  print('P95: ${stats['p95']?.toStringAsFixed(2)}ms');
  print('Samples: ${stats['count']?.toInt()}');
}

// Get all averages
final averages = monitor.getAverageLatencies();
averages.forEach((operation, avgMs) {
  print('$operation: ${avgMs.toStringAsFixed(2)}ms');
});
```

### 4. Check if Operation is Too Slow

```dart
final stats = monitor.getStats('local_pose_detection');
if (stats != null && stats['p95']! > 33) {
  // Can't maintain 30fps, need to optimize
  reduceFrameRate();
}
```

### 5. Generate Performance Report

```dart
// Get human-readable summary
final report = monitor.getSummaryReport();
print(report);

// Export as JSON for analytics
final json = monitor.exportMetrics();
await analyticsService.upload(json);
```

## Common Integration Patterns

### Pattern 1: Service with Performance Tracking

```dart
class PoseAnalysisService {
  final PerformanceMonitor _monitor;

  PoseAnalysisService(this._monitor);

  Future<Pose> detectPose(Uint8List frame) async {
    return await _monitor.trackLatency('local_pose_detection', () async {
      return await _actualDetection(frame);
    });
  }
}
```

### Pattern 2: Nested Operation Tracking

```dart
Future<void> processFrame(Uint8List frame) async {
  await monitor.trackLatency('full_pipeline', () async {
    final preprocessed = await monitor.trackLatency(
      'frame_preprocessing',
      () => preprocess(frame),
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

### Pattern 3: Adaptive Feature Toggle

```dart
class FeatureManager {
  final PerformanceMonitor _monitor;

  FeatureManager(this._monitor);

  bool canUseHighQuality() {
    final stats = _monitor.getStats('local_pose_detection');
    if (stats == null) return true;

    // If average latency > 25ms, can't maintain 30fps with high quality
    return stats['average']! < 25;
  }
}
```

### Pattern 4: Periodic Reporting

```dart
class PerformanceReporter {
  final PerformanceMonitor _monitor;
  Timer? _timer;

  void start() {
    _timer = Timer.periodic(Duration(minutes: 5), (_) {
      final report = _monitor.getSummaryReport();
      debugPrint(report);

      // Send to analytics
      analyticsService.log(_monitor.exportMetrics());
    });
  }

  void stop() => _timer?.cancel();
}
```

## Predefined Operations

Use these exact strings for consistency:

| Operation | Threshold | Use Case |
|-----------|-----------|----------|
| `local_pose_detection` | 33ms | MoveNet pose detection |
| `gemini_api_call` | 1000ms | AI coaching API calls |
| `frame_preprocessing` | 10ms | Image preprocessing |
| `rep_counting` | 5ms | Rep counter logic |
| `form_analysis` | 10ms | Form quality analysis |

## Performance Thresholds

### 30fps Target (33ms per frame)

```dart
const frameBudget = 33.0; // milliseconds

// Check if we can maintain 30fps
final p95 = monitor.getPercentile('local_pose_detection', 95);
final canMaintain30fps = (p95 ?? 0) <= frameBudget;
```

### API Response Time

```dart
// Gemini should respond within 1 second for good UX
final avgLatency = monitor.getAverageLatencies()['gemini_api_call'];
if (avgLatency != null && avgLatency > 1000) {
  // Consider caching or reducing call frequency
}
```

## Tips

1. **Name Consistency**: Always use the same operation name for the same type of work
2. **Track Early**: Start tracking from day one to establish baselines
3. **Check P95, Not Average**: P95 better represents user experience
4. **Export Regularly**: Send metrics to analytics for long-term trend analysis
5. **Reset Between Sessions**: Clear metrics between workout sessions

## Debugging Performance Issues

```dart
void debugPerformance(PerformanceMonitor monitor) {
  final report = monitor.getSummaryReport();
  print(report);

  // Find the slowest operation
  final averages = monitor.getAverageLatencies();
  final slowest = averages.entries
      .reduce((a, b) => a.value > b.value ? a : b);

  print('Bottleneck: ${slowest.key} at ${slowest.value.toStringAsFixed(2)}ms');

  // Check if any operation is consistently slow
  for (final entry in averages.entries) {
    final stats = monitor.getStats(entry.key);
    if (stats != null) {
      final variance = stats['max']! - stats['min']!;
      if (variance > 50) {
        print('Warning: ${entry.key} has high variance (${variance.toStringAsFixed(2)}ms)');
      }
    }
  }
}
```

## Full Example: Screen Integration

```dart
class PoseAnalysisScreen extends ConsumerStatefulWidget {
  @override
  ConsumerState<PoseAnalysisScreen> createState() => _PoseAnalysisScreenState();
}

class _PoseAnalysisScreenState extends ConsumerState<PoseAnalysisScreen> {
  @override
  void initState() {
    super.initState();
    _startPerformanceMonitoring();
  }

  void _startPerformanceMonitoring() {
    Timer.periodic(Duration(minutes: 1), (_) {
      final monitor = ref.read(performanceMonitorProvider);
      final report = monitor.getSummaryReport();
      debugPrint(report);
    });
  }

  Future<void> _analyzePose(Uint8List frame) async {
    final monitor = ref.read(performanceMonitorProvider);

    final result = await monitor.trackLatency('local_pose_detection', () async {
      return await poseDetector.process(frame);
    });

    // Check performance and adapt
    final stats = monitor.getStats('local_pose_detection');
    if (stats != null && stats['p95']! > 50) {
      // Too slow, reduce quality
      setState(() => _useHighQuality = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final monitor = ref.watch(performanceMonitorProvider);
    final averages = monitor.getAverageLatencies();

    return Scaffold(
      body: Column(
        children: [
          // Your UI here
          if (averages.isNotEmpty)
            Text('Avg latency: ${averages.values.first.toStringAsFixed(2)}ms'),
        ],
      ),
    );
  }
}
```

## See Also

- **Full Documentation**: `README_PERFORMANCE_MONITOR.md`
- **Examples**: `performance_monitor.example.dart`
- **Tests**: `test/core/services/performance_monitor_test.dart`
- **Implementation**: `performance_monitor.dart`
