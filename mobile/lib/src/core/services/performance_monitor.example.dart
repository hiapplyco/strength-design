// Example usage of PerformanceMonitor service
// This file demonstrates various integration patterns

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'performance_monitor.dart';

// Example 1: Basic usage in a service
class ExamplePoseService {
  final PerformanceMonitor _performanceMonitor = PerformanceMonitor();

  Future<void> processPoseFrame(Uint8List frameData) async {
    // Track the entire pose detection pipeline
    await _performanceMonitor.trackLatency('local_pose_detection', () async {
      // Preprocess the frame
      final preprocessed = await _performanceMonitor.trackLatency(
        'frame_preprocessing',
        () => _preprocessFrame(frameData),
      );

      // Detect poses
      final poses = await _detectPoses(preprocessed);

      // Analyze form
      await _performanceMonitor.trackLatency(
        'form_analysis',
        () => _analyzeForm(poses),
      );

      // Count reps
      await _performanceMonitor.trackLatency(
        'rep_counting',
        () => _countReps(poses),
      );
    });
  }

  Future<Uint8List> _preprocessFrame(Uint8List data) async {
    // Simulate preprocessing
    await Future.delayed(const Duration(milliseconds: 5));
    return data;
  }

  Future<List<dynamic>> _detectPoses(Uint8List data) async {
    // Simulate pose detection
    await Future.delayed(const Duration(milliseconds: 25));
    return [];
  }

  Future<void> _analyzeForm(List<dynamic> poses) async {
    // Simulate form analysis
    await Future.delayed(const Duration(milliseconds: 8));
  }

  Future<void> _countReps(List<dynamic> poses) async {
    // Simulate rep counting
    await Future.delayed(const Duration(milliseconds: 3));
  }

  void printPerformanceReport() {
    // ignore: avoid_print
    print(_performanceMonitor.getSummaryReport());
  }
}

// Example 2: Tracking Gemini API calls
class ExampleGeminiService {
  final PerformanceMonitor _performanceMonitor = PerformanceMonitor();

  Future<String> getCoachingFeedback(Map<String, dynamic> poseData) async {
    return await _performanceMonitor.trackLatency('gemini_api_call', () async {
      // Simulate API call
      await Future.delayed(const Duration(milliseconds: 800));
      return 'Great form! Keep your back straight.';
    });
  }

  Future<void> checkApiPerformance() async {
    final stats = _performanceMonitor.getStats('gemini_api_call');
    if (stats != null) {
      final p95 = stats['p95']!;
      if (p95 > 1000) {
        // ignore: avoid_print
        print('Warning: Gemini API P95 latency is ${p95.toStringAsFixed(0)}ms');
        // ignore: avoid_print
        print('Consider implementing caching or reducing call frequency');
      }
    }
  }
}

// Example 3: Integration with Riverpod provider

final performanceMonitorProvider = Provider<PerformanceMonitor>((ref) {
  final monitor = PerformanceMonitor();

  // Clean up when provider is disposed
  ref.onDispose(() {
    // Export final metrics before cleanup
    final metrics = monitor.exportMetrics();
    debugPrint('Final performance metrics: $metrics');
  });

  return monitor;
});

// Example usage in a widget
class ExamplePoseAnalysisWidget extends ConsumerWidget {
  const ExamplePoseAnalysisWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final monitor = ref.watch(performanceMonitorProvider);

    return ElevatedButton(
      onPressed: () async {
        await monitor.trackLatency('button_action', () async {
          // Perform some action
          await Future.delayed(const Duration(milliseconds: 100));
        });

        // Show performance stats
        final stats = monitor.getStats('button_action');
        if (stats != null) {
          // ignore: avoid_print
          print('Button action took ${stats['average']?.toStringAsFixed(2)}ms on average');
        }
      },
      child: const Text('Analyze Pose'),
    );
  }
}

// Example 4: Periodic performance reporting
class PerformanceReporter {
  final PerformanceMonitor _monitor;
  Timer? _reportTimer;

  PerformanceReporter(this._monitor);

  void startPeriodicReporting({Duration interval = const Duration(seconds: 300)}) {
    _reportTimer?.cancel();
    _reportTimer = Timer.periodic(interval, (_) {
      _generateReport();
    });
  }

  void _generateReport() {
    final report = _monitor.getSummaryReport();
    debugPrint(report);

    // Check for performance issues
    final averages = _monitor.getAverageLatencies();
    for (final entry in averages.entries) {
      final operation = entry.key;
      final avgLatency = entry.value;

      // Custom thresholds based on operation
      final threshold = _getThreshold(operation);
      if (avgLatency > threshold) {
        debugPrint(
          '⚠️ Performance issue detected: $operation averaging ${avgLatency.toStringAsFixed(2)}ms '
          '(threshold: ${threshold.toStringAsFixed(0)}ms)',
        );
      }
    }

    // Export to analytics or logging service
    final metricsJson = _monitor.exportMetrics();
    // TODO: Send to analytics service
    // analyticsService.logPerformanceMetrics(metricsJson);
    // Using metricsJson to avoid warning
    debugPrint('Metrics ready for export: ${metricsJson.length} bytes');
  }

