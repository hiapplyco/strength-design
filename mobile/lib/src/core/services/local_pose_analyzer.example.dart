/// Example usage of LocalPoseAnalyzer service
///
/// This file demonstrates how to use LocalPoseAnalyzer for real-time
/// pose analysis with rep counting and form error detection.
library;

import 'dart:async';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'local_pose_analyzer.dart';
import 'pose_detection_service.dart';
import 'performance_monitor.dart';
import 'frame_data.dart';
import '../../features/pose_analysis/domain/entities/pose_metrics.dart';
import '../../features/pose_analysis/domain/entities/exercise_phase.dart';

/// Example 1: Basic setup for analyzing camera frames
///
/// This shows how to initialize the analyzer and process camera frames
/// for real-time rep counting during an exercise.
Future<void> exampleBasicUsage() async {
  // Initialize dependencies
  final poseDetectionService = PoseDetectionService();
  await poseDetectionService.initialize();
  final performanceMonitor = PerformanceMonitor();

  // Create analyzer for a specific exercise
  final analyzer = LocalPoseAnalyzer(
    poseDetector: poseDetectionService,
    performanceMonitor: performanceMonitor,
    exerciseType: 'bicep_curl',
  );

  // Create a stream of frames (in practice, this comes from camera)
  final frameController = StreamController<FrameData>();

  // Start analyzing frames
  final metricsStream = analyzer.analyzeFrames(frameController.stream);

  // Listen to metrics and update UI
  await for (final metrics in metricsStream) {
    // NOTE: Use a logging framework (e.g., logger package) instead of print
    // logger.d('Rep: ${metrics.repCount}');
    // logger.d('Phase: ${metrics.currentPhase.displayName}');
    // logger.d('Form Score: ${metrics.formScore}');
    // logger.d('Confidence: ${metrics.confidence}');

    // Check for form errors
    // (Form errors would be detected and included in the metrics)
  }

  // Clean up when done
  analyzer.dispose();
  poseDetectionService.dispose();
}

/// Example 2: Widget integration for live workout tracking
///
/// Demonstrates how to integrate LocalPoseAnalyzer into a Flutter widget
/// for a live workout screen.
class LiveWorkoutWidget extends StatefulWidget {
  final String exerciseType;

  const LiveWorkoutWidget({
    super.key,
    required this.exerciseType,
  });

  @override
  State<LiveWorkoutWidget> createState() => _LiveWorkoutWidgetState();
}

class _LiveWorkoutWidgetState extends State<LiveWorkoutWidget> {
  late PoseDetectionService _poseService;
  late LocalPoseAnalyzer _analyzer;
  CameraController? _cameraController;
  StreamController<FrameData>? _frameController;

  int _currentReps = 0;
  double _currentFormScore = 100.0;
  ExercisePhase _currentPhase = ExercisePhase.none;

  @override
  void initState() {
    super.initState();
    _initializeServices();
  }

  Future<void> _initializeServices() async {
    // Initialize pose detection service
    _poseService = PoseDetectionService();
    await _poseService.initialize();

    // Create analyzer
    _analyzer = LocalPoseAnalyzer(
      poseDetector: _poseService,
      performanceMonitor: PerformanceMonitor(),
      exerciseType: widget.exerciseType,
    );

    // Initialize camera
    final cameras = await availableCameras();
    _cameraController = CameraController(
      cameras.first,
      ResolutionPreset.medium,
      enableAudio: false,
    );
    await _cameraController!.initialize();

    // Start frame stream
    _frameController = StreamController<FrameData>();
    _startAnalysis();

    setState(() {});
  }

