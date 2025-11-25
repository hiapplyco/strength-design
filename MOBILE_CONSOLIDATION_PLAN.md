# Mobile Consolidation Plan: Migrate to Flutter

**Date:** 2025-11-25
**Target:** Single Flutter mobile app (`mobile_flutter/`)
**Archive:** React Native app (`mobile/`) → `mobile-rn-archive/`

---

## Executive Summary

You have two mature mobile apps:
- **`mobile/`** (Expo RN): Full-featured, 200K+ LOC, production-ready
- **`mobile_flutter/`**: Superior AI architecture, 97% complete, needs UI

**Decision:** Consolidate to Flutter for better performance, modern AI architecture, and 97% cost savings on Gemini API calls.

---

## Current State Analysis

### What Flutter Has (Keep)
| Component | Status | Notes |
|-----------|--------|-------|
| MoveNet TFLite pose detection | ✅ Complete | 30fps, 17 keypoints |
| Hybrid cloud-edge AI | ✅ Complete | 97% cost reduction |
| Gemini Live WebSocket | ✅ Complete | Structured tool calling |
| Smart API throttling | ✅ Complete | 5-priority system |
| Performance monitoring | ✅ Complete | 13 unit tests |
| Local storage (Hive) | ✅ Complete | With Firestore sync |
| Core entities & services | ✅ Complete | 7 services, 6 entities |

### What Flutter Needs (Build)
| Component | Priority | Reference in RN |
|-----------|----------|-----------------|
| Navigation system | P0 | `App.js` |
| Auth/Login screen | P0 | `screens/LoginScreen.js` |
| Home dashboard | P0 | `screens/HomeScreen.js` |
| Exercise library | P1 | `screens/CleanExerciseLibraryScreen.js` |
| Workouts management | P1 | `screens/WorkoutsScreen.js` |
| Profile/Settings | P1 | `screens/ProfileScreen.js` |
| Pose Results UI | P1 | `screens/PoseAnalysisResultsScreen.js` |
| Progress tracking | P2 | `screens/PoseProgressScreen.js` |
| Workout results | P2 | `screens/WorkoutResultsScreen.js` |
| Achievement system | P3 | `components/pose/AchievementSystem.js` |
| Premium/Paywall | P3 | `components/pose/PremiumGate.js` |

---

## Phase 1: Immediate Cleanup (Today)

### 1.1 Remove Empty Staging Directory
```bash
rm -rf mobile/mobile/
```

### 1.2 Archive React Native App
```bash
# Move to archive (keep for reference)
mv mobile mobile-rn-archive

# Update .gitignore to exclude from active development
echo "mobile-rn-archive/node_modules/" >> .gitignore
```

### 1.3 Rename Flutter to Primary Mobile
```bash
mv mobile_flutter mobile
```

### 1.4 Update Documentation
- Update `CLAUDE.md` to reference `mobile/` as Flutter
- Update `docs/MOBILE_DEPLOYMENT_PLAYBOOK.md`

---

## Phase 2: Flutter UI Foundation (1-2 days)

### 2.1 Add Navigation Package
```yaml
# pubspec.yaml additions
dependencies:
  go_router: ^14.0.0  # Declarative routing
```

### 2.2 Create Screen Structure
```
lib/
└── src/
    └── features/
        ├── auth/
        │   └── presentation/screens/login_screen.dart
        ├── home/
        │   └── presentation/screens/home_screen.dart
        ├── workouts/
        │   └── presentation/screens/
        │       ├── workouts_screen.dart
        │       └── workout_results_screen.dart
        ├── exercises/
        │   └── presentation/screens/exercise_library_screen.dart
        ├── profile/
        │   └── presentation/screens/profile_screen.dart
        └── pose_analysis/  # Already exists
            └── presentation/screens/
                ├── live_streaming_screen.dart  # Exists
                ├── pose_upload_screen.dart
                ├── pose_results_screen.dart
                └── pose_progress_screen.dart
```

