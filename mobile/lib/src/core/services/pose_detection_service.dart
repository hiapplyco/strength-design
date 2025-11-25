import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:tflite_flutter/tflite_flutter.dart';
import '../../features/pose_analysis/domain/entities/analysis_result.dart';
import '../../features/pose_analysis/domain/entities/movenet_landmark.dart';
import '../utils/image_preprocessing.dart';
import 'frame_data.dart';

/// Pose detection service using TensorFlow Lite MoveNet Thunder model
///
/// Detects 17 body keypoints from video frames and calculates joint angles
/// for exercise form analysis.
class PoseDetectionService {
  static const String _modelPath = 'assets/models/movenet_thunder.tflite';
  static const int _inputSize = 256;
  static const int _numKeypoints = 17;
  static const double _confidenceThreshold = 0.5;

  Interpreter? _interpreter;
  bool _isInitialized = false;

  /// Initialize the TensorFlow Lite interpreter with MoveNet model
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      _interpreter = await Interpreter.fromAsset(_modelPath);
      _isInitialized = true;
      debugPrint('MoveNet model loaded successfully');
    } catch (e) {
      debugPrint('Error loading MoveNet model: $e');
      debugPrint('Make sure movenet_thunder.tflite is in assets/models/');
      rethrow;
    }
  }

  /// Analyze a stream of frames and yield pose analysis results
  ///
  /// Processes each frame through MoveNet, extracts keypoints, calculates
  /// joint angles, and evaluates exercise form.
  Stream<PoseAnalysisResult> analyzeFrames(Stream<FrameData> frames) async* {
    if (!_isInitialized) {
      await initialize();
    }

    await for (final frame in frames) {
      try {
        // Convert YUV to RGBA if needed
        Uint8List rgbaBytes = frame.bytes;
        int width = frame.width;
        int height = frame.height;

        if (frame.format == 'yuv420') {
          rgbaBytes = ImagePreprocessing.yuv420ToRgba(
            yuvBytes: frame.bytes,
            width: frame.width,
            height: frame.height,
          );
        }

        // Handle rotation if needed
        if (frame.rotation != 0) {
          rgbaBytes = ImagePreprocessing.rotateRgba(
            rgbaBytes: rgbaBytes,
            width: width,
            height: height,
            degrees: frame.rotation,
          );

          // Swap dimensions for 90/270 degree rotations
          if (frame.rotation == 90 || frame.rotation == 270) {
            final temp = width;
            width = height;
            height = temp;
          }
        }

        // Run pose detection and analysis in isolate
        final result = await compute(
          _analyzePoseInIsolate,
          _IsolateData(
            interpreter: _interpreter!,
            rgbaBytes: rgbaBytes,
            width: width,
            height: height,
          ),
        );

        if (result != null) {
          yield result;
        }
      } catch (e) {
        debugPrint('Error analyzing frame: $e');
        // Continue processing next frame
      }
    }
  }

  /// Heavy computation in isolate to avoid blocking UI thread
  static Future<PoseAnalysisResult?> _analyzePoseInIsolate(
    _IsolateData data,
  ) async {
    try {
      // Preprocess image for MoveNet
      final input = ImagePreprocessing.preprocessForMoveNet(
        rgbaBytes: data.rgbaBytes,
        originalWidth: data.width,
        originalHeight: data.height,
        targetSize: _inputSize,
      );

      // Prepare output tensor: [1, 1, 17, 3]
      final output = [
        List.generate(
          1,
          (_) => List.generate(
            _numKeypoints,
            (_) => List.filled(3, 0.0),
          ),
        ),
      ];

      // Run inference
      data.interpreter.run(input, output);

      // Extract keypoints from output
      final landmarks = _extractLandmarks(output[0][0], data.width, data.height);

      // Filter by confidence threshold
      final validLandmarks = landmarks.entries.where(
        (entry) => entry.value.confidence >= _confidenceThreshold,
      );

      if (validLandmarks.isEmpty) {
        return null; // No confident detections
      }

      // Calculate joint angles
      final angles = _calculateJointAngles(landmarks);

      // Evaluate form score
      final formScore = _evaluateForm(angles);

      // Detect rep phase
      final repPhase = _detectRepPhase(angles);

      return PoseAnalysisResult(
        angles: angles,
        formScore: formScore,
        repPhase: repPhase,
        landmarks: landmarks,
      );
    } catch (e) {
      debugPrint('Error in pose analysis isolate: $e');
      return null;
    }
  }

  /// Extract landmarks from MoveNet output tensor
  ///
  /// Output format: [1, 17, 3] where each keypoint has [y, x, confidence]
  /// Coordinates are normalized (0-1) and need to be denormalized.
  static Map<MoveNetKeypoint, MoveNetLandmark> _extractLandmarks(
    List<List<double>> output,
    int imageWidth,
    int imageHeight,
  ) {
    final landmarks = <MoveNetKeypoint, MoveNetLandmark>{};

    for (int i = 0; i < _numKeypoints; i++) {
      final keypoint = MoveNetKeypoint.values[i];
      final y = output[i][0]; // Normalized y (0-1)
      final x = output[i][1]; // Normalized x (0-1)
      final confidence = output[i][2]; // Confidence score (0-1)

      landmarks[keypoint] = MoveNetLandmark(
        keypoint: keypoint,
        x: x,
        y: y,
        confidence: confidence,
      );
    }

    return landmarks;
  }

  /// Calculate joint angles from detected landmarks
  ///
  /// Computes angles for major joints: elbows, knees, hips, shoulders
  static Map<String, double> _calculateJointAngles(
    Map<MoveNetKeypoint, MoveNetLandmark> landmarks,
  ) {
    final angles = <String, double>{};

    // Helper to safely get landmark
    MoveNetLandmark? getLandmark(MoveNetKeypoint kp) {
      final landmark = landmarks[kp];
      return landmark != null && landmark.confidence >= _confidenceThreshold
          ? landmark
          : null;
    }

    // Left elbow angle
    final leftShoulder = getLandmark(MoveNetKeypoint.leftShoulder);
    final leftElbow = getLandmark(MoveNetKeypoint.leftElbow);
    final leftWrist = getLandmark(MoveNetKeypoint.leftWrist);
    if (leftShoulder != null && leftElbow != null && leftWrist != null) {
      angles['leftElbow'] = _calculateAngle(
        leftShoulder.x,
        leftShoulder.y,
        leftElbow.x,
        leftElbow.y,
        leftWrist.x,
        leftWrist.y,
      );
    }

    // Right elbow angle
    final rightShoulder = getLandmark(MoveNetKeypoint.rightShoulder);
    final rightElbow = getLandmark(MoveNetKeypoint.rightElbow);
    final rightWrist = getLandmark(MoveNetKeypoint.rightWrist);
    if (rightShoulder != null && rightElbow != null && rightWrist != null) {
      angles['rightElbow'] = _calculateAngle(
        rightShoulder.x,
        rightShoulder.y,
        rightElbow.x,
        rightElbow.y,
        rightWrist.x,
        rightWrist.y,
      );
    }

    // Left knee angle
    final leftHip = getLandmark(MoveNetKeypoint.leftHip);
    final leftKnee = getLandmark(MoveNetKeypoint.leftKnee);
    final leftAnkle = getLandmark(MoveNetKeypoint.leftAnkle);
    if (leftHip != null && leftKnee != null && leftAnkle != null) {
      angles['leftKnee'] = _calculateAngle(
        leftHip.x,
        leftHip.y,
        leftKnee.x,
        leftKnee.y,
        leftAnkle.x,
        leftAnkle.y,
      );
    }

    // Right knee angle
    final rightHip = getLandmark(MoveNetKeypoint.rightHip);
    final rightKnee = getLandmark(MoveNetKeypoint.rightKnee);
    final rightAnkle = getLandmark(MoveNetKeypoint.rightAnkle);
    if (rightHip != null && rightKnee != null && rightAnkle != null) {
      angles['rightKnee'] = _calculateAngle(
        rightHip.x,
        rightHip.y,
        rightKnee.x,
        rightKnee.y,
        rightAnkle.x,
        rightAnkle.y,
      );
    }

    // Left shoulder angle (torso-shoulder-elbow)
    if (leftShoulder != null && leftElbow != null && leftHip != null) {
      angles['leftShoulder'] = _calculateAngle(
        leftHip.x,
        leftHip.y,
        leftShoulder.x,
        leftShoulder.y,
        leftElbow.x,
        leftElbow.y,
      );
    }

    // Right shoulder angle (torso-shoulder-elbow)
    if (rightShoulder != null && rightElbow != null && rightHip != null) {
      angles['rightShoulder'] = _calculateAngle(
        rightHip.x,
        rightHip.y,
        rightShoulder.x,
        rightShoulder.y,
        rightElbow.x,
        rightElbow.y,
      );
    }

    // Left hip angle
    if (leftShoulder != null && leftHip != null && leftKnee != null) {
      angles['leftHip'] = _calculateAngle(
        leftShoulder.x,
        leftShoulder.y,
        leftHip.x,
        leftHip.y,
        leftKnee.x,
        leftKnee.y,
      );
    }

    // Right hip angle
    if (rightShoulder != null && rightHip != null && rightKnee != null) {
      angles['rightHip'] = _calculateAngle(
        rightShoulder.x,
        rightShoulder.y,
        rightHip.x,
        rightHip.y,
        rightKnee.x,
        rightKnee.y,
      );
    }

    return angles;
  }

  /// Calculate angle between three points using the law of cosines
  ///
  /// Points: A (x1, y1), B (x2, y2), C (x3, y3)
  /// Returns angle at point B in degrees (0-180)
  static double _calculateAngle(
    double x1,
    double y1,
    double x2,
    double y2,
    double x3,
    double y3,
  ) {
    // Vector BA
    final dx1 = x1 - x2;
    final dy1 = y1 - y2;

    // Vector BC
    final dx2 = x3 - x2;
    final dy2 = y3 - y2;

    // Calculate angle using atan2 for better numerical stability
    final angle1 = math.atan2(dy1, dx1);
    final angle2 = math.atan2(dy2, dx2);

    // Calculate difference and convert to degrees
    var angleDiff = (angle1 - angle2).abs();

    // Normalize to 0-180 degrees
    if (angleDiff > math.pi) {
      angleDiff = 2 * math.pi - angleDiff;
    }

    return angleDiff * 180 / math.pi;
  }

  /// Evaluate overall form score based on joint angles
  ///
  /// Returns a score from 0.0 (poor form) to 1.0 (perfect form)
  static double _evaluateForm(Map<String, double> angles) {
    // TODO: Implement form evaluation logic based on exercise type
    // This is a placeholder that checks for reasonable joint angles

    if (angles.isEmpty) return 0.0;

    double totalScore = 0.0;
    int scoreCount = 0;

    // Check elbow angles (should be in reasonable range for most exercises)
    if (angles.containsKey('leftElbow')) {
      final angle = angles['leftElbow']!;
      // Penalize hyperextension (>180) or extreme flexion (<30)
      totalScore += angle >= 30 && angle <= 180 ? 1.0 : 0.5;
      scoreCount++;
    }

    if (angles.containsKey('rightElbow')) {
      final angle = angles['rightElbow']!;
      totalScore += angle >= 30 && angle <= 180 ? 1.0 : 0.5;
      scoreCount++;
    }

    // Check knee angles
    if (angles.containsKey('leftKnee')) {
      final angle = angles['leftKnee']!;
      totalScore += angle >= 30 && angle <= 180 ? 1.0 : 0.5;
      scoreCount++;
    }

    if (angles.containsKey('rightKnee')) {
      final angle = angles['rightKnee']!;
      totalScore += angle >= 30 && angle <= 180 ? 1.0 : 0.5;
      scoreCount++;
    }

    return scoreCount > 0 ? totalScore / scoreCount : 0.0;
  }

  /// Detect the current phase of a repetition (up, down, or none)
  ///
  /// Uses joint angles to determine exercise phase
  static RepPhase _detectRepPhase(Map<String, double> angles) {
    // TODO: Implement rep phase detection based on exercise type
    // This is a placeholder that uses elbow/knee angles

    // Example: For push-ups or squats, detect based on elbow/knee flexion
    final leftElbow = angles['leftElbow'];
    final rightElbow = angles['rightElbow'];
    final leftKnee = angles['leftKnee'];
    final rightKnee = angles['rightKnee'];

    // If elbows are flexed (<90 degrees), consider it "down" phase
    if (leftElbow != null && leftElbow < 90 || rightElbow != null && rightElbow < 90) {
      return RepPhase.down;
    }

    // If knees are flexed (<90 degrees), consider it "down" phase
    if (leftKnee != null && leftKnee < 90 || rightKnee != null && rightKnee < 90) {
      return RepPhase.down;
    }

    // If joints are extended (>120 degrees), consider it "up" phase
    if (leftElbow != null && leftElbow > 120 || rightElbow != null && rightElbow > 120) {
      return RepPhase.up;
    }

    if (leftKnee != null && leftKnee > 120 || rightKnee != null && rightKnee > 120) {
      return RepPhase.up;
    }

    return RepPhase.none;
  }

  /// Clean up resources
  void dispose() {
    _interpreter?.close();
    _interpreter = null;
    _isInitialized = false;
  }
}

/// Data structure for passing data to isolate
class _IsolateData {
  final Interpreter interpreter;
  final Uint8List rgbaBytes;
  final int width;
  final int height;

  _IsolateData({
    required this.interpreter,
    required this.rgbaBytes,
    required this.width,
    required this.height,
  });
}
