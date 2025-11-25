/// Represents the different phases of a single repetition in an exercise.
///
/// This enum helps track where the user is in the movement cycle, which is
/// essential for:
/// - Determining when to trigger form analysis
/// - Timing coaching feedback delivery
/// - Counting completed reps accurately
enum ExercisePhase {
  /// Initial/upward movement phase (e.g., lifting in a curl)
  up,

  /// Downward/returning movement phase (e.g., lowering in a curl)
  down,

  /// Held position phase (e.g., pause at top of movement)
  hold,

  /// Rep has been completed and counted
  setCompleted,

  /// Rest period between reps or sets
  rest,

  /// No clear phase detected or exercise not started
  none,
}

/// Extension providing helpful utilities for ExercisePhase
extension ExercisePhaseX on ExercisePhase {
  /// Returns true if this phase is an active movement phase
  bool get isActiveMovement => this == ExercisePhase.up || this == ExercisePhase.down;

  /// Returns true if this phase represents completion or rest
  bool get isPassive => this == ExercisePhase.rest || this == ExercisePhase.setCompleted;

  /// Returns a human-readable display string
  String get displayName {
    return switch (this) {
      ExercisePhase.up => 'Up',
      ExercisePhase.down => 'Down',
      ExercisePhase.hold => 'Hold',
      ExercisePhase.setCompleted => 'Rep Complete',
      ExercisePhase.rest => 'Rest',
      ExercisePhase.none => 'Idle',
    };
  }
}
