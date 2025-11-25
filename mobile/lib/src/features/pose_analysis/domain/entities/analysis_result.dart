import 'package:hive/hive.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'movenet_landmark.dart';

part 'analysis_result.g.dart';

enum RepPhase { up, down, none }

@HiveType(typeId: 0)
class PoseAnalysisResult {
  @HiveField(0)
  final Map<String, double> angles;
  @HiveField(1)
  final double formScore;
  @HiveField(2)
  final RepPhase repPhase;
  @HiveField(3)
  final Map<MoveNetKeypoint, MoveNetLandmark> landmarks;

  PoseAnalysisResult({
    required this.angles,
    required this.formScore,
    required this.repPhase,
    required this.landmarks,
  });

  factory PoseAnalysisResult.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;

    // Deserialize landmarks map
    final landmarksJson = data['landmarks'] as Map<String, dynamic>? ?? {};
    final landmarks = <MoveNetKeypoint, MoveNetLandmark>{};
    landmarksJson.forEach((key, value) {
      final keypoint = MoveNetKeypointExtension.fromJson(key);
      final landmark = MoveNetLandmark.fromJson(value as Map<String, dynamic>);
      landmarks[keypoint] = landmark;
    });

    return PoseAnalysisResult(
      angles: Map<String, double>.from(data['angles'] ?? {}),
      formScore: (data['formScore'] ?? 0.0).toDouble(),
      repPhase: RepPhase.values.firstWhere(
          (e) => e.toString() == 'RepPhase.${data['repPhase']}',
          orElse: () => RepPhase.none),
      landmarks: landmarks,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'angles': angles,
      'formScore': formScore,
      'repPhase': repPhase.toString().split('.').last,
      'landmarks': landmarks.map(
        (key, value) => MapEntry(key.toJson(), value.toJson()),
      ),
    };
  }
}