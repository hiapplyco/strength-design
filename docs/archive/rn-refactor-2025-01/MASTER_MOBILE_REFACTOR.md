# Master Mobile Refactor Plan
> Combined Strategy Document • Created: 2025-01-17
> Integrates insights from EPIC_MOBILE_REFACTOR.md and REFACTOR_PLAN.md
> **Status: Ready for Execution**

---

## Executive Summary

This master plan consolidates two refactor strategies into a single, actionable roadmap for unifying the Strength.Design mobile application. We will merge the dual mobile implementations (`mobile/` and `mobile/epic-memory-system/mobile/`) into a single, modern React Native codebase that combines the Epic Memory System's superior UX with the existing app's advanced services.

### Core Decisions
- **Single Source of Truth**: `mobile/` remains the canonical project location
- **Runtime**: Expo SDK 54.0.0 / React Native 0.81.5 (already in production)
- **Architecture**: Adopt Epic UX patterns while preserving advanced services
- **TypeScript**: Gradual migration as files are refactored (not a blocker)
- **Firebase**: Environment-driven configuration with optional emulator support

---

## Current State Analysis

### Architecture Comparison
| Component | `mobile/` (Production) | `epic-memory-system/mobile` | Decision |
|-----------|------------------------|------------------------------|----------|
| **Expo/RN Version** | SDK 54.0.0 / RN 0.81.5 | SDK 53.x / RN 0.79.5 | Keep SDK 54 |
| **Firebase Config** | Env-driven with AsyncStorage | Hard-coded prod keys | Keep env-driven |
| **Services** | Full suite (AI, pose, context, nutrition) | Subset (search, workout, health) | Keep full suite |
| **UI/UX** | Legacy design, functional | Modern glassmorphism, Epic flow | Adopt Epic UX |
| **Navigation** | Tab + stack with pose/AI screens | Epic UX flows, cleaner structure | Adopt Epic nav |
| **TypeScript** | Partial (services in JS) | Minimal | Gradual migration |

### Risk Assessment
- **Duplicate dependencies**: 621 changed files, nested package installations
- **Conflicting Firebase configs**: Could break auth/data access
- **Mismatched SDKs**: Build failures if not aligned
- **Service duplication**: Maintenance overhead, inconsistent behavior

---

## Unified Refactor Strategy

### Phase 0: Pre-flight Checks ✓ (15 minutes)
1. **Create safety branch**:
   ```bash
   git checkout -b mobile-master-refactor
   git tag mobile-pre-refactor
   ```
2. **Document current state**:
   ```bash
   # Capture dependency snapshot
   cd mobile && npm list --depth=0 > ../docs/mobile-deps-before.txt
   cd epic-memory-system/mobile && npm list --depth=0 > ../../docs/epic-deps-before.txt
   ```

### Phase 1: Foundation Consolidation (Day 1)

#### 1.1 Dependency Alignment
```bash
# Analyze unique dependencies
diff mobile/package.json mobile/epic-memory-system/mobile/package.json

# Key packages to preserve from Epic:
# - lucide-react-native (icons)
# - @react-native-community/blur (glassmorphism)
# - react-native-safe-area-context (latest)

# Add to mobile/package.json:
npm install lucide-react-native@latest
npm install @react-native-community/blur@latest
```

#### 1.2 Firebase Configuration Merge
Combine the best of both approaches:

**File**: `mobile/firebaseConfig.js`
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  connectAuthEmulator
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Environment-driven config (existing)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  // ... rest of config
};

// Epic emulator support (new)
const USE_EMULATORS = process.env.USE_EMULATORS === 'true';
const EMULATOR_HOST = process.env.EMULATOR_HOST || 'localhost';

