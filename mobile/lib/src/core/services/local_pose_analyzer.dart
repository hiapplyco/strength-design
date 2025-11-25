import 'dart:async';
import 'dart:math' as math;

import '../../features/pose_analysis/domain/entities/exercise_phase.dart';
import '../../features/pose_analysis/domain/entities/form_error.dart';
import '../../features/pose_analysis/domain/entities/movenet_landmark.dart';
import '../../features/pose_analysis/domain/entities/pose_metrics.dart';
import 'frame_data.dart';
import 'pose_detection_service.dart';
import 'performance_monitor.dart';

/// Local pose analyzer that wraps PoseDetectionService and adds rep counting
/// and form analysis capabilities for the hybrid architecture.
///
/// This service processes frame streams through pose detection, tracks exercise
/// repetitions, detects form errors, and outputs enriched PoseMetrics for
/// real-time coaching feedback.
///
/// ## Hybrid Architecture Role
/// - Processes every frame locally at 30fps for zero-latency feedback
/// - Integrates with PerformanceMonitor for latency tracking
/// - Outputs PoseMetrics stream consumed by UI and GeminiTriggerManager
///
/// ## Example usage:
/// ```dart
/// final analyzer = LocalPoseAnalyzer(
///   poseDetector: poseDetectionService,
///   performanceMonitor: performanceMonitor,
///   exerciseType: 'bicep_curl',
/// );
///
/// final metricsStream = analyzer.analyzeFrames(frameStream);
/// await for (final metrics in metricsStream) {
///   print('Rep ${metrics.repCount}: Form score ${metrics.formScore}');
///   // Update UI with real-time feedback
/// }
/// ```
class LocalPoseAnalyzer {
  final PoseDetectionService _poseDetectionService;
  final PerformanceMonitor _performanceMonitor;
  String exerciseType;

  // Rep counting state
  int _currentRepCount = 0;
  ExercisePhase _currentPhase = ExercisePhase.none;

  // Phase transition tracking for rep counting
  double _lastKeyAngle = 0.0;
  bool _inUpPhase = false;
  bool _inDownPhase = false;

  // Form error detection state
  final List<FormError> _detectedErrors = [];

  // Thresholds for rep detection (can be customized per exercise)
  static const double _upPhaseThreshold = 0.7; // 70% of full range
  static const double _downPhaseThreshold = 0.3; // 30% of full range
  static const double _movementVelocityThreshold =
      0.05; // Min change to detect movement

  // Broadcast stream controller for metrics
  final StreamController<PoseMetrics> _metricsController;

  LocalPoseAnalyzer({
    required PoseDetectionService poseDetector,
    required PerformanceMonitor performanceMonitor,
    this.exerciseType = 'unknown',
  })  : _poseDetectionService = poseDetector,
        _performanceMonitor = performanceMonitor,
        _metricsController = StreamController<PoseMetrics>.broadcast();

  /// Stream of real-time pose metrics
  ///
  /// Emits PoseMetrics at ~30fps when analyzing frames.
  /// Errors are emitted when camera unavailable or ML Kit fails.
  Stream<PoseMetrics> get metricsStream => _metricsController.stream;

  /// Analyzes a stream of frames and returns enriched pose metrics with
  /// rep counting and form analysis.
  ///
  /// The stream continuously processes frames, updating rep counts and
  /// detecting form errors in real-time.
  ///
  /// Parameters:
  /// - [frames]: Stream of FrameData from camera or video
  ///
  /// Returns:
  /// Stream of PoseMetrics with real-time rep counts, form scores, and errors
  Stream<PoseMetrics> analyzeFrames(Stream<FrameData> frames) async* {
    await for (final analysisResult in _poseDetectionService.analyzeFrames(
      frames,
    )) {
      // Convert PoseAnalysisResult to initial PoseMetrics
      final landmarks = analysisResult.landmarks;
      final angles = analysisResult.angles;

      // Calculate exercise phase based on movement
      final currentPhase = _calculateExercisePhase(angles, landmarks);

      // Update rep counter based on phase transitions
      _updateRepCounter(currentPhase);

      // Detect form errors using current pose data
      final formErrors = _detectFormErrors(angles, landmarks);

      // Calculate overall form score based on errors
      final formScore = _calculateFormScore(formErrors);

      // Build enriched PoseMetrics (wrapped in performance tracking)
      final metrics = await _performanceMonitor.trackLatency(
        'local_pose_analysis',
        () async {
          return PoseMetrics(
            landmarks: landmarks,
            angles: angles,
            confidence: _calculateConfidence(landmarks),
            timestamp: DateTime.now(),
            exerciseType: exerciseType,
            repCount: _currentRepCount,
            formScore: formScore,
            userRequestedFeedback: false, // Can be set by caller if needed
            currentPhase: currentPhase,
          );
        },
      );

      // Emit to broadcast stream
      _metricsController.add(metrics);

      yield metrics;
    }
  }

