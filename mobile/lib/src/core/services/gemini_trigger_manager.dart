import 'package:mobile_flutter/src/features/pose_analysis/domain/entities/pose_metrics.dart';
import 'package:mobile_flutter/src/features/pose_analysis/domain/entities/form_error.dart';
import 'package:mobile_flutter/src/features/pose_analysis/domain/entities/exercise_phase.dart';

/// Smart throttling logic for determining when to call Gemini Live API.
///
/// This service implements a priority-based decision system that balances
/// real-time feedback needs with API cost optimization and performance.
///
/// ## Priority Levels (highest to lowest):
/// 1. **Safety issues** - Dangerous form errors (always call)
/// 2. **User requested feedback** - Explicit user request
/// 3. **Completed set** - Rep completion milestone
/// 4. **Regular cadence** - Every 5 reps or 30 seconds
/// 5. **Persistent form errors** - 3+ moderate errors with throttle check
///
/// ## Usage Example:
/// ```dart
/// final triggerManager = GeminiTriggerManager();
///
/// void onPoseDetected(PoseMetrics metrics, List<FormError> errors) {
///   final decision = triggerManager.shouldCallGemini(
///     poseMetrics: metrics,
///     formErrors: errors,
///   );
///
///   if (decision.shouldCall) {
///     print('Calling Gemini: ${decision.reason}');
///     await geminiService.analyzeForm(metrics);
///     triggerManager.recordCall();
///   }
/// }
/// ```
class GeminiTriggerManager {
  /// Minimum time between Gemini calls (15 seconds)
  static const Duration minTimeBetweenCalls = Duration(seconds: 15);

  /// Rep threshold for regular cadence triggering (Priority 4)
  static const int repThreshold = 5;

  /// Time threshold for regular cadence triggering (Priority 4)
  static const Duration timeThreshold = Duration(seconds: 30);

  /// Number of moderate errors required to trigger Priority 5
  static const int moderateErrorThreshold = 3;

  /// Timestamp of the last Gemini API call
  DateTime? _lastCallTime;

  /// Number of reps since the last Gemini call
  int _repsSinceLastCall = 0;

  /// Last known rep count (used to detect new reps)
  int _lastRepCount = 0;

  /// Creates a new GeminiTriggerManager instance.
  GeminiTriggerManager();

  /// Determines whether to call Gemini based on current pose state and errors.
  ///
  /// Returns a [TriggerDecision] containing:
  /// - `shouldCall`: Whether to make the Gemini API call
  /// - `priority`: The priority level that triggered the decision (1-5)
  /// - `reason`: Human-readable explanation of the decision
  ///
  /// ## Parameters:
  /// - `poseMetrics`: Current pose detection result with phase and rep count
  /// - `formErrors`: List of detected form errors (can be empty)
  ///
  /// ## Priority Logic:
  /// The method evaluates priorities in order (1 → 5), returning immediately
  /// when a priority condition is met. Lower priority checks are skipped if
  /// a higher priority trigger is found.
  TriggerDecision shouldCallGemini({
    required PoseMetrics poseMetrics,
    required List<FormError> formErrors,
  }) {
    // Update rep tracking if rep count increased
    if (poseMetrics.repCount > _lastRepCount) {
      _repsSinceLastCall += (poseMetrics.repCount - _lastRepCount);
      _lastRepCount = poseMetrics.repCount;
    }

    // Priority 1: Safety issues (dangerous form errors)
    // ALWAYS call immediately, regardless of throttling
    final dangerousErrors = formErrors
        .where((error) => error.severity == ErrorSeverity.dangerous)
        .toList();

    if (dangerousErrors.isNotEmpty) {
      return TriggerDecision(
        shouldCall: true,
        priority: 1,
        reason:
            'Critical safety issue detected: ${dangerousErrors.first.errorType}',
      );
    }

    // Priority 2: User requested feedback
    // Respect user's explicit request for coaching
    if (poseMetrics.userRequestedFeedback) {
      return TriggerDecision(
        shouldCall: true,
        priority: 2,
        reason: 'User explicitly requested feedback',
      );
    }

    // Priority 3: Completed set
    // Provide feedback at the end of each set
    if (poseMetrics.currentPhase == ExercisePhase.setCompleted) {
      return TriggerDecision(
        shouldCall: true,
        priority: 3,
        reason: 'Set completed - providing summary feedback',
      );
    }

    // Priority 4: Regular cadence (every 5 reps or 30 seconds)
    // Ensure periodic feedback even if no issues detected
    final timeSinceLastCall = _lastCallTime == null
        ? null
        : DateTime.now().difference(_lastCallTime!);

    if (_repsSinceLastCall >= repThreshold) {
      if (_throttleCheck()) {
        return TriggerDecision(
          shouldCall: true,
          priority: 4,
          reason: 'Regular cadence: $repThreshold reps completed',
        );
      }
    }

    if (timeSinceLastCall != null && timeSinceLastCall >= timeThreshold) {
      if (_throttleCheck()) {
        return TriggerDecision(
          shouldCall: true,
          priority: 4,
          reason: 'Regular cadence: ${timeThreshold.inSeconds}s elapsed',
        );
      }
    }

    // Priority 5: Persistent form errors (3+ moderate errors)
    // Address ongoing form issues with throttling
    final moderateErrors = formErrors
        .where((error) => error.severity == ErrorSeverity.moderate)
        .toList();

    if (moderateErrors.length >= moderateErrorThreshold) {
      if (_throttleCheck()) {
        return TriggerDecision(
          shouldCall: true,
          priority: 5,
          reason:
              'Persistent form issues: ${moderateErrors.length} moderate errors',
        );
      }
    }

    // No trigger condition met
    return TriggerDecision(
      shouldCall: false,
      priority: 0,
      reason: 'No trigger condition met',
    );
  }

