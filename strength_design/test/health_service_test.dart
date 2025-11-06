import 'package:flutter_test/flutter_test.dart';
import 'package:health/health.dart';
import 'package:mocktail/mocktail.dart';
import 'package:strength_design/src/core/services/health_service.dart';
import 'package:strength_design/src/core/services/health_summary.dart';

class MockHealth extends Mock implements Health {}

void main() {
  late MockHealth mockHealth;
  late HealthService service;

  setUpAll(() {
    registerFallbackValue(DateTime.fromMillisecondsSinceEpoch(0));
  });

  setUp(() {
    mockHealth = MockHealth();
    service = HealthService(health: mockHealth);
  });

  group('requestAuthorization', () {
    test('returns true when the plugin grants access', () async {
      when(
        () => mockHealth.requestAuthorization(
          const [
            HealthDataType.STEPS,
            HealthDataType.ACTIVE_ENERGY_BURNED,
            HealthDataType.WORKOUT,
          ],
          permissions: const [
            HealthDataAccess.READ,
            HealthDataAccess.READ,
            HealthDataAccess.READ,
          ],
        ),
      ).thenAnswer((_) async => true);

      final result = await service.requestAuthorization();

      expect(result, isTrue);
      verify(
        () => mockHealth.requestAuthorization(
          const [
            HealthDataType.STEPS,
            HealthDataType.ACTIVE_ENERGY_BURNED,
            HealthDataType.WORKOUT,
          ],
          permissions: const [
            HealthDataAccess.READ,
            HealthDataAccess.READ,
            HealthDataAccess.READ,
          ],
        ),
      ).called(1);
    });

    test('returns false when the plugin denies access', () async {
      when(
        () => mockHealth.requestAuthorization(
          const [
            HealthDataType.STEPS,
            HealthDataType.ACTIVE_ENERGY_BURNED,
            HealthDataType.WORKOUT,
          ],
          permissions: const [
            HealthDataAccess.READ,
            HealthDataAccess.READ,
            HealthDataAccess.READ,
          ],
        ),
      ).thenAnswer((_) async => false);

      final result = await service.requestAuthorization();

      expect(result, isFalse);
    });

    test('returns false when the plugin throws', () async {
      when(
        () => mockHealth.requestAuthorization(
          const [
            HealthDataType.STEPS,
            HealthDataType.ACTIVE_ENERGY_BURNED,
            HealthDataType.WORKOUT,
          ],
          permissions: const [
            HealthDataAccess.READ,
            HealthDataAccess.READ,
            HealthDataAccess.READ,
          ],
        ),
      ).thenThrow(Exception('boom'));

      final result = await service.requestAuthorization();

      expect(result, isFalse);
    });
  });

  group('getTodaysSteps', () {
    test('returns fetched data points', () async {
      final now = DateTime.now();
      final expectedData = [
        HealthDataPoint(
          value: NumericHealthValue(numericValue: 100),
          type: HealthDataType.STEPS,
          unit: HealthDataUnit.COUNT,
          dateFrom: now,
          dateTo: now,
          sourceId: 'device',
          sourceName: 'source',
          uuid: 'uuid',
          sourceDeviceId: 'source_device_id',
          sourcePlatform: HealthPlatformType.appleHealth,
        ),
      ];

      when(
        () => mockHealth.getHealthDataFromTypes(
          types: const [HealthDataType.STEPS],
          startTime: any<DateTime>(named: 'startTime'),
          endTime: any<DateTime>(named: 'endTime'),
        ),
      ).thenAnswer((_) async => expectedData);

      final result = await service.getTodaysSteps();

      expect(result, expectedData);
    });

    test('returns empty list when plugin throws', () async {
      when(
        () => mockHealth.getHealthDataFromTypes(
          types: const [HealthDataType.STEPS],
          startTime: any<DateTime>(named: 'startTime'),
          endTime: any<DateTime>(named: 'endTime'),
        ),
      ).thenThrow(Exception('failure'));

      final result = await service.getTodaysSteps();

      expect(result, isEmpty);
    });
  });

  group('hasPermissions', () {
    test('returns true when plugin confirms permissions', () async {
      when(
        () => mockHealth.hasPermissions(
          const [
            HealthDataType.STEPS,
            HealthDataType.ACTIVE_ENERGY_BURNED,
            HealthDataType.WORKOUT,
          ],
          permissions: const [
            HealthDataAccess.READ,
            HealthDataAccess.READ,
            HealthDataAccess.READ,
          ],
        ),
      ).thenAnswer((_) async => true);

      final result = await service.hasPermissions();

      expect(result, isTrue);
    });

    test('returns false when plugin returns null or throws', () async {
      when(
        () => mockHealth.hasPermissions(
          const [
            HealthDataType.STEPS,
            HealthDataType.ACTIVE_ENERGY_BURNED,
            HealthDataType.WORKOUT,
          ],
          permissions: const [
            HealthDataAccess.READ,
            HealthDataAccess.READ,
            HealthDataAccess.READ,
          ],
        ),
      ).thenAnswer((_) async => null);

      expect(await service.hasPermissions(), isFalse);

      when(
        () => mockHealth.hasPermissions(
          const [
            HealthDataType.STEPS,
            HealthDataType.ACTIVE_ENERGY_BURNED,
            HealthDataType.WORKOUT,
          ],
          permissions: const [
            HealthDataAccess.READ,
            HealthDataAccess.READ,
            HealthDataAccess.READ,
          ],
        ),
      ).thenThrow(Exception('boom'));

      expect(await service.hasPermissions(), isFalse);
    });
  });

  group('getTodaysSummary', () {
    test('aggregates steps, energy, and workouts', () async {
      final now = DateTime.now();
      final stepsData = [
        HealthDataPoint(
          value: NumericHealthValue(numericValue: 750.4),
          type: HealthDataType.STEPS,
          unit: HealthDataUnit.COUNT,
          dateFrom: now.subtract(const Duration(hours: 2)),
          dateTo: now.subtract(const Duration(hours: 2)),
          sourceId: 'device',
          sourceName: 'source',
          uuid: 'steps-1',
          sourceDeviceId: 'source_device_id',
          sourcePlatform: HealthPlatformType.appleHealth,
        ),
        HealthDataPoint(
          value: NumericHealthValue(numericValue: 250),
          type: HealthDataType.STEPS,
          unit: HealthDataUnit.COUNT,
          dateFrom: now.subtract(const Duration(hours: 1)),
          dateTo: now.subtract(const Duration(hours: 1)),
          sourceId: 'device',
          sourceName: 'source',
          uuid: 'steps-2',
          sourceDeviceId: 'source_device_id',
          sourcePlatform: HealthPlatformType.appleHealth,
        ),
      ];

      final energyData = [
        HealthDataPoint(
          value: NumericHealthValue(numericValue: 120.5),
          type: HealthDataType.ACTIVE_ENERGY_BURNED,
          unit: HealthDataUnit.KILOCALORIE,
          dateFrom: now.subtract(const Duration(hours: 3)),
          dateTo: now.subtract(const Duration(hours: 3)),
          sourceId: 'device',
          sourceName: 'source',
          uuid: 'energy-1',
          sourceDeviceId: 'source_device_id',
          sourcePlatform: HealthPlatformType.appleHealth,
        ),
      ];

      final workoutData = [
        HealthDataPoint(
          value: WorkoutHealthValue(
            workoutActivityType: HealthWorkoutActivityType.RUNNING,
            totalEnergyBurned: 200,
            totalEnergyBurnedUnit: HealthDataUnit.KILOCALORIE,
          ),
          type: HealthDataType.WORKOUT,
          unit: HealthDataUnit.NO_UNIT,
          dateFrom: now.subtract(const Duration(hours: 1, minutes: 30)),
          dateTo: now.subtract(const Duration(hours: 1, minutes: 15)),
          sourceId: 'device',
          sourceName: 'source',
          uuid: 'workout-1',
          sourceDeviceId: 'source_device_id',
          sourcePlatform: HealthPlatformType.appleHealth,
        ),
        HealthDataPoint(
          value: WorkoutHealthValue(
            workoutActivityType: HealthWorkoutActivityType.WALKING,
            totalEnergyBurned: 100,
            totalEnergyBurnedUnit: HealthDataUnit.KILOCALORIE,
          ),
          type: HealthDataType.WORKOUT,
          unit: HealthDataUnit.NO_UNIT,
          dateFrom: now.subtract(const Duration(minutes: 40)),
          dateTo: now.subtract(const Duration(minutes: 10)),
          sourceId: 'device',
          sourceName: 'source',
          uuid: 'workout-2',
          sourceDeviceId: 'source_device_id',
          sourcePlatform: HealthPlatformType.appleHealth,
        ),
      ];

      when(
        () => mockHealth.getHealthDataFromTypes(
          types: const [HealthDataType.STEPS],
          startTime: any<DateTime>(named: 'startTime'),
          endTime: any<DateTime>(named: 'endTime'),
        ),
      ).thenAnswer((_) async => stepsData);

      when(
        () => mockHealth.getHealthDataFromTypes(
          types: const [HealthDataType.ACTIVE_ENERGY_BURNED],
          startTime: any<DateTime>(named: 'startTime'),
          endTime: any<DateTime>(named: 'endTime'),
        ),
      ).thenAnswer((_) async => energyData);

      when(
        () => mockHealth.getHealthDataFromTypes(
          types: const [HealthDataType.WORKOUT],
          startTime: any<DateTime>(named: 'startTime'),
          endTime: any<DateTime>(named: 'endTime'),
        ),
      ).thenAnswer((_) async => workoutData);

      final result = await service.getTodaysSummary();

      expect(
        result,
        predicate<HealthSummary>(
          (summary) =>
              summary.totalSteps == 1000 &&
              summary.activeEnergyBurned == 120.5 &&
              summary.workoutCount == 2 &&
              summary.totalWorkoutMinutes == 45,
        ),
      );
    });

    test('returns empty summary when plugin throws', () async {
      when(
        () => mockHealth.getHealthDataFromTypes(
          types: const [HealthDataType.STEPS],
          startTime: any<DateTime>(named: 'startTime'),
          endTime: any<DateTime>(named: 'endTime'),
        ),
      ).thenThrow(Exception('failure'));

      final result = await service.getTodaysSummary();

      expect(result, const HealthSummary.empty());
    });
  });
}
