I'll help you convert this PRD to Flutter. Let me first gather information about Gemini CLI and Flutter best practices for this type of application.Let me try again with a more specific query:Now I'll rewrite the PRD for Flutter:

---

# Pose Analysis Flutter Implementation PRD

**Updated:** 2025-01-19  
**Owner:** Mobile Team  
**Scope:** Flutter cross-platform app (iOS, Android, Web)  
**Version:** 1.0

This document outlines the Flutter implementation of the pose analysis application, replacing the React Native version with a unified Flutter codebase that delivers native performance across iOS, Android, and web platforms.

---

## 1. Goals & Success Criteria

| Goal | Description | KPIs |
|------|-------------|------|
| Cross-platform parity | Single codebase for iOS, Android, and web with consistent UX | 95%+ code sharing |
| Real-time streaming | WebRTC to Gemini Live API with minimal latency | < 400ms round-trip |
| On-device inference | ML Kit / MediaPipe for offline capability | ≥ 30fps inference |
| Offline-first | Queue operations, sync when online | Zero connectivity blocks |
| Developer velocity | Faster iteration than native development | 50% reduction in dev time |

---

## 2. Flutter Architecture Overview

### 2.1 Technology Stack

**Core Dependencies:**
```yaml
dependencies:
  flutter_webrtc: ^0.9.47
  google_mlkit_pose_detection: ^0.11.0
  firebase_core: ^2.31.0
  cloud_firestore: ^4.17.0
  firebase_auth: ^4.19.0
  firebase_storage: ^11.7.0
  hooks_riverpod: ^2.5.1
  dio: ^5.4.3
  web_socket_channel: ^2.4.5
  hive_flutter: ^1.1.0
  camera: ^0.10.5
  permission_handler: ^11.3.1
  flutter_isolate: ^2.0.4
```

### 2.2 Architecture Pattern

```
┌────────────────────────────────────────┐
│         Presentation Layer              │
│   (Flutter Widgets + Riverpod)          │
└─────────────────┬──────────────────────┘
                  │
┌─────────────────▼──────────────────────┐
│         Domain Layer                    │
│   (Use Cases + Business Logic)          │
└─────────────────┬──────────────────────┘
                  │
┌─────────────────▼──────────────────────┐
│         Data Layer                      │
│   (Repositories + Services)             │
└─────────────────┬──────────────────────┘
                  │
┌─────────────────▼──────────────────────┐
│      External Services                  │
│ (WebRTC, Gemini, Firebase, ML Kit)      │
└────────────────────────────────────────┘
```

### 2.3 State Management (Riverpod)

```dart
// Core providers structure
final webRTCServiceProvider = Provider((ref) => WebRTCService());
final geminiLiveProvider = Provider((ref) => GeminiLiveService());
final poseDetectionProvider = Provider((ref) => PoseDetectionService());

final videoStreamProvider = StreamProvider<MediaStream>((ref) async* {
  final webrtc = ref.watch(webRTCServiceProvider);
  yield* webrtc.mediaStream;
});

final poseAnalysisStateProvider = StateNotifierProvider<PoseAnalysisNotifier, PoseAnalysisState>(
  (ref) => PoseAnalysisNotifier(ref),
);

final analysisHistoryProvider = StreamProvider<List<AnalysisResult>>((ref) async* {
  yield* FirebaseFirestore.instance
    .collection('poseAnalysisHistory')
    .where('userId', isEqualTo: ref.watch(authProvider).uid)
    .snapshots()
    .map((snap) => snap.docs.map((doc) => AnalysisResult.fromFirestore(doc)).toList());
});
```

---

## 3. Core Components Implementation

### 3.1 Video Capture & WebRTC Module

```dart
class WebRTCService {
  late RTCPeerConnection _peerConnection;
  late MediaStream _localStream;
  final _localRenderer = RTCVideoRenderer();
  final _remoteRenderer = RTCVideoRenderer();
  
  Future<void> initialize() async {
    await _localRenderer.initialize();
    await _remoteRenderer.initialize();
    
    // Get user media
    final mediaConstraints = {
      'audio': true,
      'video': {
        'facingMode': 'environment',
        'width': {'ideal': 1280},
        'height': {'ideal': 720},
        'frameRate': {'ideal': 30}
      }
    };
    
    _localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    _localRenderer.srcObject = _localStream;
    
    // Initialize peer connection
    final configuration = {
      'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'},
      ]
    };
    
    _peerConnection = await createPeerConnection(configuration);
    _peerConnection.addStream(_localStream);
  }
  
  // Frame extraction for ML processing
  Stream<Uint8List> extractFrames() async* {
    // Use platform channels for native frame extraction
    // or RepaintBoundary approach for Flutter-level capture
  }
}
```

