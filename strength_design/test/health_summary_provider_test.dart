import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:strength_design/src/core/services/health_service_interface.dart';
import 'package:strength_design/src/core/services/health_service_provider.dart';
import 'package:strength_design/src/core/services/health_summary.dart';
import 'package:strength_design/src/features/home/health_summary_provider.dart';

class _MockHealthService extends Mock implements HealthServiceInterface {}

void main() {
  late ProviderContainer container;
  late _MockHealthService mockService;

  setUp(() {
    mockService = _MockHealthService();
    container = ProviderContainer(
      overrides: [
        healthServiceProvider.overrideWithValue(mockService),
      ],
    );
    addTearDown(container.dispose);
  });

  test('initialize loads summary when permissions are granted', () async {
    final summary = HealthSummary(
      totalSteps: 1200,
      activeEnergyBurned: 340.5,
      workoutCount: 2,
      totalWorkoutMinutes: 45,
    );

    when(() => mockService.hasPermissions()).thenAnswer((_) async => true);
    when(() => mockService.getTodaysSummary()).thenAnswer((_) async => summary);

    final notifier = container.read(healthSummaryProvider.notifier);
    await notifier.initialize();

    final state = container.read(healthSummaryProvider);

    expect(state.authorized, isTrue);
    expect(state.summary, summary);
    expect(state.isLoading, isFalse);
    expect(state.error, isNull);
    expect(state.lastUpdated, isNotNull);
  });

  test('requestAuthorization surfaces an error when access is denied',
      () async {
    when(() => mockService.requestAuthorization())
        .thenAnswer((_) async => false);

    final notifier = container.read(healthSummaryProvider.notifier);
    await notifier.requestAuthorization();

    final state = container.read(healthSummaryProvider);

    expect(state.authorized, isFalse);
    expect(state.summary, isNull);
    expect(state.isLoading, isFalse);
    expect(state.error, 'Health data access was denied.');
  });

  test('refresh reports an authorization error when not connected', () async {
    final notifier = container.read(healthSummaryProvider.notifier);

    await notifier.refresh();

    final state = container.read(healthSummaryProvider);
    expect(state.error, 'Authorize health data to view metrics.');
  });
}
