class HealthSummary {
  const HealthSummary({
    required this.totalSteps,
    required this.activeEnergyBurned,
    required this.workoutCount,
    required this.totalWorkoutMinutes,
  });

  const HealthSummary.empty()
      : totalSteps = 0,
        activeEnergyBurned = 0,
        workoutCount = 0,
        totalWorkoutMinutes = 0;

  final int totalSteps;
  final double activeEnergyBurned;
  final int workoutCount;
  final int totalWorkoutMinutes;

  bool get hasMetrics =>
      totalSteps > 0 ||
      activeEnergyBurned > 0 ||
      workoutCount > 0 ||
      totalWorkoutMinutes > 0;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is HealthSummary &&
        other.totalSteps == totalSteps &&
        other.activeEnergyBurned == activeEnergyBurned &&
        other.workoutCount == workoutCount &&
        other.totalWorkoutMinutes == totalWorkoutMinutes;
  }

  @override
  int get hashCode => Object.hash(
        totalSteps,
        activeEnergyBurned,
        workoutCount,
        totalWorkoutMinutes,
      );
}
