# Strength.Design Mobile Deployment Playbook
> Last updated: 2025-11-25 • Owners: Mobile + Infra • Scope: Web, Mobile (Flutter), Firebase Functions, Knowledge Pipeline

This single document is the authoritative reference for the mobile app architecture, dependencies, and release-critical tasks.

---

## 1. System Snapshot

| Area | Status | Notes |
|------|--------|-------|
| **Web App (`/src`)** | ✅ Production | React 19 + Vite, Firebase v9 modular SDK, Plausible analytics hooks, Stripe checkout |
| **Mobile App (`/mobile`)** | 🚀 Flutter (97% complete) | Flutter 3.9.2, Dart SDK ^3.9.2, MoveNet TFLite, Gemini Live WebSocket |
| **Mobile Archive (`/mobile-rn-archive`)** | 📦 Archived | Previous Expo SDK 54 / React Native app (reference only) |
| **Cloud Functions (`/functions`)** | ✅ Live | Node 20 runtime, Gemini 2.5 Flash endpoints, Perplexity-backed search, Stripe + notifications scaffolding |
| **Knowledge Pipeline (`/knowledge-pipeline`)** | ✅ Ready | TypeScript ingestor feeding Firestore knowledge collection with Gemini summarization |
| **Shared Assets** | ✅ Stable | `comprehensive-exercises.csv`, `packages/muscle-anatomy-tools` scripts, Tailwind tokens in `components.json` |

---

## 2. Monorepo Map

| Path | Purpose |
|------|---------|
| `README.md`, `CLAUDE.md` | High-level overview + AI coding standards |
| `src/` | Web application (pages such as `src/pages/WorkoutGenerator.tsx`, contexts, Zustand stores) |
| `mobile/` | **Flutter project** (`lib/`, `ios/`, `android/`, `pubspec.yaml`, MoveNet model assets) |
| `mobile-rn-archive/` | Archived React Native app (reference for porting UI/business logic) |
| `functions/` | Firebase Functions (AI, programs, payments, notifications, pose, utils) |
| `knowledge-pipeline/` | Reddit/Wikipedia ingestion, CLI + configs feeding Firestore + AI enrichment |
| `packages/muscle-anatomy-tools/` | Scripts + assets powering 3D muscle visualizer |
| `public/`, `firebase.json`, `firestore.rules`, `storage.rules` | Web assets + Firebase resource definitions |
| `MOBILE_CONSOLIDATION_PLAN.md` | Flutter migration roadmap and feature checklist |

---

## 3. Mobile Architecture Overview (Flutter)

### Technology Stack
```yaml
# pubspec.yaml key dependencies
dependencies:
  firebase_auth: ^5.0.0
  firebase_core: ^3.15.2
  cloud_firestore: ^5.0.0
  firebase_storage: ^12.4.0
  flutter_webrtc: ^0.9.47
  tflite_flutter: ^0.12.1           # MoveNet pose detection
  camera: ^0.10.5
  web_socket_channel: ^3.0.0        # Gemini Live WebSocket
  hive: ^2.2.3                      # Local storage
  hive_flutter: ^1.1.0
  hooks_riverpod: ^2.5.1            # State management
  audioplayers: ^5.2.1              # Coaching audio
  flutter_dotenv: ^6.0.0            # Environment variables
  permission_handler: ^11.3.1
```