  /// Updates the rep counter based on exercise phase transitions.
  ///
  /// A rep is counted when the user completes a full cycle:
  /// none -> up -> down -> (back to starting position)
  ///
  /// This method tracks phase transitions and increments the counter
  /// when a complete rep cycle is detected.
  void _updateRepCounter(ExercisePhase currentPhase) {
    // Update current phase for next iteration
    _currentPhase = currentPhase;

    // Track phase progression
    if (currentPhase == ExercisePhase.up) {
      _inUpPhase = true;
    } else if (currentPhase == ExercisePhase.down && _inUpPhase) {
      _inDownPhase = true;
    } else if (currentPhase == ExercisePhase.none &&
        _inUpPhase &&
        _inDownPhase) {
      // Complete rep detected: up -> down -> back to start
      _currentRepCount++;
      _inUpPhase = false;
      _inDownPhase = false;
      _currentPhase = ExercisePhase.setCompleted;

      // Reset to none after brief completion marker
      Future.delayed(const Duration(milliseconds: 300), () {
        if (_currentPhase == ExercisePhase.setCompleted) {
          _currentPhase = ExercisePhase.none;
        }
      });
    }
  }

  /// Calculates the current exercise phase based on joint angles and landmarks.
  ///
  /// This method analyzes movement patterns to determine if the user is in
  /// the up phase, down phase, hold phase, or resting position.
  ///
  /// The logic varies by exercise type:
  /// - Bicep curls: Monitor elbow angle
  /// - Squats: Monitor knee and hip angles
  /// - Bench press: Monitor elbow and shoulder angles
  ///
  /// Returns the detected ExercisePhase
  ExercisePhase _calculateExercisePhase(
    Map<String, double> angles,
    Map<MoveNetKeypoint, MoveNetLandmark> landmarks,
  ) {
    // Get the key angle for this exercise type
    final keyAngle = _getKeyAngleForExercise(angles);

    if (keyAngle == null) {
      return ExercisePhase.none;
    }

    // Calculate normalized position (0.0 = fully extended, 1.0 = fully contracted)
    final normalizedPosition = _normalizeAngle(keyAngle);

    // Detect movement velocity (change since last frame)
    final velocity = (normalizedPosition - _lastKeyAngle).abs();
    _lastKeyAngle = normalizedPosition;

    // If not moving significantly, check for hold
    if (velocity < _movementVelocityThreshold) {
      // Consider it a hold if in contracted position
      if (normalizedPosition > 0.6) {
        return ExercisePhase.hold;
      }
      return ExercisePhase.none;
    }

    // Determine phase based on position and direction
    if (normalizedPosition > _upPhaseThreshold) {
      return ExercisePhase.up;
    } else if (normalizedPosition < _downPhaseThreshold) {
      return ExercisePhase.down;
    }

    // In transition zone, maintain previous phase
    return _currentPhase;
  }

  /// Gets the primary angle to monitor for the current exercise type.
  ///
  /// Different exercises track different joint angles:
  /// - Bicep curl: Elbow angle
  /// - Squat: Knee angle
  /// - Shoulder press: Shoulder angle
  double? _getKeyAngleForExercise(Map<String, double> angles) {
    switch (exerciseType.toLowerCase()) {
      case 'bicep_curl':
      case 'bicep curl':
        return angles['leftElbow'] ?? angles['rightElbow'];

      case 'squat':
        return angles['leftKnee'] ?? angles['rightKnee'];

      case 'shoulder_press':
      case 'overhead_press':
        return angles['leftShoulder'] ?? angles['rightShoulder'];

      case 'bench_press':
        return angles['leftElbow'] ?? angles['rightElbow'];

      case 'deadlift':
        return angles['leftHip'] ?? angles['rightHip'];

      default:
        // Default to elbow angle if exercise type unknown
        return angles['leftElbow'] ?? angles['rightElbow'];
    }
  }

  /// Normalizes an angle to a 0-1 range for phase detection.
  ///
  /// Converts joint angles to a standardized range where:
  /// - 0.0 = fully extended position
  /// - 1.0 = fully contracted position
  ///
  /// This normalization allows consistent phase detection across exercises.
  double _normalizeAngle(double angle) {
    // Typical joint angles range from ~30° (contracted) to ~180° (extended)
    // Normalize to 0-1 range, where 1.0 is contracted
    const minAngle = 30.0;
    const maxAngle = 180.0;

    final clamped = angle.clamp(minAngle, maxAngle);
    final normalized = (maxAngle - clamped) / (maxAngle - minAngle);

    return normalized;
  }