### 3.2 Gemini Live Integration

```dart
class GeminiLiveService {
  late WebSocketChannel _channel;
  final String apiKey;
  
  Future<void> connect() async {
    _channel = WebSocketChannel.connect(
      Uri.parse('wss://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-live/streamGenerateContent'),
    );
    
    // Send setup configuration
    final config = {
      'setup': {
        'model': 'gemini-2.5-flash-live',
        'generationConfig': {
          'responseModalities': ['AUDIO', 'TEXT'],
          'temperature': 0.7,
        },
        'systemInstruction': '''
          You are an expert fitness coach analyzing exercise form.
          Provide real-time feedback on:
          - Body positioning and alignment
          - Movement quality and efficiency  
          - Safety considerations
          - Corrective cues
        ''',
        'tools': [
          {
            'functionDeclarations': [
              {
                'name': 'recordMetrics',
                'description': 'Record exercise metrics',
                'parameters': {
                  'type': 'object',
                  'properties': {
                    'repCount': {'type': 'integer'},
                    'formScore': {'type': 'number'},
                    'keyAngles': {'type': 'object'}
                  }
                }
              }
            ]
          }
        ]
      }
    };
    
    _channel.sink.add(jsonEncode(config));
    
    // Listen for responses
    _channel.stream.listen((data) {
      final response = jsonDecode(data);
      _handleGeminiResponse(response);
    });
  }
  
  void streamVideoFrame(Uint8List frameData) {
    final message = {
      'realtimeInput': {
        'mediaChunks': [
          {
            'mimeType': 'image/jpeg',
            'data': base64Encode(frameData)
          }
        ]
      }
    };
    _channel.sink.add(jsonEncode(message));
  }
}
```

### 3.3 On-Device Pose Detection

```dart
class PoseDetectionService {
  final poseDetector = PoseDetector(
    options: PoseDetectorOptions(
      mode: PoseDetectionMode.stream,
      model: PoseDetectionModel.accurate,
    ),
  );
  
  Stream<PoseAnalysisResult> analyzeFrames(Stream<InputImage> frames) async* {
    await for (final frame in frames) {
      final poses = await poseDetector.processImage(frame);
      
      if (poses.isNotEmpty) {
        final result = await compute(_analyzePoseInIsolate, poses.first);
        yield result;
      }
    }
  }
  
  // Heavy computation in isolate
  static Future<PoseAnalysisResult> _analyzePoseInIsolate(Pose pose) async {
    // Calculate angles, detect form issues, count reps
    final angles = _calculateJointAngles(pose);
    final formScore = _evaluateForm(angles);
    final repPhase = _detectRepPhase(angles);
    
    return PoseAnalysisResult(
      angles: angles,
      formScore: formScore,
      repPhase: repPhase,
      landmarks: pose.landmarks,
    );
  }
}
```

### 3.4 Offline-First Data Layer

```dart
class AnalysisRepository {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final Box<AnalysisResult> _localCache = Hive.box('analysisCache');
  final ConnectivityService _connectivity;
  
  Stream<List<AnalysisResult>> getAnalysisHistory() async* {
    // First emit local cache
    yield _localCache.values.toList();
    
    // Then sync with remote if online
    if (await _connectivity.isOnline) {
      final remote = await _firestore
        .collection('poseAnalysisHistory')
        .get();
      
      final results = remote.docs
        .map((doc) => AnalysisResult.fromFirestore(doc))
        .toList();
        
      // Update local cache
      await _localCache.clear();
      await _localCache.addAll(results);
      
      yield results;
    }
  }
  
  Future<void> saveAnalysis(AnalysisResult result) async {
    // Save locally first
    await _localCache.add(result);
    
    // Queue for remote sync
    if (await _connectivity.isOnline) {
      await _firestore
        .collection('poseAnalysisHistory')
        .add(result.toMap());
    } else {
      await _queueForSync(result);
    }
  }
}
```

