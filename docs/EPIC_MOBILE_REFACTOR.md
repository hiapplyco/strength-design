# Epic Memory System Mobile Refactor Plan
> Author: Codex • Last updated: 2025-01-17  
> Scope: Consolidate the merged mobile apps so the `@epic-memory-system` UX becomes canonical while preserving the richer services from the existing Strength.Design mobile implementation.

---

## 1. Objectives
1. **Single Source of Truth** – Eliminate the dual mobile apps (`mobile/` vs `mobile/epic-memory-system/mobile`) and run everything from `mobile/`.
2. **Adopt Epic UX** – Keep navigation, screen flows, and design assets introduced by `@epic-memory-system`.
3. **Preserve Advanced Services** – Retain the improved AI, pose, and data services from the existing app (e.g., `aiService.js`, `contextAggregator.js`, `poseDetection/`).
4. **Upgrade Runtime** – Align on Expo SDK 54 / React Native 0.81 (already validated in the top-level app).
5. **Normalize Tooling & Docs** – Remove nested copies of functions/packages/docs once features are migrated.

---

## 2. Current Landscape
| Area | `mobile/` (existing) | `mobile/epic-memory-system/mobile` | `mobile/epic-pose-analysis/mobile` |
|------|---------------------|------------------------------------|------------------------------------|
| **Expo / RN** | Expo 54.0.0, RN 0.81.5 | Expo 53.x, RN 0.79.5 | Expo 53.x, RN 0.79.5 |
| **Firebase config** | Env-driven (`firebaseConfig.js`), AsyncStorage persistence | Hard-coded prod keys + optional emulator toggles | Similar to epic-memory-system |
| **Services** | Full suite: AI, pose, context, nutrition, knowledge, etc. | Subset (search, workout, health) | Pose-focused services |
| **Navigation** | Tab + stack linking pose + AI screens | Epic UX flows, but older service bindings | Pose analysis screens |
| **Docs / assets** | Root-level docs, assets | Entire nested repo (functions, packages, docs, etc.) | Entire nested repo |

**Risks if left as-is**:
- Duplicate dependencies (`npm install` runs 3x), conflicting Firebase configs, mismatched Expo SDKs.
- High maintenance cost (three copies of services/functions/docs).
- Builds may break because the root project references files not present in the nested repos or vice versa.
- Confusion about which pose analysis implementation is canonical (root vs epic-pose-analysis).

---

## 3. Guiding Decisions
1. **Canonical project**: `mobile/` root folder will remain the final project. We will pull assets/code from `epic-memory-system/mobile` into it, then delete the nested repo.
2. **Runtime baseline**: Upgrade any code imported from the epic project to Expo 54 / RN 0.81 to match the existing app package.json.
3. **Firebase strategy**: Keep the env-driven config from `mobile/firebaseConfig.js`, but integrate emulator toggles and dev niceties (no hard-coded keys).
4. **Services**: Prefer the richer implementation whenever duplicates exist. Example: keep `mobile/services/searchService.js` (advanced cache + filter) and simply align the epic screens to call it.
5. **Docs**: The only canonical mobile doc will remain `docs/MOBILE_DEPLOYMENT_PLAYBOOK.md`; any epic-specific guides worth preserving should be linked or summarized there after refactor.

---

## 4. Refactor Plan
### Phase 1 — Inventory & Preparation
1. **Snapshot**: Tag/branch current state for rollback (`git branch mobile-pre-epic`).
2. **Dependency audit**:
   - Diff `mobile/package.json` vs `epic-memory-system/mobile/package.json`.
   - Create a merged dependency list (Expo 54, RN 0.81, keep lucide/expo modules).
3. **Identify unique files**:
   - Use `diff -qr mobile/epic-memory-system/mobile/screens mobile/screens` to locate screens missing from each side.
   - Repeat for `components/`, `contexts/`, `services/`, `hooks/`.

### Phase 2 — Code Consolidation
1. **Copy epic UX components** into `mobile/`:
   - Screens (especially entry navigator, layout wrappers, glassmorphism components).
   - Shared components and contexts the epic app relies on.
   - Update imports to use root-level paths (`../services/...`).
2. **Replace / adapt navigation**:
   - Update `mobile/App.js` to use epic’s route structure (tabs, modals, theming).
   - Ensure additional screens (pose pipeline, ContextAwareGeneratorScreen, etc.) remain linked.
3. **Service integration**:
   - Point epic screens to existing services (e.g., ensure `UnifiedSearchScreen` uses `services/searchService.js` from root).
   - If an epic service offers improvements (e.g., simplified hooking), merge logic into the root file rather than duplicating.