  /// Detects form errors in the current pose using heuristic rules.
  ///
  /// This method implements basic form checking for common exercise mistakes:
  /// - Knee valgus (knees caving in during squats)
  /// - Excessive elbow flare (arms too wide during presses)
  /// - Hip alignment issues
  /// - Back angle problems
  ///
  /// Returns a list of FormError objects describing detected issues
  List<FormError> _detectFormErrors(
    Map<String, double> angles,
    Map<MoveNetKeypoint, MoveNetLandmark> landmarks,
  ) {
    final errors = <FormError>[];

    // Check for knee valgus (knees caving in)
    final kneeValgusError = _detectKneeValgus(landmarks);
    if (kneeValgusError != null) {
      errors.add(kneeValgusError);
    }

    // Check for excessive elbow flare
    final elbowFlareError = _detectElbowFlare(angles);
    if (elbowFlareError != null) {
      errors.add(elbowFlareError);
    }

    // Check for hip alignment issues
    final hipAlignmentError = _detectHipAlignment(landmarks);
    if (hipAlignmentError != null) {
      errors.add(hipAlignmentError);
    }

    // Check for back angle problems
    final backAngleError = _detectBackAngle(angles, landmarks);
    if (backAngleError != null) {
      errors.add(backAngleError);
    }

    return errors;
  }

  /// Detects knee valgus (knees caving inward) during exercises like squats.
  ///
  /// Checks if the horizontal distance between knees is less than expected
  /// relative to hip width, indicating potential knee collapse.
  FormError? _detectKneeValgus(
    Map<MoveNetKeypoint, MoveNetLandmark> landmarks,
  ) {
    final leftKnee = landmarks[MoveNetKeypoint.leftKnee];
    final rightKnee = landmarks[MoveNetKeypoint.rightKnee];
    final leftHip = landmarks[MoveNetKeypoint.leftHip];
    final rightHip = landmarks[MoveNetKeypoint.rightHip];

    if (leftKnee == null ||
        rightKnee == null ||
        leftHip == null ||
        rightHip == null) {
      return null;
    }

    // Calculate hip width and knee width
    final hipWidth = (leftHip.x - rightHip.x).abs();
    final kneeWidth = (leftKnee.x - rightKnee.x).abs();

    // Knees should be roughly as wide as hips (allow 10% variance)
    final kneeToHipRatio = kneeWidth / hipWidth;

    if (kneeToHipRatio < 0.85) {
      return FormError(
        errorType: 'knee_valgus',
        severity: ErrorSeverity.dangerous,
        bodyPart: 'knees',
        suggestedCorrection:
            'Push your knees outward to align with your hips. '
            'Avoid letting them cave inward.',
        detectedValue: kneeToHipRatio * 100,
        idealRange: '90-110%',
      );
    }

    return null;
  }

  /// Detects excessive elbow flare during pressing movements.
  ///
  /// Checks if elbow angle is too wide, which can stress shoulder joints
  /// and reduce pressing efficiency.
  FormError? _detectElbowFlare(Map<String, double> angles) {
    final leftElbow = angles['leftElbow'];
    final rightElbow = angles['rightElbow'];

    if (leftElbow == null && rightElbow == null) {
      return null;
    }

    // For bench press and similar movements, elbows should be 45-75° from torso
    // Excessive flare is > 90° angle at the elbow when viewed from above
    final maxElbow = math.max(leftElbow ?? 0, rightElbow ?? 0);

    if (maxElbow > 110.0) {
      return FormError(
        errorType: 'excessive_elbow_flare',
        severity: ErrorSeverity.moderate,
        bodyPart: 'elbows',
        suggestedCorrection:
            'Keep your elbows at a 45-degree angle from your body. '
            'Avoid flaring them out too wide.',
        detectedValue: maxElbow,
        idealRange: '85-95 degrees',
      );
    }

    return null;
  }

  /// Detects hip alignment issues during exercises.
  ///
  /// Checks if hips are level and properly aligned, which is critical
  /// for preventing lower back strain and ensuring balanced strength development.
  FormError? _detectHipAlignment(
    Map<MoveNetKeypoint, MoveNetLandmark> landmarks,
  ) {
    final leftHip = landmarks[MoveNetKeypoint.leftHip];
    final rightHip = landmarks[MoveNetKeypoint.rightHip];

    if (leftHip == null || rightHip == null) {
      return null;
    }

    // Check if hips are level (Y coordinates should be similar)
    final hipLevelDifference = (leftHip.y - rightHip.y).abs();

    // If difference is > 5% of frame height, hips are not level
    if (hipLevelDifference > 0.05) {
      return FormError(
        errorType: 'uneven_hips',
        severity: ErrorSeverity.moderate,
        bodyPart: 'hips',
        suggestedCorrection:
            'Keep your hips level. One hip appears higher than the other.',
        detectedValue: hipLevelDifference * 100,
        idealRange: '0-3%',
      );
    }

    return null;
  }

