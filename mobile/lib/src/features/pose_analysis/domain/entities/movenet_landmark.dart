/// MoveNet Thunder model keypoint identifiers
///
/// MoveNet detects 17 body keypoints with normalized coordinates (0-1)
/// and confidence scores. This enum maps to the standard COCO keypoint format.
enum MoveNetKeypoint {
  nose,
  leftEye,
  rightEye,
  leftEar,
  rightEar,
  leftShoulder,
  rightShoulder,
  leftElbow,
  rightElbow,
  leftWrist,
  rightWrist,
  leftHip,
  rightHip,
  leftKnee,
  rightKnee,
  leftAnkle,
  rightAnkle,
}

/// Extension to provide string representation for serialization
extension MoveNetKeypointExtension on MoveNetKeypoint {
  String toJson() => toString().split('.').last;

  static MoveNetKeypoint fromJson(String value) {
    return MoveNetKeypoint.values.firstWhere(
      (e) => e.toString().split('.').last == value,
      orElse: () => MoveNetKeypoint.nose,
    );
  }
}

/// Represents a single detected body landmark from MoveNet pose detection
///
/// MoveNet returns normalized coordinates (0-1) for each keypoint along with
/// a confidence score indicating detection certainty.
class MoveNetLandmark {
  /// The body keypoint this landmark represents
  final MoveNetKeypoint keypoint;

  /// Normalized x-coordinate (0.0 = left edge, 1.0 = right edge)
  final double x;

  /// Normalized y-coordinate (0.0 = top edge, 1.0 = bottom edge)
  final double y;

  /// Detection confidence score (0.0 = no confidence, 1.0 = high confidence)
  /// MoveNet typically considers scores > 0.3 as reliable detections
  final double confidence;

  const MoveNetLandmark({
    required this.keypoint,
    required this.x,
    required this.y,
    required this.confidence,
  });

  /// Convert to JSON-serializable map
  Map<String, dynamic> toJson() {
    return {
      'keypoint': keypoint.toJson(),
      'x': x,
      'y': y,
      'confidence': confidence,
    };
  }

  /// Create from JSON map
  factory MoveNetLandmark.fromJson(Map<String, dynamic> json) {
    return MoveNetLandmark(
      keypoint: MoveNetKeypointExtension.fromJson(json['keypoint'] as String),
      x: (json['x'] as num).toDouble(),
      y: (json['y'] as num).toDouble(),
      confidence: (json['confidence'] as num).toDouble(),
    );
  }

  /// Create a copy with optional field replacements
  MoveNetLandmark copyWith({
    MoveNetKeypoint? keypoint,
    double? x,
    double? y,
    double? confidence,
  }) {
    return MoveNetLandmark(
      keypoint: keypoint ?? this.keypoint,
      x: x ?? this.x,
      y: y ?? this.y,
      confidence: confidence ?? this.confidence,
    );
  }

  @override
  String toString() => 'MoveNetLandmark(${keypoint.toJson()}: '
      'x=$x, y=$y, confidence=$confidence)';

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is MoveNetLandmark &&
        other.keypoint == keypoint &&
        other.x == x &&
        other.y == y &&
        other.confidence == confidence;
  }

  @override
  int get hashCode => Object.hash(keypoint, x, y, confidence);
}