// Initialize with persistence
let app, auth, db, functions;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });

  if (USE_EMULATORS && __DEV__) {
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`);
    connectFirestoreEmulator(db, EMULATOR_HOST, 8080);
    connectFunctionsEmulator(functions, EMULATOR_HOST, 5001);
  }
}

export { app, auth, db, functions };
```

### Phase 2: Service Layer Integration (Day 2-3)

#### 2.1 Service Migration Strategy
Prefer richer implementations, integrate Epic patterns:

| Service | Source | Migration Approach |
|---------|--------|-------------------|
| `aiService.js` | Keep mobile/ version | Add TypeScript types gradually |
| `contextAggregator.js` | Keep mobile/ version | Already production-tested |
| `searchService.js` | Merge both | Epic UI hooks + mobile caching |
| `poseDetection/*` | Keep mobile/ version | Advanced implementation |
| `workoutService.js` | Epic patterns | Cleaner Firebase Functions integration |

#### 2.2 Firebase Functions Integration
Ensure all Firebase Functions are properly exposed:

**File**: `mobile/services/firebase/functions.ts`
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';

// Type definitions
interface WorkoutGenerationParams {
  userId: string;
  preferences: any;
  context?: any;
}

// Function references (from epic-memory-system/functions)
export const generateWorkout = httpsCallable<WorkoutGenerationParams, any>(
  functions,
  'generateStructuredWorkout'
);

export const streamChat = httpsCallable(functions, 'streamingChatEnhanced');
export const analyzeMovement = httpsCallable(functions, 'analyzePoseVideo');
export const searchExercises = httpsCallable(functions, 'searchExercemusExercisesCallable');
```

### Phase 3: UI/UX Migration (Day 4-5)

#### 3.1 Design System Unification
Create a unified theme combining both approaches:

**File**: `mobile/styles/theme.ts`
```typescript
// Merge Epic design tokens with existing theme
export const theme = {
  // From Epic (glassmorphism, modern spacing)
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    blurAmount: 20,
  },

  // From existing (battle-tested colors)
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#000000',
    surface: '#1C1C1E',
    ...existingColors,
  },

  // Unified spacing scale
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};
```

#### 3.2 Component Migration Priority
1. **Navigation Shell** (Epic App.js structure) → `mobile/App.js`
2. **Glass Components** (Epic glassmorphism) → `mobile/components/ui/`
3. **Search/Filter UI** (Epic patterns) → `mobile/components/search/`
4. **Workout Cards** (Epic design) → `mobile/components/workout/`
5. **Form Components** (Keep existing, style with Epic theme)

### Phase 4: Screen Consolidation (Day 6-8)

#### 4.1 Screen Migration Map
| Epic Screen | Existing Screen | Result | Notes |
|-------------|-----------------|--------|-------|
| `UnifiedSearchScreen` | `ExerciseLibraryScreen` | `SearchScreen.tsx` | Epic UI + mobile search service |
| `WorkoutGeneratorV2` | `EnhancedGeneratorScreen` | `WorkoutGeneratorScreen.tsx` | Epic flow + mobile AI service |
| `ProgramChatScreen` | `StreamingChatScreen` | `ChatScreen.tsx` | Epic UI + mobile streaming |
| `HealthDashboard` | `NutritionScreen` | `HealthScreen.tsx` | Merge health tracking |
| N/A | `PoseAnalysisScreen` | Keep as-is | Unique to mobile |
| N/A | `PoseProgressScreen` | Keep as-is | Unique to mobile |

#### 4.2 Navigation Structure
```javascript
// mobile/navigation/AppNavigator.tsx
// Epic tab structure + mobile's additional screens

const TabNavigator = () => (
  <Tab.Navigator screenOptions={epicTabOptions}>
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Search" component={SearchScreen} />
    <Tab.Screen name="Generate" component={WorkoutGeneratorScreen} />
    <Tab.Screen name="Pose" component={PoseNavigator} /> {/* Mobile unique */}
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);
```

### Phase 5: Cleanup & Optimization (Day 9)

#### 5.1 File System Cleanup
```bash
# After confirming all needed files are migrated:
rm -rf mobile/epic-memory-system
rm -rf mobile/epic-pose-analysis  # If fully integrated

# Remove duplicate assets
# Keep only one exercises.csv in mobile/assets/
find . -name "comprehensive-exercises.csv" -type f
# Delete duplicates, update import paths
```

#### 5.2 Dependency Optimization
```bash
cd mobile
# Remove unused packages
npm uninstall [legacy-packages]