  void _startAnalysis() {
    if (_frameController == null) return;

    // Listen to pose metrics
    _analyzer.analyzeFrames(_frameController!.stream).listen((metrics) {
      setState(() {
        _currentReps = metrics.repCount;
        _currentFormScore = metrics.formScore;
        _currentPhase = metrics.currentPhase;
      });
    });

    // Start streaming camera frames
    _cameraController!.startImageStream((CameraImage image) {
      // Convert CameraImage to FrameData
      final frameData = FrameData(
        bytes: image.planes[0].bytes,
        width: image.width,
        height: image.height,
        format: 'yuv420',
        rotation: 0,
      );

      // Add to stream
      _frameController!.add(frameData);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return const Center(child: CircularProgressIndicator());
    }

    return Stack(
      children: [
        // Camera preview
        CameraPreview(_cameraController!),

        // Rep counter overlay
        Positioned(
          top: 40,
          left: 0,
          right: 0,
          child: Center(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$_currentReps',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 72,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Text(
                    'REPS',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 16,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        // Phase indicator
        Positioned(
          top: 200,
          left: 20,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: _getPhaseColor().withValues(alpha: 0.9),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              _currentPhase.displayName.toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),

        // Form score indicator
        Positioned(
          bottom: 100,
          left: 0,
          right: 0,
          child: Center(
            child: Container(
              width: 200,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'FORM SCORE',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${_currentFormScore.toStringAsFixed(0)}%',
                    style: TextStyle(
                      color: _getFormScoreColor(),
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(
                    value: _currentFormScore / 100,
                    backgroundColor: Colors.white24,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      _getFormScoreColor(),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Color _getPhaseColor() {
    switch (_currentPhase) {
      case ExercisePhase.up:
        return Colors.green;
      case ExercisePhase.down:
        return Colors.blue;
      case ExercisePhase.hold:
        return Colors.orange;
      case ExercisePhase.setCompleted:
        return Colors.purple;
      case ExercisePhase.rest:
        return Colors.grey;
      case ExercisePhase.none:
        return Colors.blueGrey;
    }
  }

  Color _getFormScoreColor() {
    if (_currentFormScore >= 85) {
      return Colors.green;
    } else if (_currentFormScore >= 70) {
      return Colors.orange;
    } else {
      return Colors.red;
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _frameController?.close();
    _analyzer.dispose();
    _poseService.dispose();
    super.dispose();
  }
}

/// Example 3: Processing a video file for form analysis
///
/// Shows how to analyze a recorded workout video and generate a
/// detailed form report.
Future<void> exampleVideoAnalysis(String videoPath) async {
  // Initialize services
  final poseService = PoseDetectionService();
  await poseService.initialize();

  final analyzer = LocalPoseAnalyzer(
    poseDetector: poseService,
    performanceMonitor: PerformanceMonitor(),
    exerciseType: 'squat',
  );

  // In practice, you would extract frames from the video file
  // For this example, assume we have a stream of frames
  final frameController = StreamController<FrameData>();

  final metricsHistory = <PoseMetrics>[];

  // Collect all metrics
  await for (final metrics in analyzer.analyzeFrames(frameController.stream)) {
    metricsHistory.add(metrics);
  }

  // Generate form report
  final report = _generateFormReport(metricsHistory);
  // NOTE: Use a logging framework instead of print
  // logger.i(report);

  // Clean up
  analyzer.dispose();
  poseService.dispose();
}

String _generateFormReport(List<PoseMetrics> history) {
  if (history.isEmpty) {
    return 'No data available';
  }

  final totalReps = history.last.repCount;
  final avgFormScore =
      history.map((m) => m.formScore).reduce((a, b) => a + b) / history.length;
  final avgConfidence = history.map((m) => m.confidence).reduce((a, b) => a + b) /
      history.length;

  return '''
=== Form Analysis Report ===

Exercise: ${history.first.exerciseType}
Total Reps: $totalReps
Average Form Score: ${avgFormScore.toStringAsFixed(1)}%
Average Confidence: ${(avgConfidence * 100).toStringAsFixed(1)}%

Analysis Duration: ${history.length} frames
Frame Rate: ${history.length / 60}fps (approx)

Recommendations:
${_getRecommendations(avgFormScore)}
''';
}

String _getRecommendations(double avgFormScore) {
  if (avgFormScore >= 90) {
    return '✓ Excellent form! Keep up the great work.';
  } else if (avgFormScore >= 75) {
    return '• Good form with room for improvement.\n'
        '• Focus on maintaining consistent technique throughout the set.';
  } else if (avgFormScore >= 60) {
    return '• Form needs attention.\n'
        '• Review proper technique guidelines.\n'
        '• Consider reducing weight to master form first.';
  } else {
    return '⚠ Form issues detected.\n'
        '• Strongly recommend working with a trainer.\n'
        '• Focus on learning proper movement patterns.\n'
        '• Reduce weight significantly until form improves.';
  }
}

/// Example 4: Custom exercise configuration
///
/// Demonstrates how to use LocalPoseAnalyzer with different exercise types
/// and customize the analysis parameters.
class ExerciseAnalysisConfig {
  final String exerciseType;
  final double confidenceThreshold;
  final bool enableFormChecking;

  ExerciseAnalysisConfig({
    required this.exerciseType,
    this.confidenceThreshold = 0.5,
    this.enableFormChecking = true,
  });
}

Future<void> exampleCustomConfiguration() async {
  final configs = [
    ExerciseAnalysisConfig(exerciseType: 'bicep_curl'),
    ExerciseAnalysisConfig(exerciseType: 'squat'),
    ExerciseAnalysisConfig(exerciseType: 'bench_press'),
    ExerciseAnalysisConfig(exerciseType: 'shoulder_press'),
  ];

  final poseService = PoseDetectionService();
  await poseService.initialize();

  for (final config in configs) {
    final analyzer = LocalPoseAnalyzer(
      poseDetector: poseService,
      performanceMonitor: PerformanceMonitor(),
      exerciseType: config.exerciseType,
    );

    // NOTE: Use a logging framework instead of print
    // logger.d('Analyzing ${config.exerciseType}...');
    // Process frames for this exercise type
    // ...

    analyzer.dispose();
  }

  poseService.dispose();
}

/// Example 5: Resetting the analyzer between sets
///
/// Shows how to reset rep counting when starting a new set or
/// switching exercises.
Future<void> exampleMultipleSetTracking() async {
  final poseService = PoseDetectionService();
  await poseService.initialize();

  final analyzer = LocalPoseAnalyzer(
    poseDetector: poseService,
    performanceMonitor: PerformanceMonitor(),
    exerciseType: 'bicep_curl',
  );

  // Set 1
  // NOTE: Use a logging framework instead of print
  // logger.i('=== Starting Set 1 ===');
  // ... process frames for set 1

  // After set 1 completes
  final set1Reps = analyzer.currentRepCount;
  // logger.i('Set 1 completed: $set1Reps reps');

  // Reset for Set 2
  analyzer.reset();
  // logger.i('=== Starting Set 2 ===');
  // ... process frames for set 2

  final set2Reps = analyzer.currentRepCount;
  // logger.i('Set 2 completed: $set2Reps reps');

  // Reset for Set 3
  analyzer.reset();
  // logger.i('=== Starting Set 3 ===');
  // ... process frames for set 3

  final set3Reps = analyzer.currentRepCount;
  // logger.i('Set 3 completed: $set3Reps reps');

  // logger.i('Total workout: ${set1Reps + set2Reps + set3Reps} reps');

  analyzer.dispose();
  poseService.dispose();
}