### 2.3 Router Configuration
```dart
// lib/src/core/router/app_router.dart
final router = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
    GoRoute(path: '/workouts', builder: (_, __) => const WorkoutsScreen()),
    GoRoute(path: '/exercises', builder: (_, __) => const ExerciseLibraryScreen()),
    GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
    GoRoute(path: '/pose/live', builder: (_, __) => const LiveStreamingScreen()),
    GoRoute(path: '/pose/results', builder: (_, __) => const PoseResultsScreen()),
  ],
);
```

---

## Phase 3: Core Features Migration (3-5 days)

### 3.1 Auth & Login
- Firebase Auth integration (already in pubspec)
- Email/password + social auth
- Persistent sessions (Hive)

### 3.2 Home Dashboard
- Quick action cards (AI Coach, Search, Workouts, Profile)
- Recent activity feed
- Progress summary widget

### 3.3 Exercise Library
- 800+ exercises (migrate from Firestore, same backend)
- Search with filters
- Exercise detail view with video

### 3.4 Workouts
- List saved workouts
- Create/edit workout flow
- Workout execution tracking

---

## Phase 4: Pose Analysis UI (2-3 days)

### 4.1 Complete LiveStreamingScreen
- Connect camera → LocalPoseAnalyzer pipeline
- Real-time pose overlay visualization
- Rep count, form score, phase display
- Gemini coaching feedback overlay
- Audio playback for coaching

### 4.2 Pose Results Screen
- Detailed form feedback cards
- Score breakdown visualization
- Video replay with keypoint overlay

### 4.3 Progress Tracking
- Historical analysis list
- Before/after comparisons
- Milestone achievements

---

## Phase 5: Polish & Deploy (2-3 days)

### 5.1 Design System
- Port glassmorphism components from RN
- Consistent theming (dark mode)
- Custom tab bar

### 5.2 Testing
- Unit tests for all services
- Widget tests for screens
- Physical device testing (iOS/Android)

### 5.3 Production Deployment
- App Store Connect setup
- Google Play Console setup
- CI/CD pipeline

---

## Data Migration

### Firestore Collections (No Change Needed)
The Flutter app uses the same Firebase project, so user data is already accessible:
- `users/` - User profiles
- `workouts/` - Saved workouts
- `exercises/` - Exercise library
- `poseAnalysis/` - Analysis results

### Local Storage Migration
- RN: AsyncStorage → Flutter: Hive (already configured)
- No data migration needed for new installs
- Existing users will re-authenticate

---

## Risk Mitigation

### Keep RN Archive For:
1. **UI Reference** - Copy designs, colors, layouts
2. **Business Logic** - Port service logic patterns
3. **Rollback** - If Flutter migration hits blockers

### Don't Delete Until:
- Flutter app passes all RN feature parity tests
- At least 1 week of production stability
- User feedback is positive

---

## Success Criteria

### MVP (Deployable)
- [ ] User can login/logout
- [ ] User can browse exercise library
- [ ] User can run live pose analysis
- [ ] User sees coaching feedback
- [ ] User can view analysis history

### Full Parity
- [ ] All 14 RN screens ported
- [ ] Achievement system working
- [ ] Premium tiers functional
- [ ] Progress comparisons working

---

## Command Reference

```bash
# Flutter development
cd mobile
flutter pub get
flutter run

# iOS specific
cd ios && pod install && cd ..
flutter run -d ios

# Android specific
flutter run -d android

# Build release
flutter build ios --release
flutter build apk --release

# Run tests
flutter test
```

---

## Questions to Resolve

1. **App Store accounts** - Same bundle ID or new?
2. **User migration** - Force re-login or preserve sessions?
3. **Beta testing** - TestFlight/Play Store beta period?
4. **Feature flags** - Gradual rollout of Flutter app?

---

## Next Immediate Action

Run these commands to start consolidation:

```bash
cd /Users/jms/Development/strength-design

# 1. Remove empty staging directory
rm -rf mobile/mobile/

# 2. Archive React Native app
mv mobile mobile-rn-archive

# 3. Promote Flutter to primary
mv mobile_flutter mobile

# 4. Verify Flutter builds
cd mobile
flutter pub get
flutter analyze
```

Ready to proceed?
