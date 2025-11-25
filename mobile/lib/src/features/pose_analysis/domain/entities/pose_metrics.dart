import 'exercise_phase.dart';
import 'movenet_landmark.dart';

/// Main pose data structure capturing all metrics from a single frame analysis.
///
/// This entity represents the complete pose detection result for an exercise,
/// including detected landmarks, calculated angles, and contextual information
/// like form score, rep count, and current exercise phase.
class PoseMetrics {
  /// Map of detected body landmarks with their positions and confidence scores
  final Map<MoveNetKeypoint, MoveNetLandmark> landmarks;

  /// Calculated joint angles in degrees
  /// Keys are standardized joint identifiers (e.g., 'leftElbow', 'rightKnee')
  final Map<String, double> angles;

  /// Overall confidence score for this pose analysis (0.0 to 1.0)
  final double confidence;

  /// Timestamp when this pose was captured
  final DateTime timestamp;

  /// Type of exercise being performed (e.g., 'bicep_curl', 'squat')
  final String exerciseType;

  /// Number of reps completed so far in the current set
  final int repCount;

  /// Form quality score for this rep (0.0 to 100.0)
  /// Based on how well the user executed the movement
  final double formScore;

  /// Whether the user has requested real-time coaching feedback
  final bool userRequestedFeedback;

  /// Current phase of the rep (up, down, hold, setCompleted, rest, none)
  final ExercisePhase currentPhase;

  PoseMetrics({
    required this.landmarks,
    required this.angles,
    required this.confidence,
    required this.timestamp,
    required this.exerciseType,
    required this.repCount,
    required this.formScore,
    required this.userRequestedFeedback,
    required this.currentPhase,
  });

  /// Convert to JSON-serializable map
  Map<String, dynamic> toJson() {
    return {
      'landmarks': landmarks.map(
        (key, value) => MapEntry(key.toJson(), value.toJson()),
      ),
      'angles': angles,
      'confidence': confidence,
      'timestamp': timestamp.toIso8601String(),
      'exerciseType': exerciseType,
      'repCount': repCount,
      'formScore': formScore,
      'userRequestedFeedback': userRequestedFeedback,
      'currentPhase': currentPhase.toString().split('.').last,
    };
  }

  /// Create from JSON map
  factory PoseMetrics.fromJson(Map<String, dynamic> json) {
    // Deserialize landmarks map
    final landmarksJson = json['landmarks'] as Map<String, dynamic>? ?? {};
    final landmarks = <MoveNetKeypoint, MoveNetLandmark>{};
    landmarksJson.forEach((key, value) {
      final keypoint = MoveNetKeypointExtension.fromJson(key);
      final landmark = MoveNetLandmark.fromJson(value as Map<String, dynamic>);
      landmarks[keypoint] = landmark;
    });

    return PoseMetrics(
      landmarks: landmarks,
      angles: Map<String, double>.from(json['angles'] as Map<String, dynamic>? ?? {}),
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
      timestamp: DateTime.parse(json['timestamp'] as String? ?? DateTime.now().toIso8601String()),
      exerciseType: json['exerciseType'] as String? ?? '',
      repCount: json['repCount'] as int? ?? 0,
      formScore: (json['formScore'] as num?)?.toDouble() ?? 0.0,
      userRequestedFeedback: json['userRequestedFeedback'] as bool? ?? false,
      currentPhase: ExercisePhase.values.firstWhere(
        (phase) => phase.toString().split('.').last == (json['currentPhase'] as String? ?? 'none'),
        orElse: () => ExercisePhase.none,
      ),
    );
  }

  /// Create a copy with optional field replacements
  PoseMetrics copyWith({
    Map<MoveNetKeypoint, MoveNetLandmark>? landmarks,
    Map<String, double>? angles,
    double? confidence,
    DateTime? timestamp,
    String? exerciseType,
    int? repCount,
    double? formScore,
    bool? userRequestedFeedback,
    ExercisePhase? currentPhase,
  }) {
    return PoseMetrics(
      landmarks: landmarks ?? this.landmarks,
      angles: angles ?? this.angles,
      confidence: confidence ?? this.confidence,
      timestamp: timestamp ?? this.timestamp,
      exerciseType: exerciseType ?? this.exerciseType,
      repCount: repCount ?? this.repCount,
      formScore: formScore ?? this.formScore,
      userRequestedFeedback: userRequestedFeedback ?? this.userRequestedFeedback,
      currentPhase: currentPhase ?? this.currentPhase,
    );
  }

  @override
  String toString() => 'PoseMetrics(exercise: $exerciseType, rep: $repCount, '
      'form: $formScore, phase: $currentPhase, confidence: $confidence)';
}