  double _getThreshold(String operation) {
    const thresholds = {
      'local_pose_detection': 33.0,
      'gemini_api_call': 1000.0,
      'frame_preprocessing': 10.0,
      'rep_counting': 5.0,
      'form_analysis': 10.0,
    };
    return thresholds[operation] ?? 100.0;
  }

  void stop() {
    _reportTimer?.cancel();
    _reportTimer = null;
  }
}

// Example 5: Performance-aware feature flagging
class PerformanceAwareFeatureManager {
  final PerformanceMonitor _monitor;

  PerformanceAwareFeatureManager(this._monitor);

  /// Determine if we should use local pose detection or fall back to server
  bool shouldUseLocalPoseDetection() {
    final stats = _monitor.getStats('local_pose_detection');
    if (stats == null) {
      // No data yet, default to local
      return true;
    }

    final p95 = stats['p95']!;
    // If P95 latency exceeds 50ms, we can't maintain 30fps
    if (p95 > 50) {
      debugPrint(
        'Local pose detection too slow (P95: ${p95.toStringAsFixed(2)}ms), '
        'falling back to server processing',
      );
      return false;
    }

    return true;
  }

  /// Determine if we should enable real-time Gemini coaching
  bool shouldEnableRealtimeCoaching() {
    final stats = _monitor.getStats('gemini_api_call');
    if (stats == null) {
      // No data yet, start with it enabled
      return true;
    }

    final p95 = stats['p95']!;
    // If API calls are too slow, disable real-time coaching
    if (p95 > 2000) {
      debugPrint(
        'Gemini API too slow (P95: ${p95.toStringAsFixed(2)}ms), '
        'disabling real-time coaching',
      );
      return false;
    }

    return true;
  }

  /// Determine optimal frame processing rate based on performance
  int getOptimalFrameRate() {
    final stats = _monitor.getStats('local_pose_detection');
    if (stats == null) {
      return 30; // Default to 30fps
    }

    final avgLatency = stats['average']!;

    if (avgLatency < 20) {
      return 30; // Can handle 30fps
    } else if (avgLatency < 50) {
      return 15; // Drop to 15fps
    } else {
      return 10; // Drop to 10fps
    }
  }
}

// Example 6: Using with error tracking
class ExampleServiceWithErrorTracking {
  final PerformanceMonitor _monitor = PerformanceMonitor();

  Future<void> processFrame(Uint8List frame) async {
    try {
      await _monitor.trackLatency('frame_processing', () async {
        // This will automatically log errors with latency context
        await _processFrameInternal(frame);
      });
    } catch (e) {
      // Additional error handling
      debugPrint('Frame processing failed: $e');
      rethrow;
    }
  }

  Future<void> _processFrameInternal(Uint8List frame) async {
    // Simulate processing that might fail
    await Future.delayed(const Duration(milliseconds: 20));
    if (frame.isEmpty) {
      throw ArgumentError('Empty frame');
    }
  }
}

// Example 7: Complete integration example
void runCompleteExample() async {
  final monitor = PerformanceMonitor();
  final reporter = PerformanceReporter(monitor);
  final featureManager = PerformanceAwareFeatureManager(monitor);

  // Start periodic reporting
  reporter.startPeriodicReporting(interval: const Duration(seconds: 60));

  // Simulate some operations
  for (var i = 0; i < 100; i++) {
    final delay1 = 25 + (i % 10);
    await monitor.trackLatency('local_pose_detection', () async {
      await Future.delayed(Duration(milliseconds: delay1));
    });

    final delay2 = 800 + (i % 200);
    await monitor.trackLatency('gemini_api_call', () async {
      await Future.delayed(Duration(milliseconds: delay2));
    });
  }

  // Check feature flags based on performance
  final useLocal = featureManager.shouldUseLocalPoseDetection();
  final enableCoaching = featureManager.shouldEnableRealtimeCoaching();
  final frameRate = featureManager.getOptimalFrameRate();

  // ignore: avoid_print
  print('Use local pose detection: $useLocal');
  // ignore: avoid_print
  print('Enable real-time coaching: $enableCoaching');
  // ignore: avoid_print
  print('Optimal frame rate: $frameRate fps');

  // Print final report
  // ignore: avoid_print
  print(monitor.getSummaryReport());

  // Export metrics
  final metrics = monitor.exportMetrics();
  // ignore: avoid_print
  print('Exported metrics:\n$metrics');

  // Clean up
  reporter.stop();
}