  /// Detects back angle problems during exercises.
  ///
  /// Checks if back is excessively rounded or arched, which can lead
  /// to injury during heavy lifts.
  FormError? _detectBackAngle(
    Map<String, double> angles,
    Map<MoveNetKeypoint, MoveNetLandmark> landmarks,
  ) {
    final shoulder =
        landmarks[MoveNetKeypoint.leftShoulder] ??
        landmarks[MoveNetKeypoint.rightShoulder];
    final hip =
        landmarks[MoveNetKeypoint.leftHip] ??
        landmarks[MoveNetKeypoint.rightHip];

    if (shoulder == null || hip == null) {
      return null;
    }

    // Calculate back angle relative to vertical
    final backAngle = _calculateBackAngle(shoulder, hip);

    // For exercises like squats and deadlifts, back should be neutral
    // Excessive forward lean (> 60°) or excessive extension (< 10°) is problematic
    if (exerciseType.toLowerCase().contains('squat') ||
        exerciseType.toLowerCase().contains('deadlift')) {
      if (backAngle < 10.0) {
        return FormError(
          errorType: 'excessive_back_extension',
          severity: ErrorSeverity.dangerous,
          bodyPart: 'back',
          suggestedCorrection:
              'Avoid excessive back arching. '
              'Keep your spine in a neutral position.',
          detectedValue: backAngle,
          idealRange: '15-45 degrees',
        );
      } else if (backAngle > 60.0) {
        return FormError(
          errorType: 'excessive_forward_lean',
          severity: ErrorSeverity.moderate,
          bodyPart: 'back',
          suggestedCorrection:
              'Keep your chest up and back straighter. '
              'You are leaning too far forward.',
          detectedValue: backAngle,
          idealRange: '15-45 degrees',
        );
      }
    }

    return null;
  }

  /// Calculates the back angle relative to vertical using shoulder and hip positions.
  double _calculateBackAngle(MoveNetLandmark shoulder, MoveNetLandmark hip) {
    final dx = (shoulder.x - hip.x).abs();
    final dy = (shoulder.y - hip.y).abs();

    // Calculate angle from vertical (0° = perfectly upright)
    final angleRad = math.atan2(dx, dy);
    final angleDeg = angleRad * 180 / math.pi;

    return angleDeg;
  }

  /// Calculates overall form score based on detected errors.
  ///
  /// Starts with a perfect score of 100.0 and deducts points based on
  /// error severity:
  /// - Dangerous errors: -25 points
  /// - Moderate errors: -15 points
  /// - Minor errors: -5 points
  ///
  /// Returns a score from 0.0 to 100.0
  double _calculateFormScore(List<FormError> errors) {
    double score = 100.0;

    for (final error in errors) {
      switch (error.severity) {
        case ErrorSeverity.dangerous:
          score -= 25.0;
          break;
        case ErrorSeverity.moderate:
          score -= 15.0;
          break;
        case ErrorSeverity.minor:
          score -= 5.0;
          break;
      }
    }

    // Clamp to 0-100 range
    return score.clamp(0.0, 100.0);
  }

  /// Calculates overall pose confidence based on landmark detection quality.
  ///
  /// Averages the confidence scores of all detected landmarks to determine
  /// how reliable the current pose estimation is.
  double _calculateConfidence(Map<MoveNetKeypoint, MoveNetLandmark> landmarks) {
    if (landmarks.isEmpty) {
      return 0.0;
    }

    final totalConfidence = landmarks.values.fold(
      0.0,
      (sum, landmark) => sum + landmark.confidence,
    );

    return totalConfidence / landmarks.length;
  }

  /// Resets the rep counter and analysis state.
  ///
  /// Call this when starting a new exercise set or switching exercises.
  void reset() {
    _currentRepCount = 0;
    _currentPhase = ExercisePhase.none;
    _lastKeyAngle = 0.0;
    _inUpPhase = false;
    _inDownPhase = false;
    _detectedErrors.clear();
  }

  /// Gets the current rep count.
  int get currentRepCount => _currentRepCount;

  /// Gets the current exercise phase.
  ExercisePhase get currentPhase => _currentPhase;

  /// Disposes of resources used by this analyzer.
  void dispose() {
    // Clean up any resources
    _detectedErrors.clear();
    _metricsController.close();
  }
}