4. **Config merge**:
   - Bring emulator host toggles (`USE_EMULATORS`, `EMULATOR_HOST`) into `mobile/firebaseConfig.js` as optional env flags.
   - Remove hard-coded API keys.
5. **Assets & data**:
   - Copy unique assets (imgs, CSVs) from `epic-memory-system/mobile/assets` into `mobile/assets`.
   - Deduplicate `comprehensive-exercises.csv` / `wr kout-exercises` files, referencing one copy in services.

### Phase 3 — Cleanup
1. **Delete nested repos**:
   - Remove `mobile/epic-memory-system` after confirming all needed UX/navigation files have been absorbed.
   - Remove `mobile/epic-pose-analysis` after confirming pose services are consolidated into root `mobile/services/poseDetection/*`.
2. **Docs**:
   - Capture any valuable findings from epic docs (e.g., `GLASSMORPHISM_SETUP.md`) as appendices or references inside `docs/MOBILE_DEPLOYMENT_PLAYBOOK.md`.
3. **Scripts**:
   - Ensure `run-simulator.sh`, EAS configs, etc., align with the root app.
4. **CI / Build checks** (when available):
   - `npm run lint`
   - `expo start --offline` (manual)
   - `eas build --profile preview --platform ios/android` (if credentials available)

### Phase 4 — Validation
1. **Functional smoke tests**:
   - Auth + onboarding
   - Unified search (exercise + nutrition)
   - AI chat and workout generation
   - Pose upload → processing → results
   - Health sync toggles
2. **Performance checks**:
   - Ensure navigation is smooth at 60fps on device/emulator.
   - Confirm AsyncStorage caches still respect TTLs.
3. **Regression checks**:
   - Verify notifications, storage uploads, and knowledge service queries still work with consolidated code paths.

---

## 5. Open Questions
1. ~~**Expo SDK**: Proceed with Expo 54 / RN 0.81 as target?~~ ✅ **RESOLVED** - Root mobile already upgraded to Expo 54 / RN 0.81.5.
2. **Firebase Functions / packages**: Any modules unique to `epic-memory-system/functions` or `epic-pose-analysis/functions` that still need migration, or is the repo root authoritative?
3. **Remaining doc assets**: Should any epic docs stay verbatim, or will summaries inside the deployment playbook suffice?
4. **epic-pose-analysis status**: Is this a separate experimental branch, or should it be merged into the root pose implementation? Clarify relationship to `mobile/services/poseDetection/*`.

---

## 6. Progress Tracking

### Phase 1: Inventory & Preparation ✅ **COMPLETE**
- [x] 1.1 Snapshot branch created: `mobile-pre-epic-refactor`
- [x] 1.2 Dependency audit complete (see `PHASE1_INVENTORY.md`)
- [x] 1.3 Unique file identification complete
- [x] 1.4 Detailed inventory documented in `docs/PHASE1_INVENTORY.md`

**Key Findings:**
- Root mobile already at target Expo 54 / RN 0.81.5 ✅
- Identified 7 unique services in epic repos requiring evaluation
- epic-pose-analysis has comprehensive testing infrastructure to port
- Most screens are duplicates; root is canonical

### Phase 2: Code Consolidation 🔄 **IN PROGRESS**
- [x] 2.1 Review and merge valuable epic services → See `PHASE2_SERVICE_REVIEW.md`
- [ ] 2.2 Compare navigation structures
- [ ] 2.3 Identify UI component improvements
- [ ] 2.4 Integrate testing infrastructure from epic-pose-analysis
- [ ] 2.5 Config merge (emulator toggles, env flags)

**Phase 2.1 Complete**: Identified 4 VERY HIGH value services for migration (backgroundQueue, frameOptimizer, performanceMonitor, sessionContextManager)

### Phase 3: Cleanup 🔜 **FUTURE**
- [ ] 3.1 Delete `mobile/epic-memory-system/`
- [ ] 3.2 Delete `mobile/epic-pose-analysis/`
- [ ] 3.3 Update documentation
- [ ] 3.4 CI/Build verification

### Phase 4: Validation 🔜 **FUTURE**
- [ ] 4.1 Functional smoke tests
- [ ] 4.2 Performance validation
- [ ] 4.3 Regression testing

---

## 7. Next Steps
1. ~~Execute Phase 1 inventory~~ ✅ **COMPLETE** - See `docs/PHASE1_INVENTORY.md`
2. **Code review epic services** identified in inventory (Priority 3 items)
3. **Begin Phase 2** with service consolidation and testing infrastructure migration
4. Confirm answers to remaining open questions (§5)

Once merged, Strength.Design will have a single, faster mobile app that combines the epic UX with our advanced AI/pose capabilities, simplifying maintenance and deployment.***
