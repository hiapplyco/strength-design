import 'dart:async';
import 'dart:convert';
import 'dart:developer' as developer;

/// Performance monitoring service for tracking latency and performance metrics
/// across various operations in the app.
///
/// Usage example:
/// ```dart
/// final monitor = PerformanceMonitor();
///
/// // Track an async operation
/// final result = await monitor.trackLatency('gemini_api_call', () async {
///   return await geminiService.analyze(frame);
/// });
///
/// // Get performance statistics
/// final stats = monitor.getStats('gemini_api_call');
/// print('Average: ${stats['average']}ms, P95: ${stats['p95']}ms');
///
/// // Export metrics for analysis
/// final metricsJson = monitor.exportMetrics();
/// ```
class PerformanceMonitor {
  /// Map storing lists of latency measurements (in milliseconds) for each operation
  final Map<String, List<double>> _latencyMetrics = {};

  /// Lock for thread-safe metric collection
  final _lock = Object();

  /// Performance thresholds (in milliseconds) for different operations
  static const Map<String, double> _thresholds = {
    'local_pose_detection': 33.0,  // 30fps target
    'gemini_api_call': 1000.0,     // 1 second
    'frame_preprocessing': 10.0,   // 10ms
    'rep_counting': 5.0,           // 5ms
    'form_analysis': 10.0,         // 10ms
  };

  /// Track latency for an async operation and return the result
  ///
  /// Automatically logs warnings when operations exceed their thresholds.
  ///
  /// Example:
  /// ```dart
  /// final pose = await monitor.trackLatency('local_pose_detection', () async {
  ///   return await poseDetector.processImage(frame);
  /// });
  /// ```
  Future<T> trackLatency<T>(
    String operation,
    Future<T> Function() task,
  ) async {
    final stopwatch = Stopwatch()..start();

    try {
      final result = await task();
      stopwatch.stop();

      final latencyMs = stopwatch.elapsedMicroseconds / 1000.0;
      _recordLatency(operation, latencyMs);

      // Log warning if operation exceeds threshold
      final threshold = _getThreshold(operation);
      if (latencyMs > threshold) {
        developer.log(
          'Performance warning: $operation took ${latencyMs.toStringAsFixed(2)}ms '
          '(threshold: ${threshold.toStringAsFixed(0)}ms)',
          name: 'PerformanceMonitor',
          level: 900, // Warning level
        );
      }

      return result;
    } catch (error, stackTrace) {
      stopwatch.stop();
      final latencyMs = stopwatch.elapsedMicroseconds / 1000.0;
      _recordLatency(operation, latencyMs);
      _logError(operation, error, stackTrace, latencyMs);
      rethrow;
    }
  }

  /// Record a latency measurement for an operation (thread-safe)
  void _recordLatency(String operation, double latencyMs) {
    synchronized(_lock, () {
      _latencyMetrics.putIfAbsent(operation, () => []);
      _latencyMetrics[operation]!.add(latencyMs);
    });
  }

  /// Get the performance threshold for an operation
  double _getThreshold(String operation) {
    return _thresholds[operation] ?? 100.0; // Default 100ms
  }

  /// Log operation errors with performance context
  void _logError(
    String operation,
    Object error,
    StackTrace stackTrace,
    double latencyMs,
  ) {
    developer.log(
      'Operation failed: $operation after ${latencyMs.toStringAsFixed(2)}ms',
      name: 'PerformanceMonitor',
      error: error,
      stackTrace: stackTrace,
      level: 1000, // Error level
    );
  }

  /// Get average latencies for all tracked operations
  ///
  /// Returns a map of operation names to average latency in milliseconds.
  Map<String, double> getAverageLatencies() {
    final Map<String, double> averages = {};

    synchronized(_lock, () {
      for (final entry in _latencyMetrics.entries) {
        if (entry.value.isNotEmpty) {
          final sum = entry.value.reduce((a, b) => a + b);
          averages[entry.key] = sum / entry.value.length;
        }
      }
    });

    return averages;
  }

  /// Get detailed statistics for a specific operation
  ///
  /// Returns a map containing:
  /// - `min`: Minimum latency
  /// - `max`: Maximum latency
  /// - `average`: Average latency
  /// - `p50`: 50th percentile (median)
  /// - `p95`: 95th percentile
  /// - `p99`: 99th percentile
  /// - `count`: Number of measurements
  ///
  /// Returns null if no measurements exist for the operation.
  Map<String, double>? getStats(String operation) {
    return synchronized(_lock, () {
      final metrics = _latencyMetrics[operation];
      if (metrics == null || metrics.isEmpty) {
        return null;
      }

      final sorted = List<double>.from(metrics)..sort();
      final count = sorted.length;

      return {
        'min': sorted.first,
        'max': sorted.last,
        'average': sorted.reduce((a, b) => a + b) / count,
        'p50': _calculatePercentile(sorted, 50),
        'p95': _calculatePercentile(sorted, 95),
        'p99': _calculatePercentile(sorted, 99),
        'count': count.toDouble(),
      };
    });
  }