---

## 4. Feature Implementation

### 4.1 Live Streaming Screen

```dart
class LiveStreamingScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final webrtcService = ref.watch(webRTCServiceProvider);
    final geminiService = ref.watch(geminiLiveProvider);
    final poseService = ref.watch(poseDetectionProvider);
    
    return Scaffold(
      body: Stack(
        children: [
          // Video preview
          RTCVideoView(webrtcService.localRenderer),
          
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
                padding: EdgeInsets.all(16),
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
                  icon: Icon(Icons.flip_camera_ios),
                  onPressed: () => webrtcService.switchCamera(),
                ),
                IconButton(
                  icon: Icon(Icons.stop),
                  onPressed: () => _stopSession(ref),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

### 4.2 Platform-Specific Implementations

```dart
// lib/services/platform/camera_service.dart
abstract class CameraService {
  Stream<Uint8List> getFrameStream();
  Future<void> switchCamera();
}

// Native mobile implementation
class MobileCameraService implements CameraService {
  final CameraController _controller;
  
  @override
  Stream<Uint8List> getFrameStream() async* {
    await for (final image in _controller.startImageStream()) {
      yield _convertCameraImage(image);
    }
  }
}

// Web implementation  
class WebCameraService implements CameraService {
  @override
  Stream<Uint8List> getFrameStream() async* {
    // Use flutter_webrtc getUserMedia for web
    // Extract frames via canvas element
  }
}

// Factory
CameraService getCameraService() {
  if (kIsWeb) return WebCameraService();
  return MobileCameraService();
}
```

---

## 5. Performance Optimizations

### 5.1 Frame Processing Pipeline

```dart
class OptimizedFrameProcessor {
  final _frameQueue = Queue<Uint8List>();
  final _processedFrames = StreamController<ProcessedFrame>();
  Timer? _processingTimer;
  
  void start() {
    // Process at controlled rate (e.g., 10 FPS for ML, 30 FPS for display)
    _processingTimer = Timer.periodic(Duration(milliseconds: 100), (_) {
      if (_frameQueue.isNotEmpty) {
        final frame = _frameQueue.removeFirst();
        
        // Process in isolate
        compute(processFrame, frame).then((result) {
          _processedFrames.add(result);
        });
      }
    });
  }
  
  void addFrame(Uint8List frame) {
    // Drop old frames if queue is full
    if (_frameQueue.length > 5) {
      _frameQueue.removeFirst();
    }
    _frameQueue.add(frame);
  }
}
```

### 5.2 Memory Management

```dart
class MemoryEfficientVideoHandler {
  // Reuse buffers
  final _frameBufferPool = <Uint8List>[];
  
  Uint8List getBuffer(int size) {
    if (_frameBufferPool.isNotEmpty) {
      return _frameBufferPool.removeLast();
    }
    return Uint8List(size);
  }
  