### Architecture Pattern
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
│ (WebRTC, Gemini Live, Firebase, TFLite) │
└────────────────────────────────────────┘
```

### Core Services (Implemented)

| Service | Status | Description |
|---------|--------|-------------|
| `PoseDetectionService` | ✅ | TensorFlow Lite MoveNet Thunder (17 keypoints, 30fps) |
| `LocalPoseAnalyzer` | ✅ | Rep counting, form scoring, error detection |
| `GeminiLiveService` | ✅ | WebSocket connection to Gemini 2.5 Flash Live API |
| `GeminiTriggerManager` | ✅ | Smart API throttling (97% cost reduction) |
| `PerformanceMonitor` | ✅ | Latency tracking, P95/P99 metrics, 13 unit tests |
| `WebRTCService` | ✅ | Camera streaming and frame extraction |
| `AnalysisRepository` | ✅ | Hive local cache + Firestore sync |

### Hybrid AI Architecture

The Flutter app uses a **hybrid cloud-edge approach**:

1. **On-Device (TFLite)**: Real-time pose detection at 30fps with zero latency
2. **Cloud (Gemini Live)**: Intelligent coaching via WebSocket, triggered smartly

**Cost Comparison:**
- Pure cloud approach: ~$5,400/month (1000 users)
- Hybrid approach: ~$180/month (1000 users)
- **Savings: 97%**

### What's Implemented vs Needed

**Implemented (97%):**
- MoveNet TFLite pose detection
- 8 joint angle calculations
- Rep counting state machine
- Form error detection (4 heuristics)
- Gemini Live WebSocket integration
- Smart API throttling (5-priority system)
- Performance monitoring
- Firebase integration (auth, Firestore, storage)
- 6 domain entities, 7 core services

**Needs Porting from RN Archive (3%):**
- Navigation system (use `go_router`)
- Login/Auth screen
- Home dashboard
- Exercise library screen
- Workouts management screens
- Profile/Settings screen
- Pose Results UI refinement
- Progress tracking UI
- Achievement system (optional)
- Premium tiers/paywall (optional)

---

## 4. Web Application Baseline

- **Entry + Routing**: `src/main.tsx` bootstraps `App.tsx` with React Router routes under `src/pages/`.
- **Core Pages**: Workout generator (`src/pages/WorkoutGenerator.tsx`), Journal (`src/pages/JournalPage.tsx`), Program chat (`src/pages/ProgramChat.tsx`), Nutrition diary (`src/pages/NutritionDiary.tsx`), Checkout + Stripe callbacks, Firebase auth screens.
- **State & Data**: Firebase services via `src/lib/firebase/config.ts`, TanStack Query hooks for workouts, `src/stores` for UI/usage, analytics helpers in `src/lib/analytics.ts` tied to Plausible.
- **UI System**: Tailwind + CSS modules, glassmorphism components.

---

## 5. Backend & AI Services

### Firebase Functions (`functions/src`)
- **AI** (`functions/src/ai/`):
  - `generateWorkout.ts`: Structured multi-day plan generator
  - `chatWithGemini.ts`: General chat endpoint
  - `streamingChat.ts` / `streamingChatEnhanced.ts`: SSE streaming responses
  - `enhancedChat.ts`, `formAwareCoaching.js`: Form-aware conversational logic
- **Programs & Search**: Perplexity-backed search with caching
- **Exercises & Knowledge**: Callable functions for exercise search, knowledge base
- **Pose**: `formContextBuilder.ts` for historical form analysis context
- **Payments**: Stripe-related endpoints
- **Config**: Node 20 runtime, secrets via `defineSecret("GEMINI_API_KEY")`

### Firestore Schema
- `users/{uid}`: profile, fitness profile, nutrition settings, subscription data
- Subcollections: `workouts`, `workoutSessions`, `savedExercises`, `poseAnalyses`
- Global: `exercises`, `knowledge`, `nutritionFoods`, `programs`

---

## 6. Configuration & Secrets

### Flutter Mobile (`mobile/.env`)
```bash
GEMINI_API_KEY=your_api_key_here
```

### Web (`.env.local`)
`VITE_FIREBASE_*`, `VITE_PLAUSIBLE_DOMAIN`, Stripe keys

### Functions
Secrets via `firebase functions:secrets:set GEMINI_API_KEY`

---

## 7. Mobile Deployment Readiness

### Pre-Build Checklist

- [ ] Download MoveNet model (✅ Done - `assets/models/movenet_thunder.tflite`)
- [ ] Set `GEMINI_API_KEY` in `.env`
- [ ] Configure Firebase project (`firebase_options.dart`)
- [ ] Add navigation system (`go_router`)
- [ ] Port remaining screens from RN archive
- [ ] Update bundle identifiers for iOS/Android
- [ ] Test on physical devices (iOS + Android)
- [ ] Run `flutter test`

### Build Commands
```bash
# Development
cd mobile
flutter pub get
flutter run

# iOS
cd ios && pod install && cd ..
flutter run -d ios

# Android
flutter run -d android

# Release builds
flutter build ios --release
flutter build apk --release

# Tests
flutter test
```

### Validation Matrix

| Area | What to verify |
|------|----------------|
| Auth | Firebase login/logout, session persistence |
| Pose Analysis | Live camera → MoveNet → rep counting → Gemini coaching |
| AI Chat | Gemini Live WebSocket, audio + text responses |
| Offline | Hive cache, Firestore offline persistence |
| Performance | 30fps pose detection, <33ms latency |

---

## 8. Known Gaps & Action Items

### P0 (Block Release)
1. **Complete UI screens** - Port navigation and screens from RN archive
2. **Camera integration** - Connect camera stream to LocalPoseAnalyzer pipeline
3. **Device testing** - Physical iOS and Android testing

### P1 (Pre-launch polish)
1. Pose overlay visualization (keypoint drawing)
2. Audio playback for Gemini coaching
3. Exercise-specific form evaluation logic
4. Progress history UI

### P2 (Post-launch)
1. Achievement system
2. Premium tiers/paywall
3. HealthKit/Google Fit integration
4. Push notifications

---

## 9. Reference Appendix

| Feature | Primary Files |
|---------|---------------|
| Pose Detection | `lib/src/core/services/pose_detection_service.dart` |
| Local Analyzer | `lib/src/core/services/local_pose_analyzer.dart` |
| Gemini Live | `lib/src/core/services/gemini_live_service.dart` |
| Trigger Manager | `lib/src/core/services/gemini_trigger_manager.dart` |
| Performance | `lib/src/core/services/performance_monitor.dart` |
| Entities | `lib/src/features/pose_analysis/domain/entities/` |
| Live Screen | `lib/src/features/pose_analysis/presentation/screens/live_streaming_screen.dart` |

### Documentation
- `MOBILE_CONSOLIDATION_PLAN.md` - Flutter migration roadmap
- `mobile/IMPLEMENTATION_SUMMARY.md` - Detailed Flutter implementation status
- `docs/POSE_ANALYSIS_NATIVE.md` - Flutter pose analysis PRD
- `docs/archive/rn-refactor-2025-01/` - Archived RN refactor docs

---

### How to Keep This Doc Current
- Update when architecture, env expectations, or release criteria change
- Link new modules under the Appendix instead of creating new docs
- Record blockers in §8 so release team has source of truth

This playbook is the authoritative reference for the Strength.Design mobile application.