  /// Calculate a specific percentile for an operation
  ///
  /// Example:
  /// ```dart
  /// final p95 = monitor.getPercentile('gemini_api_call', 95);
  /// print('95th percentile: ${p95?.toStringAsFixed(2)}ms');
  /// ```
  double? getPercentile(String operation, int percentile) {
    if (percentile < 0 || percentile > 100) {
      throw ArgumentError('Percentile must be between 0 and 100');
    }

    return synchronized(_lock, () {
      final metrics = _latencyMetrics[operation];
      if (metrics == null || metrics.isEmpty) {
        return null;
      }

      final sorted = List<double>.from(metrics)..sort();
      return _calculatePercentile(sorted, percentile);
    });
  }

  /// Calculate percentile from a sorted list of values
  double _calculatePercentile(List<double> sortedValues, int percentile) {
    if (sortedValues.isEmpty) return 0.0;
    if (sortedValues.length == 1) return sortedValues.first;

    final index = (percentile / 100.0) * (sortedValues.length - 1);
    final lower = index.floor();
    final upper = index.ceil();

    if (lower == upper) {
      return sortedValues[lower];
    }

    // Linear interpolation between values
    final lowerValue = sortedValues[lower];
    final upperValue = sortedValues[upper];
    final fraction = index - lower;

    return lowerValue + (upperValue - lowerValue) * fraction;
  }

  /// Reset all collected metrics
  ///
  /// Useful for clearing metrics between different test runs or sessions.
  void reset() {
    synchronized(_lock, () {
      _latencyMetrics.clear();
    });

    developer.log(
      'All performance metrics reset',
      name: 'PerformanceMonitor',
    );
  }

  /// Export all metrics as JSON for analysis
  ///
  /// Returns a JSON string containing:
  /// - All raw measurements
  /// - Statistical summaries for each operation
  /// - Configured thresholds
  ///
  /// Example output:
  /// ```json
  /// {
  ///   "timestamp": "2025-11-12T20:30:00.000Z",
  ///   "operations": {
  ///     "local_pose_detection": {
  ///       "measurements": [25.3, 28.1, 31.5, ...],
  ///       "stats": {
  ///         "min": 25.3,
  ///         "max": 45.2,
  ///         "average": 30.1,
  ///         "p95": 42.0,
  ///         "count": 150
  ///       },
  ///       "threshold": 33.0
  ///     }
  ///   }
  /// }
  /// ```
  String exportMetrics() {
    return synchronized(_lock, () {
      final export = <String, dynamic>{
        'timestamp': DateTime.now().toIso8601String(),
        'operations': {},
      };

      for (final entry in _latencyMetrics.entries) {
        final operation = entry.key;
        final measurements = entry.value;

        if (measurements.isNotEmpty) {
          final stats = getStats(operation);

          export['operations'][operation] = {
            'measurements': measurements,
            'stats': stats,
            'threshold': _getThreshold(operation),
          };
        }
      }

      return jsonEncode(export);
    });
  }

  /// Get a summary report of all operations and their performance status
  ///
  /// Returns a human-readable string summarizing performance metrics.
  String getSummaryReport() {
    final buffer = StringBuffer();
    buffer.writeln('=== Performance Monitor Summary ===');
    buffer.writeln('Generated: ${DateTime.now().toIso8601String()}');
    buffer.writeln();

    synchronized(_lock, () {
      if (_latencyMetrics.isEmpty) {
        buffer.writeln('No metrics collected yet.');
        return;
      }

      for (final operation in _latencyMetrics.keys.toList()..sort()) {
        final stats = getStats(operation);
        if (stats == null) continue;

        final threshold = _getThreshold(operation);
        final avgLatency = stats['average']!;
        final isOverThreshold = avgLatency > threshold;
        final status = isOverThreshold ? '⚠️ SLOW' : '✓ OK';

        buffer.writeln('$operation $status');
        buffer.writeln('  Average: ${avgLatency.toStringAsFixed(2)}ms (threshold: ${threshold.toStringAsFixed(0)}ms)');
        buffer.writeln('  Min: ${stats['min']!.toStringAsFixed(2)}ms, Max: ${stats['max']!.toStringAsFixed(2)}ms');
        buffer.writeln('  P95: ${stats['p95']!.toStringAsFixed(2)}ms, P99: ${stats['p99']!.toStringAsFixed(2)}ms');
        buffer.writeln('  Samples: ${stats['count']!.toInt()}');
        buffer.writeln();
      }
    });

    return buffer.toString();
  }
}

/// Simple synchronization helper for Dart
/// (In production, consider using package:synchronized for more robust locking)
T synchronized<T>(Object lock, T Function() callback) {
  // Note: Dart is single-threaded with async concurrency,
  // so this is a simplified synchronization approach.
  // For true multi-isolate scenarios, use SendPort/ReceivePort or package:synchronized
  return callback();
}