  void returnBuffer(Uint8List buffer) {
    buffer.fillRange(0, buffer.length, 0);
    _frameBufferPool.add(buffer);
  }
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

```dart
// test/services/pose_detection_test.dart
void main() {
  group('PoseDetectionService', () {
    late PoseDetectionService service;
    
    setUp(() {
      service = PoseDetectionService();
    });
    
    test('calculates joint angles correctly', () {
      final pose = MockPose();
      final angles = service.calculateAngles(pose);
      
      expect(angles['leftElbow'], closeTo(90.0, 5.0));
    });
    
    test('detects rep phases', () {
      final angles1 = {'knee': 45.0};
      final angles2 = {'knee': 120.0};
      
      expect(service.detectPhase(angles1), RepPhase.down);
      expect(service.detectPhase(angles2), RepPhase.up);
    });
  });
}
```

### 6.2 Integration Tests

```dart
// integration_test/live_streaming_test.dart
void main() {
  testWidgets('Live streaming flow', (tester) async {
    await tester.pumpWidget(MyApp());
    
    // Grant permissions
    await tester.tap(find.text('Allow Camera'));
    await tester.pumpAndSettle();
    
    // Start streaming
    await tester.tap(find.byIcon(Icons.play_arrow));
    await tester.pumpAndSettle();
    
    // Verify video is displayed
    expect(find.byType(RTCVideoView), findsOneWidget);
    
    // Verify pose overlay appears
    await tester.pump(Duration(seconds: 2));
    expect(find.byType(PoseOverlay), findsOneWidget);
  });
}
```

---

## 7. Deployment Configuration

### 7.1 Firebase Setup

```dart
// lib/main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  // Enable offline persistence
  FirebaseFirestore.instance.settings = Settings(
    persistenceEnabled: true,
    cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
  );
  
  // Initialize Hive for local storage
  await Hive.initFlutter();
  await Hive.openBox<AnalysisResult>('analysisCache');
  
  // Initialize Gemini CLI for development
  if (kDebugMode) {
    await GeminiCLI.initialize();
  }
  
  runApp(
    ProviderScope(
      child: MyApp(),
    ),
  );
}
```

### 7.2 Platform Configurations

**Android (android/app/build.gradle):**
```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 34
    }
    
    packagingOptions {
        exclude 'META-INF/DEPENDENCIES'
    }
}

dependencies {
    implementation 'com.google.mlkit:pose-detection:18.0.0-beta4'
}
```

**iOS (ios/Runner/Info.plist):**
```xml
<key>NSCameraUsageDescription</key>
<string>Camera access needed for pose analysis</string>
<key>NSMicrophoneUsageDescription</key>
<string>Microphone access for voice coaching</string>
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
    <string>voip</string>
</array>
```

**Web (web/index.html):**
```html
<script src="https://webrtc.github.io/adapter/adapter-latest.js"></script>
<script>
  // Initialize WebRTC shims
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log('WebRTC is supported');
  }
</script>
```

---

## 8. Monitoring & Analytics

```dart
class AnalyticsService {
  static void trackStreamingSession({
    required Duration duration,
    required int framesAnalyzed,
    required double avgFormScore,
  }) {
    FirebaseAnalytics.instance.logEvent(
      name: 'pose_streaming_session',
      parameters: {
        'duration_seconds': duration.inSeconds,
        'frames_analyzed': framesAnalyzed,
        'avg_form_score': avgFormScore,
        'platform': defaultTargetPlatform.toString(),
      },
    );
  }
}
```

---

## 9. Delivery Timeline

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| 1. Setup & Architecture | 1 week | Project setup, dependencies, base architecture |
| 2. Core Streaming | 2 weeks | WebRTC integration, Gemini Live connection |
| 3. ML Integration | 2 weeks | ML Kit pose detection, frame processing |
| 4. Offline & Sync | 1.5 weeks | Hive storage, Firebase sync, queue system |
| 5. UI Polish | 1.5 weeks | Animations, overlays, responsive design |
| 6. Platform Testing | 1 week | iOS, Android, Web specific fixes |
| 7. Performance Tuning | 1 week | Optimization, memory management |
| 8. QA & Release | 1 week | Testing, bug fixes, store submission |

**Total: 11 weeks** (Single Flutter developer + QA support)

---

## 10. Risk Mitigation

| Risk | Mitigation Strategy |
|------|-------------------|
| WebRTC web compatibility | Use adapter.js, test on multiple browsers |
| ML Kit performance | Implement frame skipping, reduce resolution |
| Gemini API quotas | Implement client-side throttling, caching |
| Platform differences | Abstract platform APIs, extensive testing |
| Memory leaks | Proper disposal, regular profiling |

---

## 11. Success Metrics

- **Performance**: 60fps UI, 30fps video, 10fps ML inference
- **Reliability**: <0.1% crash rate, 99.9% uptime
- **User Experience**: <2s app startup, <500ms streaming start
- **Code Quality**: 80%+ test coverage, <5% code duplication

---

## 12. References

- [Flutter WebRTC Documentation](https://pub.dev/packages/flutter_webrtc)
- [Google ML Kit Pose Detection](https://pub.dev/packages/google_mlkit_pose_detection)
- [Gemini Live API](https://ai.google.dev/gemini-api/docs/live)
- [Riverpod State Management](https://riverpod.dev)
- [Flutter Performance Best Practices](https://docs.flutter.dev/perf/best-practices)
- [Gemini CLI Development Tool](https://github.com/google-gemini/gemini-cli)

---

**Next Steps:**
1. Review and approve PRD
2. Set up Flutter project with defined architecture
3. Configure CI/CD pipelines
4. Begin Phase 1 implementation

**Document Status:** Ready for review and sign-off