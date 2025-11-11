# Phase 1 Inventory: Mobile Refactor
> Generated: 2025-01-17
> Part of EPIC_MOBILE_REFACTOR.md execution

## 1. Dependency Audit

### Root Mobile (`mobile/package.json`)
**Runtime:** Expo 54.0.0, React Native 0.81.5, React 19.1.0

**Unique Dependencies (not in nested repos):**
- `@react-native-community/slider`: 5.0.1
- `expo-constants`: ~18.0.10
- `expo-dev-client`: ~6.0.17 (newer)
- `react-native-reanimated`: ~4.1.1 ✅ **CRITICAL**
- `react-native-video`: ^6.6.2 ✅ **CRITICAL**
- `react-native-worklets`: 0.5.1 ✅ **CRITICAL**
- `metro`: ^0.83.1 (newer)

**Missing from root (in nested repos):**
- Testing infrastructure (Jest, Testing Library, Detox)
- `@expo/metro-config`: 0.20.17
- `@types/react`: ~19.0.10

### epic-memory-system (`mobile/epic-memory-system/mobile/package.json`)
**Runtime:** Expo 53.0.20, React Native 0.79.5, React 19.0.0

**Status:** OLDER versions across the board, needs upgrade to Expo 54 / RN 0.81.5

**Unique items:**
- Has `@expo/metro-config` explicitly
- Has `@types/react`

### epic-pose-analysis (`mobile/epic-pose-analysis/mobile/package.json`)
**Runtime:** Expo 53.0.20, React Native 0.79.5, React 19.0.0

**Status:** OLDER versions, but has comprehensive testing setup

**Unique testing infrastructure:**
```json
{
  "@testing-library/react-native": "^12.4.3",
  "@testing-library/jest-native": "^5.4.3",
  "@types/jest": "^29.5.11",
  "jest": "^29.7.0",
  "jest-expo": "~51.0.4",
  "react-test-renderer": "19.0.0",
  "detox": "^20.18.3",
  "@babel/preset-typescript": "^7.23.3"
}
```

**Test scripts:**
- Unit tests, integration tests, E2E with Detox
- Firebase Test Lab integration (Android + iOS)
- Performance benchmarking
- Security testing
- UAT analysis

---

## 2. Screen File Inventory

### Root Mobile has UNIQUE:
- `PoseAnalysisScreen.js` ✅ **KEEP** (main pose analysis entry)
- `pose/PoseUpgradeScreen.js` ✅ **KEEP**
- `pose/TutorialScreen.js` ✅ **KEEP**

### epic-memory-system MISSING (vs root):
- `PoseAnalysisScreen.js`
- `PoseProgressScreen.js`
- `pose/` subfolder

### epic-pose-analysis UNIQUE:
- `__tests__/PoseAnalysisResultsScreen.test.js` ✅ **EVALUATE**
- `__tests__/PoseAnalysisUploadScreen.test.js` ✅ **EVALUATE**
- `__tests__/PoseProgressScreen.test.js` ✅ **EVALUATE**
- `PoseProgressScreen.js` (duplicate of root)

### Duplicate screens (appear in all 3):
All other screens are duplicated. Root is canonical version.

---

## 3. Service Layer Inventory

### Root Mobile UNIQUE Services:
- ✅ `aiService.js` - **KEEP** (primary AI service)
- ✅ `cameraService.js` - **KEEP** (pose capture)
- ✅ `formContextService.js` - **KEEP** (form analysis)
- ✅ `poseProgressService.js` - **KEEP** (pose tracking)
- ✅ `poseSubscriptionService.js` - **KEEP** (pose subscriptions)
- ✅ `progressDataAggregator.js` - **KEEP** (data aggregation)
- ✅ `abTestingService.js` - **KEEP**
- ✅ `contentDeliveryService.js` - **KEEP**
- ✅ `tutorialService.js` - **KEEP**
- ✅ `usageTrackingService.js` - **KEEP**