  /// Checks if enough time has passed since the last call.
  ///
  /// Returns `true` if:
  /// - This is the first call (no previous call recorded), OR
  /// - At least [minTimeBetweenCalls] has elapsed since the last call
  ///
  /// This prevents excessive API calls and ensures smooth UX.
  bool _throttleCheck() {
    if (_lastCallTime == null) {
      return true; // First call, no throttling needed
    }

    final elapsed = DateTime.now().difference(_lastCallTime!);
    return elapsed >= minTimeBetweenCalls;
  }

  /// Records that a Gemini API call was made.
  ///
  /// Updates internal state:
  /// - Sets `_lastCallTime` to now
  /// - Resets `_repsSinceLastCall` to 0
  ///
  /// Call this method immediately after making a successful Gemini API call
  /// to ensure accurate throttling and trigger detection.
  ///
  /// ## Example:
  /// ```dart
  /// if (triggerManager.shouldCallGemini(...).shouldCall) {
  ///   await geminiService.analyzeForm(...);
  ///   triggerManager.recordCall(); // ← Record the call
  /// }
  /// ```
  void recordCall() {
    _lastCallTime = DateTime.now();
    _repsSinceLastCall = 0;
  }

  /// Resets the trigger manager state for a new workout session.
  ///
  /// Clears:
  /// - Last call timestamp
  /// - Rep counter
  /// - Last rep count
  ///
  /// Call this when:
  /// - Starting a new exercise
  /// - Starting a new workout session
  /// - User switches exercises
  ///
  /// ## Example:
  /// ```dart
  /// void startNewExercise() {
  ///   triggerManager.reset();
  ///   // Now ready for fresh trigger logic
  /// }
  /// ```
  void reset() {
    _lastCallTime = null;
    _repsSinceLastCall = 0;
    _lastRepCount = 0;
  }

  /// Returns the current state for debugging and monitoring.
  ///
  /// Useful for:
  /// - Testing trigger logic
  /// - UI displays showing call frequency
  /// - Debugging throttling issues
  TriggerState getState() {
    return TriggerState(
      lastCallTime: _lastCallTime,
      repsSinceLastCall: _repsSinceLastCall,
      lastRepCount: _lastRepCount,
    );
  }
}

/// Result of the trigger decision logic.
///
/// Contains all information needed to understand why Gemini should or
/// should not be called for a given frame.
class TriggerDecision {
  /// Whether the Gemini API should be called
  final bool shouldCall;

  /// Priority level (1-5, where 1 is highest) that triggered the call
  /// 0 indicates no trigger condition was met
  final int priority;

  /// Human-readable explanation of the decision
  final String reason;

  const TriggerDecision({
    required this.shouldCall,
    required this.priority,
    required this.reason,
  });

  @override
  String toString() =>
      'TriggerDecision(shouldCall: $shouldCall, '
      'priority: $priority, reason: $reason)';
}

/// Current state of the trigger manager.
///
/// Used for debugging, testing, and monitoring trigger behavior.
class TriggerState {
  /// Timestamp of the last Gemini API call (null if no calls yet)
  final DateTime? lastCallTime;

  /// Number of reps since the last call
  final int repsSinceLastCall;

  /// Last known rep count
  final int lastRepCount;

  const TriggerState({
    required this.lastCallTime,
    required this.repsSinceLastCall,
    required this.lastRepCount,
  });

  /// Time elapsed since last call (null if no previous call)
  Duration? get timeSinceLastCall {
    if (lastCallTime == null) return null;
    return DateTime.now().difference(lastCallTime!);
  }

  @override
  String toString() =>
      'TriggerState(lastCall: $lastCallTime, '
      'repsSince: $repsSinceLastCall, lastRepCount: $lastRepCount)';
}
