import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:strength_design/src/core/services/health_service_interface.dart';
import 'package:strength_design/src/core/services/health_service_provider.dart';
import 'package:strength_design/src/core/services/health_summary.dart';

class HealthSummaryState {
  const HealthSummaryState({
    required this.authorized,
    required this.isLoading,
    required this.summary,
    this.error,
    this.lastUpdated,
  });

  const HealthSummaryState.initial()
      : authorized = false,
        isLoading = false,
        summary = null,
        error = null,
        lastUpdated = null;

  final bool authorized;
  final bool isLoading;
  final HealthSummary? summary;
  final String? error;
  final DateTime? lastUpdated;

  HealthSummaryState copyWith({
    bool? authorized,
    bool? isLoading,
    HealthSummary? summary,
    String? error,
    DateTime? lastUpdated,
    bool clearError = false,
    bool clearSummary = false,
  }) {
    return HealthSummaryState(
      authorized: authorized ?? this.authorized,
      isLoading: isLoading ?? this.isLoading,
      summary: clearSummary ? null : summary ?? this.summary,
      error: clearError ? null : error ?? this.error,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}

class HealthSummaryNotifier extends Notifier<HealthSummaryState> {
  late final HealthServiceInterface _service;

  @override
  HealthSummaryState build() {
    _service = ref.read(healthServiceProvider);
    return const HealthSummaryState.initial();
  }

  Future<void> initialize() async {
    await _checkAuthorization();
  }

  Future<void> _checkAuthorization() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final hasPermissions = await _service.hasPermissions();
      state = state.copyWith(authorized: hasPermissions);
      if (hasPermissions) {
        await _loadSummary();
        return;
      }
      state = state.copyWith(isLoading: false, clearSummary: true);
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: 'Unable to verify permissions. Please try again.',
      );
    }
  }

  Future<void> requestAuthorization() async {
    state = state.copyWith(isLoading: true, clearError: true);
    final granted = await _service.requestAuthorization();
    if (!granted) {
      state = state.copyWith(
        authorized: false,
        isLoading: false,
        error: 'Health data access was denied.',
        clearSummary: true,
      );
      return;
    }

    state = state.copyWith(authorized: true);
    await _loadSummary();
  }

  Future<void> refresh() async {
    if (!state.authorized) {
      state = state.copyWith(
        error: 'Authorize health data to view metrics.',
      );
      return;
    }
    await _loadSummary();
  }

  Future<void> _loadSummary() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final summary = await _service.getTodaysSummary();
      state = state.copyWith(
        summary: summary,
        isLoading: false,
        lastUpdated: DateTime.now(),
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load health metrics. Please retry shortly.',
      );
    }
  }
}

final healthSummaryProvider =
    NotifierProvider<HealthSummaryNotifier, HealthSummaryState>(
  HealthSummaryNotifier.new,
);
