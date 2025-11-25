import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../../../core/providers/service_providers.dart';
import '../../../../core/services/webrtc_service.dart';
import '../../../../core/services/gemini_live_service.dart';
import '../../../../core/services/pose_detection_service.dart';
import '../../../../core/services/frame_data.dart';
import '../../domain/entities/analysis_result.dart';

// TODO: Move providers to a separate file
final currentPoseProvider = StateProvider<PoseAnalysisResult?>((ref) => null);
final aiFeedbackProvider = StateProvider((ref) => '');
final formScoreProvider = StateProvider((ref) => 0.0);

class LiveStreamingScreen extends ConsumerStatefulWidget {
  const LiveStreamingScreen({super.key});

  @override
  ConsumerState<LiveStreamingScreen> createState() => _LiveStreamingScreenState();
}

class _LiveStreamingScreenState extends ConsumerState<LiveStreamingScreen> {
  late WebRTCService _webrtcService;
  late GeminiLiveService _geminiLiveService;
  late PoseDetectionService _poseDetectionService; // Declare PoseDetectionService
  StreamSubscription? _frameSubscription;
  StreamSubscription? _poseSubscription;

  @override
  void initState() {
    super.initState();
    _webrtcService = ref.read(webRTCServiceProvider);
    _geminiLiveService = ref.read(geminiLiveProvider);
    _poseDetectionService = ref.read(poseDetectionProvider); // Initialize PoseDetectionService

    _initializeServices();
  }

  Future<void> _initializeServices() async {
    await _webrtcService.initialize();
    await _geminiLiveService.connect();

    _frameSubscription = _webrtcService.extractFrames().listen((frame) {
      _geminiLiveService.streamVideoFrame(frame);
    });

    // Listen to pose analysis results
    // Convert raw frames to FrameData for pose detection
    _poseSubscription = _poseDetectionService.analyzeFrames(
      _webrtcService.extractFrames().map((frame) => FrameData(
        bytes: frame,
        width: 640, // TODO: Get actual size from camera
        height: 480,
        rotation: 0,
        format: 'rgba', // TODO: Determine actual format from camera
      )),
    ).listen((poseResult) {
      // Update providers with pose analysis results
      ref.read(currentPoseProvider.notifier).state = poseResult;
      ref.read(formScoreProvider.notifier).state = poseResult.formScore;
    });
  }

  @override
  void dispose() {
    _frameSubscription?.cancel();
    _poseSubscription?.cancel();
    _webrtcService.dispose();
    _geminiLiveService.dispose();
    _poseDetectionService.dispose(); // Dispose PoseDetectionService
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Video preview
          RTCVideoView(_webrtcService.localRenderer),

          // Pose overlay
          CustomPaint(
            painter: PoseOverlayPainter(
              ref.watch(currentPoseProvider),
            ),
          ),

          // AI feedback UI
          Positioned(
            bottom: 100,
            left: 20,
            right: 20,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text(ref.watch(aiFeedbackProvider)),
                    LinearProgressIndicator(
                      value: ref.watch(formScoreProvider),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Controls
          Positioned(
            bottom: 20,
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.flip_camera_ios),
                  onPressed: () => _webrtcService.switchCamera(),
                ),
                IconButton(
                  icon: const Icon(Icons.stop),
                  onPressed: () => _stopSession(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _stopSession() {
    // TODO: Implement stop session
  }
}

class PoseOverlayPainter extends CustomPainter {
  final PoseAnalysisResult? poseResult;

  PoseOverlayPainter(this.poseResult);

  @override
  void paint(Canvas canvas, Size size) {
    if (poseResult == null) return;

    final paint = Paint()
      ..color = Colors.red
      ..strokeWidth = 5
      ..style = PaintingStyle.fill;

    for (final landmark in poseResult!.landmarks.values) {
      canvas.drawCircle(
        Offset(landmark.x * size.width, landmark.y * size.height),
        5,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant PoseOverlayPainter oldDelegate) {
    return oldDelegate.poseResult != poseResult;
  }
}