# Audit and fix
npm audit fix
npm dedupe
```

#### 5.3 TypeScript Migration (Ongoing)
- **Not a blocker**: Migrate files as they're touched
- **Priority order**: New files → Modified files → Stable files
- **Type definitions**: Add `.d.ts` files for JS services initially

### Phase 6: Validation & Testing (Day 10)

#### 6.1 Functional Test Matrix
- [ ] **Authentication**: Login, signup, password reset
- [ ] **Workout Generation**: All input types, AI response
- [ ] **Search**: Exercise, nutrition, filters
- [ ] **Pose Analysis**: Upload, process, results display
- [ ] **Chat**: Streaming, context awareness
- [ ] **Offline**: Cache behavior, sync on reconnect
- [ ] **Navigation**: All screens accessible, back navigation

#### 6.2 Performance Benchmarks
- [ ] App launch time: < 2 seconds
- [ ] Screen transitions: 60 fps
- [ ] Search results: < 500ms
- [ ] Memory usage: Stable under 200MB
- [ ] Bundle size: < 40MB (iOS), < 25MB (Android)

#### 6.3 Build Verification
```bash
# iOS
cd ios && pod install
npm run ios

# Android
cd android && ./gradlew clean
npm run android

# Production builds (if EAS configured)
eas build --platform all --profile preview
```

---

## Implementation Timeline

| Week | Phase | Deliverable |
|------|-------|-------------|
| **Week 1** | Foundation + Services | Unified config, service layer |
| **Week 2** | UI/UX + Screens | Epic design system, migrated screens |
| **Week 3** | Cleanup + Testing | Single codebase, validated app |

---

## Success Criteria

1. **Single Codebase**: No nested mobile projects
2. **Unified Design**: Consistent Epic-inspired UI
3. **Full Features**: All existing features preserved
4. **Performance**: Equal or better than current
5. **Maintainability**: Clear structure, partial TypeScript
6. **Documentation**: Updated playbook, clear architecture

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Data Loss** | Git tags, branch protection, incremental commits |
| **Feature Regression** | Feature flag system for gradual rollout |
| **Build Failures** | Test on CI after each phase |
| **Performance Degradation** | Profile before/after each major change |
| **Team Confusion** | Daily progress updates, clear PR descriptions |

---

## Open Decisions

1. **TypeScript Timeline**: Gradual or sprint migration?
   - **Recommendation**: Gradual, as files are touched

2. **Epic Functions**: Migrate all or selective?
   - **Recommendation**: Selective, based on performance testing

3. **Documentation Location**: Keep nested docs or consolidate?
   - **Recommendation**: Consolidate to `docs/mobile/`

---

## Next Steps

1. **Immediate** (Today):
   ```bash
   git checkout -b mobile-master-refactor
   git tag mobile-pre-refactor-2025-01-17
   ```

2. **Tomorrow**:
   - Begin Phase 1.1 (Dependency Alignment)
   - Create migration tracking spreadsheet

3. **This Week**:
   - Complete Phases 1-2
   - Daily progress commit with detailed messages

---

## Appendix: Command Reference

### Useful Diff Commands
```bash
# Compare file structures
diff -qr mobile/screens mobile/epic-memory-system/mobile/screens

# Find unique files in Epic
comm -13 <(cd mobile && find . -name "*.js" | sort) \
         <(cd mobile/epic-memory-system/mobile && find . -name "*.js" | sort)

# Check for duplicate service logic
rg "export.*function|export.*const" mobile/services --no-heading | sort | uniq -d
```

### Migration Scripts
```bash
# Copy Epic components preserving structure
rsync -av --exclude=node_modules \
  mobile/epic-memory-system/mobile/components/ \
  mobile/components/epic/

# Update import paths
find mobile/screens -name "*.js" -exec sed -i '' \
  's|from.*epic-memory-system/mobile|from ..|g' {} \;
```

---

*This master document supersedes individual refactor plans. For implementation details, refer to the phase-specific sections above.*