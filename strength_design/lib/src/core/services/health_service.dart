import 'package:flutter/foundation.dart';
import 'package:health/health.dart';
import 'package:strength_design/src/core/services/health_service_interface.dart';
import 'package:strength_design/src/core/services/health_summary.dart';

const _requestedTypes = <HealthDataType>[
  HealthDataType.STEPS,
  HealthDataType.ACTIVE_ENERGY_BURNED,
  HealthDataType.WORKOUT,
];

const _requestedPermissions = <HealthDataAccess>[
  HealthDataAccess.READ,
  HealthDataAccess.READ,
  HealthDataAccess.READ,
];

class HealthService implements HealthServiceInterface {
  final Health _health;

  HealthService({Health? health}) : _health = health ?? Health();

  @override
  Future<bool> hasPermissions() async {
    try {
      final result = await _health.hasPermissions(
        _requestedTypes,
        permissions: _requestedPermissions,
      );
      return result ?? false;
    } catch (e) {
      debugPrint('Error checking health permissions: $e');
      return false;
    }
  }

  @override
  Future<bool> requestAuthorization() async {
    try {
      final requested = await _health.requestAuthorization(
        _requestedTypes,
        permissions: _requestedPermissions,
      );
      return requested;
    } catch (e) {
      debugPrint('Error requesting health authorization: $e');
      return false;
    }
  }

  @override
  Future<List<HealthDataPoint>> getTodaysSteps() async {
    final now = DateTime.now();
    final midnight = DateTime(now.year, now.month, now.day);

    try {
      return await _health.getHealthDataFromTypes(
        types: const [HealthDataType.STEPS],
        startTime: midnight,
        endTime: now,
      );
    } catch (e) {
      debugPrint('Error fetching steps: $e');
      return [];
    }
  }

  @override
  Future<HealthSummary> getTodaysSummary() async {
    final now = DateTime.now();
    final midnight = DateTime(now.year, now.month, now.day);

    try {
      final stepsData = await _health.getHealthDataFromTypes(
        types: const [HealthDataType.STEPS],
        startTime: midnight,
        endTime: now,
      );
      final energyData = await _health.getHealthDataFromTypes(
        types: const [HealthDataType.ACTIVE_ENERGY_BURNED],
        startTime: midnight,
        endTime: now,
      );
      final workoutData = await _health.getHealthDataFromTypes(
        types: const [HealthDataType.WORKOUT],
        startTime: midnight,
        endTime: now,
      );

      final totalSteps = stepsData.fold<int>(0, (sum, dataPoint) {
        final value = dataPoint.value;
        if (value is NumericHealthValue) {
          return sum + value.numericValue.round();
        }
        return sum;
      });

      final activeEnergy = energyData.fold<double>(0, (sum, dataPoint) {
        final value = dataPoint.value;
        if (value is NumericHealthValue) {
          return sum + value.numericValue.toDouble();
        }
        return sum;
      });

      final workoutMinutes = workoutData.fold<int>(0, (sum, dataPoint) {
        final duration =
            dataPoint.dateTo.difference(dataPoint.dateFrom).inMinutes;
        return sum + duration;
      });

      return HealthSummary(
        totalSteps: totalSteps,
        activeEnergyBurned: double.parse(activeEnergy.toStringAsFixed(1)),
        workoutCount: workoutData.length,
        totalWorkoutMinutes: workoutMinutes,
      );
    } catch (e) {
      debugPrint('Error fetching health summary: $e');
      return const HealthSummary.empty();
    }
  }
}
