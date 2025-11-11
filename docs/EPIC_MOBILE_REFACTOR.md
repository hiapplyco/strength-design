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
| Area | `mobile/` (existing) | `mobile/epic-memory-system/mobile` |
|------|---------------------|------------------------------------|
| **Expo / RN** | Expo 54.0.0, RN 0.81.5 | Expo 53.x, RN 0.79.5 |
| **Firebase config** | Env-driven (`firebaseConfig.js`), AsyncStorage persistence | Hard-coded prod keys + optional emulator toggles |
| **Services** | Full suite: AI, pose, context, nutrition, knowledge, etc. | Subset (search, workout, health) |
| **Navigation** | Tab + stack linking pose + AI screens | Epic UX flows, but older service bindings |
| **Docs / assets** | Root-level docs, assets | Entire nested repo (functions, packages, docs, etc.) |

**Risks if left as-is**:
- Duplicate dependencies (`npm install` runs twice), conflicting Firebase configs, mismatched Expo SDKs.
- High maintenance cost (two copies of services/functions).
- Builds may break because the root project references files not present in the epic sub-tree or vice versa.

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
1. **Delete nested repo**:
   - Remove `mobile/epic-memory-system` after confirming all needed files/scripts/docs have been absorbed or superseded.
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
1. **Expo SDK**: Proceed with Expo 54 / RN 0.81 as target? (Default assumption is yes.)
2. **Firebase Functions / packages**: Any modules unique to `epic-memory-system/functions` that still need migration, or is the repo root authoritative?
3. **Remaining doc assets**: Should any epic docs stay verbatim, or will summaries inside the deployment playbook suffice?

---

## 6. Next Steps
1. Confirm answers to open questions (especially SDK choice and whether we can remove `mobile/epic-memory-system` entirely post-merge).
2. Execute Phase 1 inventory scripts and produce a file map (can be added to this document’s appendix).
3. Begin Phase 2 with navigation + config merge, followed by services.

Once merged, Strength.Design will have a single, faster mobile app that combines the epic UX with our advanced AI/pose capabilities, simplifying maintenance and deployment.***
