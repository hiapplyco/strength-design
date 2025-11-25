import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../services/gemini_live_service.dart';
import '../services/pose_detection_service.dart';
import '../services/webrtc_service.dart';
import '../services/gemini_trigger_manager.dart';
import '../services/local_pose_analyzer.dart';
import '../services/performance_monitor.dart';
import '../../features/pose_analysis/domain/entities/pose_metrics.dart';
import '../../features/pose_analysis/domain/entities/coaching_feedback.dart';
import '../../features/pose_analysis/domain/entities/exercise_phase.dart';

// ============================================================================
// SERVICE PROVIDERS - Singleton instances of core services
// ============================================================================

/// WebRTC service for real-time communication
/// Used for: Camera streaming, peer-to-peer connections
final webRTCServiceProvider = Provider((ref) => WebRTCService());

/// Gemini Live API service for AI coaching
/// Dependency: Requires GEMINI_API_KEY from environment
final geminiApiKeyProvider = Provider<String>((ref) {
  final apiKey = dotenv.env['GEMINI_API_KEY'];
  if (apiKey == null) {
    throw Exception('GEMINI_API_KEY not found in .env file');
  }
  return apiKey;
});

final geminiLiveProvider = Provider((ref) {
  final apiKey = ref.watch(geminiApiKeyProvider);
  return GeminiLiveService(apiKey: apiKey);
});

/// On-device pose detection service (TensorFlow Lite MoveNet)
/// Used for: Real-time pose landmark detection at 30fps
/// Model: MoveNet Thunder (Float16 quantized)
final poseDetectionProvider = Provider((ref) => PoseDetectionService());

/// Performance monitoring service
/// Tracks: Latency metrics, frame rates, API call frequency
/// Used for: Optimization and debugging performance issues
final performanceMonitorProvider = Provider((ref) => PerformanceMonitor());

/// Gemini API trigger manager
/// Implements smart throttling logic to optimize API costs
/// Triggers Gemini calls based on:
/// - Priority 1: Safety issues (always)
/// - Priority 2: User requests
/// - Priority 3: Set completion
/// - Priority 4: Regular cadence (every 5 reps or 30s)
/// - Priority 5: Persistent form errors
final geminiTriggerManagerProvider = Provider((ref) => GeminiTriggerManager());

/// Local pose analyzer - Hybrid architecture core
/// Dependencies:
/// - poseDetectionProvider: For TensorFlow Lite MoveNet pose detection
/// - performanceMonitorProvider: For latency tracking
/// Outputs: Stream of PoseMetrics with real-time analysis
final localPoseAnalyzerProvider = Provider((ref) {
  final poseDetection = ref.watch(poseDetectionProvider);
  final performanceMonitor = ref.watch(performanceMonitorProvider);
  return LocalPoseAnalyzer(
    poseDetector: poseDetection,
    performanceMonitor: performanceMonitor,
    exerciseType: 'bicep_curl', // Default, can be overridden by UI
  );
});

// ============================================================================
// STATE PROVIDERS - UI state management for pose analysis
// ============================================================================

/// Current pose metrics from local analyzer
/// Updated at 30fps with real-time pose data
/// Null when no pose detected or analysis not active
final currentPoseMetricsProvider = StateProvider<PoseMetrics?>((ref) => null);

/// Latest coaching feedback from Gemini
/// Updated when Gemini API returns coaching response
/// Null when no feedback available
final coachingFeedbackProvider = StateProvider<CoachingFeedback?>((ref) => null);

/// Current exercise phase (up, down, hold, setCompleted, rest, none)
/// Updated by local pose analyzer based on movement detection
/// Used for: Rep counting, trigger logic, UI state
final exercisePhaseProvider = StateProvider<ExercisePhase>((ref) => ExercisePhase.none);

/// Current rep count for the active set
/// Incremented when full rep cycle detected
/// Reset when new exercise starts
final repCountProvider = StateProvider<int>((ref) => 0);

/// Current form score (0.0 - 100.0)
/// Based on local pose analysis and joint angle evaluation
/// Updated in real-time during exercise execution
final formScoreProvider = StateProvider<double>((ref) => 0.0);

// ============================================================================
// STREAM PROVIDERS - Reactive data streams
// ============================================================================

/// Real-time stream of pose metrics from local analyzer
/// Emits: PoseMetrics at 30fps when pose detected
/// Errors: When camera unavailable or TFLite model fails
/// Used by: UI widgets for real-time pose overlay and metrics display
///
/// Note: This provider requires a frame stream to be provided.
/// Use localAnalyzer.analyzeFrames(frameStream) in your screen widget instead.
// final poseMetricsStreamProvider = StreamProvider<PoseMetrics>((ref) {
//   final localAnalyzer = ref.watch(localPoseAnalyzerProvider);
//   // Frame stream should be provided by the UI layer
//   throw UnimplementedError('Use localAnalyzer.analyzeFrames(frameStream) instead');
// });

// ============================================================================
// PROVIDER DEPENDENCY GRAPH
// ============================================================================
//
// WebRTC Service (standalone)
//
// Gemini Live Service (standalone, requires env var)
//
// Performance Monitor (standalone)
//
// Pose Detection Service (standalone)
//
// Gemini Trigger Manager (standalone)
//
// Local Pose Analyzer
//   ├─ Pose Detection Service
//   └─ Performance Monitor
//
// Pose Metrics Stream
//   └─ Local Pose Analyzer
//
// State Providers (standalone, managed by UI)
//   ├─ Current Pose Metrics
//   ├─ Coaching Feedback
//   ├─ Exercise Phase
//   ├─ Rep Count
//   └─ Form Score
//
// ============================================================================