### epic-memory-system UNIQUE Services:
- ⚠️ `sessionContextManager.js` - **EVALUATE** (may have improvements)
- ⚠️ `storageService.js` - **EVALUATE** (generic storage abstraction)
- ⚠️ `workoutHistoryService.js` - **EVALUATE** (may enhance WorkoutService)

### epic-pose-analysis UNIQUE Services:
- ⚠️ `backgroundQueue.js` - **EVALUATE** (performance optimization)
- ⚠️ `frameOptimizer.js` - **EVALUATE** (pose video processing)
- ⚠️ `performanceMonitor.js` - **EVALUATE** (monitoring)
- ⚠️ `videoProcessor.js` - **EVALUATE** (video analysis)
- 📄 `PERFORMANCE_OPTIMIZATION_COMPLETE.md` - **DOCS**

---

## 4. Component Inventory

### Root Mobile Components:
```bash
mobile/components/
├── ExerciseCard.js
├── GlassSearchInput.js
├── GlassmorphismComponents.js
├── WorkoutCard.js
└── (others)
```

### epic-memory-system Components:
Similar structure, need detailed diff

### epic-pose-analysis Components:
Similar structure + potential test files

---

## 5. Consolidation Recommendations

### Priority 1: Keep Root Implementations
Root mobile at Expo 54 / RN 0.81.5 is the target. All root services and screens are canonical.

### Priority 2: Merge Testing Infrastructure
Extract testing setup from `epic-pose-analysis/mobile/package.json`:
- Jest + Testing Library
- Detox E2E
- Firebase Test Lab scripts
- Performance benchmarking

### Priority 3: Evaluate Epic Services
Need code review of:
1. `sessionContextManager.js` - May improve context handling
2. `storageService.js` - May be cleaner abstraction
3. `workoutHistoryService.js` - May extend WorkoutService
4. `backgroundQueue.js` - Performance for pose analysis
5. `frameOptimizer.js` - Video processing optimization
6. `performanceMonitor.js` - Production monitoring
7. `videoProcessor.js` - Pose video pipeline

### Priority 4: UX/Navigation Review
Check if epic-memory-system has improved:
- Navigation structure
- UI components (glassmorphism variants)
- Screen layouts

---

## 6. Phase 1 Completion Criteria

- [x] Snapshot branch created: `mobile-pre-epic-refactor`
- [x] Dependency audit complete
- [x] Screen inventory complete
- [x] Service inventory complete
- [ ] Component-level diff (pending)
- [ ] Epic services code review (pending)
- [ ] Navigation comparison (pending)

---

## 7. Next Steps for Phase 2

1. **Code review epic services** (Priority 3 list above)
2. **Diff navigation structure** between root and epic-memory-system
3. **Identify UI component improvements** from epic repos
4. **Create migration plan** for valuable epic features
5. **Begin testing infrastructure integration**

---

## 8. Risk Assessment

### Low Risk (Safe to proceed)
- Root mobile is already at target Expo 54 / RN 0.81.5
- Most screens are duplicates (root is canonical)
- Core services well-established in root

### Medium Risk (Needs evaluation)
- Testing infrastructure migration (large but valuable)
- Epic service enhancements (may conflict with root)
- Navigation changes (UX impact)

### High Risk (Proceed carefully)
- Pose analysis services split across repos (confusion)
- Three copies of same code (drift potential)
- Missing documentation on epic-specific features

---

## Appendix A: File Counts

| Repo | Screens | Services | Components |
|------|---------|----------|------------|
| Root mobile | 27 | 20+ | TBD |
| epic-memory-system | 23 | 15 | TBD |
| epic-pose-analysis | 27 | 23 | TBD |

---

## Appendix B: Snapshot Info

**Branch:** `mobile-pre-epic-refactor`
**Created:** 2025-01-17
**Purpose:** Rollback point before refactor
**Command to restore:** `git checkout mobile-pre-epic-refactor`
