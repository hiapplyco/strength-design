import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/core/services/performance_monitor.dart';

void main() {
  group('PerformanceMonitor', () {
    late PerformanceMonitor monitor;

    setUp(() {
      monitor = PerformanceMonitor();
    });

    tearDown(() {
      monitor.reset();
    });

    test('tracks latency for successful operations', () async {
      // Simulate a fast operation
      final result = await monitor.trackLatency('test_operation', () async {
        await Future.delayed(const Duration(milliseconds: 10));
        return 'success';
      });

      expect(result, equals('success'));

      final stats = monitor.getStats('test_operation');
      expect(stats, isNotNull);
      expect(stats!['count'], equals(1.0));
      expect(stats['average'], greaterThan(9.0));
      expect(stats['average'], lessThan(20.0)); // Some tolerance
    });

    test('tracks latency for failed operations', () async {
      try {
        await monitor.trackLatency('failing_operation', () async {
          await Future.delayed(const Duration(milliseconds: 5));
          throw Exception('Test error');
        });
        fail('Should have thrown exception');
      } catch (e) {
        expect(e.toString(), contains('Test error'));
      }

      // Latency should still be recorded
      final stats = monitor.getStats('failing_operation');
      expect(stats, isNotNull);
      expect(stats!['count'], equals(1.0));
    });

    test('calculates average latencies correctly', () async {
      // Record multiple measurements
      await monitor.trackLatency('operation1', () async {
        await Future.delayed(const Duration(milliseconds: 10));
      });
      await monitor.trackLatency('operation1', () async {
        await Future.delayed(const Duration(milliseconds: 20));
      });
      await monitor.trackLatency('operation2', () async {
        await Future.delayed(const Duration(milliseconds: 5));
      });

      final averages = monitor.getAverageLatencies();
      expect(averages.keys, containsAll(['operation1', 'operation2']));
      expect(averages['operation1'], greaterThan(14.0)); // ~15ms average
      expect(averages['operation2'], greaterThan(4.0)); // ~5ms
    });

    test('calculates detailed statistics', () async {
      // Record measurements with known values
      for (var i = 0; i < 100; i++) {
        await monitor.trackLatency('stats_test', () async {
          await Future.delayed(Duration(milliseconds: i % 10));
        });
      }

      final stats = monitor.getStats('stats_test');
      expect(stats, isNotNull);
      expect(stats!['count'], equals(100.0));
      expect(stats['min'], greaterThanOrEqualTo(0.0));
      expect(stats['max'], greaterThan(stats['min']!));
      expect(stats['average'], greaterThan(0.0));
      expect(stats['p50'], greaterThan(0.0));
      expect(stats['p95'], greaterThan(stats['p50']!));
      expect(stats['p99'], greaterThan(stats['p95']!));
    });

    test('calculates percentiles correctly', () async {
      // Record 100 measurements (0-99ms)
      for (var i = 0; i < 100; i++) {
        await monitor.trackLatency('percentile_test', () async {
          await Future.delayed(Duration(milliseconds: i));
        });
      }

      final p50 = monitor.getPercentile('percentile_test', 50);
      final p95 = monitor.getPercentile('percentile_test', 95);
      final p99 = monitor.getPercentile('percentile_test', 99);

      expect(p50, isNotNull);
      expect(p95, isNotNull);
      expect(p99, isNotNull);
      expect(p95! > p50!, isTrue);
      expect(p99! > p95, isTrue);
    });

    test('returns null for non-existent operations', () {
      final stats = monitor.getStats('non_existent');
      expect(stats, isNull);

      final percentile = monitor.getPercentile('non_existent', 95);
      expect(percentile, isNull);
    });

    test('validates percentile range', () {
      expect(
        () => monitor.getPercentile('test', -1),
        throwsA(isA<ArgumentError>()),
      );
      expect(
        () => monitor.getPercentile('test', 101),
        throwsA(isA<ArgumentError>()),
      );
    });

    test('resets all metrics', () async {
      await monitor.trackLatency('op1', () async {
        await Future.delayed(const Duration(milliseconds: 10));
      });
      await monitor.trackLatency('op2', () async {
        await Future.delayed(const Duration(milliseconds: 10));
      });

      expect(monitor.getAverageLatencies().keys, hasLength(2));

      monitor.reset();

      expect(monitor.getAverageLatencies(), isEmpty);
      expect(monitor.getStats('op1'), isNull);
      expect(monitor.getStats('op2'), isNull);
    });

    test('exports metrics as JSON', () async {
      await monitor.trackLatency('export_test', () async {
        await Future.delayed(const Duration(milliseconds: 10));
      });

      final json = monitor.exportMetrics();
      expect(json, isNotEmpty);
      expect(json, contains('timestamp'));
      expect(json, contains('operations'));
      expect(json, contains('export_test'));
      expect(json, contains('measurements'));
      expect(json, contains('stats'));
      expect(json, contains('threshold'));
    });

    test('generates summary report', () async {
      await monitor.trackLatency('local_pose_detection', () async {
        await Future.delayed(const Duration(milliseconds: 25));
      });
      await monitor.trackLatency('gemini_api_call', () async {
        await Future.delayed(const Duration(milliseconds: 500));
      });

      final summary = monitor.getSummaryReport();
      expect(summary, contains('Performance Monitor Summary'));
      expect(summary, contains('local_pose_detection'));
      expect(summary, contains('gemini_api_call'));
      expect(summary, contains('Average:'));
      expect(summary, contains('threshold:'));
    });

    test('tracks predefined operations with correct thresholds', () async {
      final operations = [
        'local_pose_detection',
        'gemini_api_call',
        'frame_preprocessing',
        'rep_counting',
        'form_analysis',
      ];

      for (final op in operations) {
        await monitor.trackLatency(op, () async {
          await Future.delayed(const Duration(milliseconds: 1));
        });
      }

      final json = monitor.exportMetrics();
      for (final op in operations) {
        expect(json, contains(op));
        expect(json, contains('"threshold"'));
      }
    });

    test('handles concurrent tracking', () async {
      // Simulate concurrent operations
      final futures = <Future>[];
      for (var i = 0; i < 10; i++) {
        futures.add(
          monitor.trackLatency('concurrent_test', () async {
            await Future.delayed(Duration(milliseconds: i * 2));
          }),
        );
      }

      await Future.wait(futures);

      final stats = monitor.getStats('concurrent_test');
      expect(stats, isNotNull);
      expect(stats!['count'], equals(10.0));
    });

    test('accumulates metrics across multiple calls', () async {
      for (var i = 0; i < 5; i++) {
        await monitor.trackLatency('accumulate_test', () async {
          await Future.delayed(const Duration(milliseconds: 10));
        });
      }

      final stats1 = monitor.getStats('accumulate_test');
      expect(stats1!['count'], equals(5.0));

      for (var i = 0; i < 5; i++) {
        await monitor.trackLatency('accumulate_test', () async {
          await Future.delayed(const Duration(milliseconds: 10));
        });
      }

      final stats2 = monitor.getStats('accumulate_test');
      expect(stats2!['count'], equals(10.0));
    });
  });
}
