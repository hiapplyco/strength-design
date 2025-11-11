# Strength.Design Mobile Deployment Playbook
> Last updated: 2025-01-17 • Owners: Mobile + Infra • Scope: Web, Mobile (Expo), Firebase Functions, Knowledge Pipeline

This single document replaces the previous documentation tree. It captures the architecture, dependencies, and release-critical tasks needed to confidently ship the mobile app while keeping the web app, shared services, and AI backends aligned.

---

## 1. System Snapshot
| Area | Status | Notes |
|------|--------|-------|
| **Web App (`/src`)** | ✅ Production | React 19 + Vite, Firebase v9 modular SDK, Plausible analytics hooks, Stripe checkout |
| **Mobile App (`/mobile`)** | 🚀 Feature-complete, pre-store | Expo SDK 53 / React Native 0.79, glassmorphism UI, offline caches, Gemini-powered chat/workouts |
| **Cloud Functions (`/functions`)** | ✅ Live | Node 20 runtime, Gemini 2.5 Flash endpoints, Perplexity-backed search, Stripe + notifications scaffolding |
| **Knowledge Pipeline (`/knowledge-pipeline`)** | ✅ Ready | TypeScript ingestor feeding Firestore knowledge collection with Gemini summarization |
| **Shared Assets** | ✅ Stable | `comprehensive-exercises.csv`, `packages/muscle-anatomy-tools` scripts, Tailwind tokens in `components.json` |

---

## 2. Monorepo Map
| Path | Purpose |
|------|---------|
| `README.md`, `CLAUDE.md` | High-level overview + AI coding standards |
| `src/` | Web application (pages such as `src/pages/WorkoutGenerator.tsx`, contexts, Zustand stores) |
| `mobile/` | Expo project (`screens/`, `services/`, `contexts/`, `components/`, `.env.example`, native assets) |
| `functions/` | Firebase Functions (AI, programs, payments, notifications, pose, utils) |
| `knowledge-pipeline/` | Reddit/Wikipedia ingestion, CLI + configs feeding Firestore + AI enrichment |
| `packages/muscle-anatomy-tools/` | Scripts + assets powering 3D muscle visualizer |
| `public/`, `firebase.json`, `firestore.rules`, `storage.rules` | Web assets + Firebase resource definitions |
| `scripts/`, `agents/`, `.claude/` | Automation helpers and AI work items |

---

## 3. Web Application Baseline
- **Entry + Routing**: `src/main.tsx` bootstraps `App.tsx` with React Router routes under `src/pages/`.
- **Core Pages**: Workout generator (`src/pages/WorkoutGenerator.tsx`), Journal (`src/pages/JournalPage.tsx`), Program chat (`src/pages/ProgramChat.tsx`), Nutrition diary (`src/pages/NutritionDiary.tsx`), Checkout + Stripe callbacks, Firebase auth screens.
- **State & Data**: Firebase services via `src/lib/firebase/config.ts`, TanStack Query hooks for workouts, `src/stores` for UI/usage, analytics helpers in `src/lib/analytics.ts` tied to Plausible.
- **UI System**: Tailwind + CSS modules, glassmorphism components mirrored from mobile design tokens.
- **Key Services**: `src/lib/services/exerciseSearchService.ts` and `src/lib/services/searchAnalyticsService.ts` provide the same filtering logic used on mobile; shared hooking ensures parity.

---

## 4. Mobile Architecture Overview
### UI & Navigation
- **Navigation**: React Navigation stacks + bottom tabs defined in `mobile/screens/HomeScreen.js` and companions.
- **Key Screens**:
  - `ContextAwareGeneratorScreen.js`: Gemini chat with context, streaming, AI workout cards.
  - `UnifiedSearchScreen.js`: Dual exercise + nutrition search with filter presets and selection hand-off.
  - `WorkoutsScreen.js`, `WorkoutResultsScreen.js`, `WorkoutGeneratorScreen.js`: Workout browsing, saving, and deep dives.
  - Pose workflow (`mobile/screens/pose/*.js` + `PoseAnalysis*` screens): Upload, analysis, and insights.
  - `LoginScreen.js` + biometric handoff, `ProfileScreen.js`, `NutritionDiary` parity screens.
- **Design System**: Glassmorphic components (`mobile/components/GlassmorphismComponents.js`, `GlassSearchInput.js`, etc.), gradients via `expo-linear-gradient`, blur surfaces via `expo-blur`, dynamic theming through `contexts/ThemeContext.tsx`, haptics via `expo-haptics`.

### Service Layer & Offline Support
- `services/contextAggregator.js`: Aggregates Firestore profile, workouts, nutrition, health metrics, and AsyncStorage caches for AI calls with 30‑minute TTL.
- `services/aiService.js`: Wraps callable functions (`enhancedChat`, `generateFormAwareWorkout`, etc.), manages session state, caching, and integrates `formContextService`.
- `services/formContextService.js`: Bridges pose analysis outputs with AI coaching via callable functions (`summarizeFormData`, `calculateFormCompetency`, `buildFormContext`).
- `services/searchService.js`: Local JSON-backed exercise DB with boolean operators, fuzzy search, filter presets, result caching.
- `services/NutritionService.js`: USDA API integration with rich local fallback dataset and caching, powering unified search.
- `services/WorkoutService.js`: Handles context-aware workout generation, saving to `users/{uid}/workouts`, fetching history, summarizing.
- `services/healthService.js`: HealthKit/Google Fit scaffolding with permission caching, sync toggles, and placeholder alerts for simulators.
- `services/poseDetection/*`: Types + analyzers for on-device pose processing (Gemini Nano 2 concept), feeding `poseProgressService`.
- `services/storageService.js`, `usageTrackingService.js`, `contentDeliveryService.js`, `tutorialService.js`, `chatSessionService.js`: AsyncStorage-backed caches, push payload builders, onboarding flows, and analytics hooks.

### Offline & Caching
- AsyncStorage keys documented inside each service (e.g., `@ai_coaching_cache`, `@health_sync_enabled`).
- Local data assets: `mobile/assets/wrkout-exercises-full.json`, `comprehensive-exercises.csv`.
- Search + nutrition operate offline-first; AI + Firestore queue retries with backoff and optimistic UI states.

---

## 5. Backend & AI Services
### Firebase Functions (`functions/src`)
- **AI** (`functions/src/ai/`):
  - `generateWorkout.ts`: Structured multi-day plan generator, strict JSON validation, metadata injection.
  - `generateStructuredWorkout.ts`, `generateWorkoutSummary.ts`, `generateWorkoutTitle.ts`: Post-processing helpers.
  - `chatWithGemini.ts`: General chat endpoint with optional file attachments via Storage.
  - `streamingChat.ts` / `streamingChatEnhanced.ts`: SSE streaming responses with saved exercise context and SSE framing.
  - `enhancedChat.ts`, `formAwareCoaching.js`, `formDataSummarizer.js`: Form-aware conversational logic powering AI coaching modules.
  - `analyzeYoutubeVideo.ts`, `generateVideoNarration.ts`: Video pipeline helpers.
- **Programs & Search** (`functions/src/programs/searchPrograms.ts`): Perplexity-backed search results with caching.
- **Exercises & Knowledge** (`functions/src/exercises/*`, `functions/src/knowledge/*`): Callable functions for exercise search, ingest/search knowledge base.
- **Pose** (`functions/src/pose/formContextBuilder.ts`): Builds historical context for form analysis streams.
- **Payments** (`functions/src/payments/*`, `functions/src/stripe`): Stripe-related endpoints.
- **Notifications** (scaffolded) and `utils` for shared logging/CORS.
- **Config**: Node 20 runtime (`functions/package.json`), secrets handled via `defineSecret("GEMINI_API_KEY")`, consistent `corsHandler`.

### Firestore Schema Highlights
- `users/{uid}`: profile, fitness profile, nutrition settings, subscription data.
- Subcollections: `workouts`, `workoutSessions`, `workoutHistory`, `savedExercises`, `notifications`, `healthSync`, `poseAnalyses`.
- Global collections: `exercises`, `knowledge`, `nutritionFoods`, `programs`, `dailyWorkouts`, `usageStats`.
- Storage buckets segmented for workouts, nutrition uploads, pose videos, voice memos as described in the previous schema doc.

### Knowledge Pipeline (`knowledge-pipeline/`)
- TS CLI (`src/fitness-ingestor.ts`) pulls Reddit + Wikipedia, enriches via Gemini 2.5 Flash, writes to Firestore through `functions/src/knowledge`.
- Config-driven sources (`config/fitness-sources.json`), caching, quality scoring, deduping, and ingestion scripts (`npm run ingest:test`, `npm run ingest:all -- --limit <n>`).

---

## 6. Integrations & External Services
- **Gemini 2.5 Flash**: Primary real-time model for chat + workouts (mobile + functions). Pro model reserved for heavy generation (`generateStructuredWorkout` future use). Ensure consistent model IDs (see §8).
- **Perplexity Search**: Program discovery via `services/PerplexitySearchService.js` and callable functions.
- **USDA FoodData Central**: Nutrition API with API key stored via env/Secrets, fallback dataset ensures offline capability.
- **Apple Health / Google Fit**: HealthKit scaffolding now, full native bridges pending; hooks in `healthService`.
- **Plausible Analytics**: Web instrumentation via `src/lib/analytics.ts`; mobile logging via `services/usageTrackingService.js` ready to emit to analytics backend.
- **Stripe**: Payment flows in web pages (`src/pages/Pricing.tsx`, `CheckoutSuccess.tsx`, etc.) with associated functions.
- **Twilio Phone Auth**: Legacy support documented in prior setup; phone auth provider currently only enabled on web.
- **Expo Push Notifications**: Placeholder in `services/notifications/` with server-side scheduling ready once credentials are added.

---

## 7. Configuration & Secrets
- **Web (`.env.local`)**: `VITE_FIREBASE_*`, `VITE_PLAUSIBLE_DOMAIN`, Stripe keys, optional emulator toggles.
- **Mobile (`mobile/.env.example`)**: `EXPO_PUBLIC_FIREBASE_*`, pose analysis feature flags, performance knobs, analytics toggles. Copy to `.env` or `.env.local` for Expo.
- **Functions**: Secrets via `firebase functions:secrets:set GEMINI_API_KEY`, other provider keys (USDA, Perplexity, Stripe) stored as runtime config or secrets.
- **EAS / Native**:
  - Bundle identifiers must be set to `com.strengthdesign.app` (currently `com.hiapplyco.mobile-working` placeholders).
  - Configure `eas.json` build profiles and `app.json` / `app.config.js` with release channel metadata.
- **Security Rules**: `firestore.rules`, `storage.rules`, and `firestore.rules.dev` exist; deploy with `firebase deploy --only firestore:rules,storage:rules` before release.

---

## 8. Mobile Deployment Readiness
### Pre-Build Audit (blockers)
1. **Model Version Alignment**: Ensure mobile services and callable functions all target `gemini-2.5-flash` (fix hardcoded `gemini-2.5-flashflash` references in chat flows).
2. **Error Handling / Boundaries**: Wrap primary screens with error boundaries, route handled errors to Sentry (hook points in `mobile/services/usageTrackingService.js`).
3. **Analytics & Telemetry**: Wire `usageTrackingService` to Plausible/GA4 or Firebase Analytics for chat usage, workout generation, health sync toggles.
4. **Bundle Identifiers & App Metadata**: Update `app.json` (or `app.config.ts`) for `com.strengthdesign.app` + store listing assets.
5. **Health SDK Integrations**: Replace placeholder `healthService` alerts with real HealthKit/Google Fit bridges; ensure permission prompts tested on device.
6. **Shared Context Schema**: Standardize payload passed from mobile to `enhancedChat`/`generateStructuredWorkout` (align with `UserContext` interface in §5).
7. **Push Notification Credentials**: Configure Expo push keys + Firebase Cloud Messaging if notifications are part of launch scope.

### Build & Release Steps
```bash
# 1. Install deps
cd mobile
npm install

# 2. Verify local dev
npm run ios          # simulator
npm run android      # emulator
npm run web          # Expo web build

# 3. Prepare native builds
eas build --profile preview --platform ios
eas build --profile preview --platform android
# or use production profile once bundle IDs + store assets ready

# 4. Cloud Functions / Backend
cd ../functions
npm install
npm run build
firebase deploy --only functions

# 5. Smoke tests
expo start --dev-client
```

### Validation Matrix
| Area | What to verify |
|------|----------------|
| Auth | Email/password, Google sign-in (web), biometric unlock, logout, account deletion |
| AI Chat | Streaming responses, cached responses, retry flows, context toggles (form-aware vs general) |
| Workout Generation | Multi-day plans saved to Firestore, structured cards on `WorkoutResultsScreen`, editing/favorites |
| Exercise Search | Filters, offline results, bridging selections into chat/request builder |
| Nutrition | USDA API search, local fallback, logging flows |
| Pose Analysis | Upload, processing pipeline, AI coaching cards, progress dashboard |
| Health Sync | Permission prompts, toggle persistence, background sync scheduling |
| Notifications | In-app reminders + push scheduling (if in scope) |
| Offline Mode | Cached exercises/nutrition, queued workout logging, reconnection sync |

---

## 9. Known Gaps & Action Items
### P0 (Block Release)
1. **Gemini model ID mismatch** across `mobile/services/*` and `functions/src/ai/*`.
2. **Bundle identifier + store assets** updates (`app.json`, icons, splash).
3. **Robust error boundaries + crash reporting** wrappers for high-risk screens.

### P1 (Pre-launch polish)
1. Finish HealthKit/Google Fit adapters (`mobile/services/healthService.js` stubs → native modules).
2. Align design tokens across web/mobile (primary color + gradients).
3. Add analytics events for chat, search, workout completion.
4. Finalize push notification scheduling pipeline (client + `notifications/` functions).

### P2 (Post-launch)
1. Feature flags + remote config for experimentation.
2. Advanced social features (sharing, leaderboards).
3. Expand KnowledgeService surfaces inside mobile chat + search.
4. Additional localization + accessibility audits.

---

## 10. Operational Runbook
| Task | Command / Location |
|------|--------------------|
| Web dev server | `npm install && npm run dev` (root) |
| Web build | `npm run build` (Vite) |
| Mobile dev | `cd mobile && npm install && npx expo start` |
| Mobile scripts | `run-simulator.sh` for quick simulator boot; `mobile/scripts/createDemoAccount.js` seeds demo data |
| Firebase emulators | `firebase emulators:start` (root or `functions/`) |
| Cloud Functions deploy | `cd functions && npm run deploy` |
| Knowledge ingestion | `cd knowledge-pipeline && npm install && npm run ingest:test` |
| Analytics review | Plausible dashboard + `src/lib/analytics.ts` event list |
| Monitoring | Sentry (web + mobile), Firebase Performance, Cloud Logging |

---

## 11. Reference Appendix
| Feature | Primary Files |
|---------|---------------|
| AI Chat (mobile) | `mobile/screens/ContextAwareGeneratorScreen.js`, `mobile/services/aiService.js` |
| Exercise Search | `mobile/screens/UnifiedSearchScreen.js`, `mobile/services/searchService.js`, `src/lib/services/exerciseSearchService.ts` |
| Workout Generation | `mobile/services/WorkoutService.js`, `functions/src/ai/generateWorkout.ts`, `src/pages/WorkoutGenerator.tsx` |
| Pose Analysis | `mobile/screens/PoseAnalysis*.js`, `mobile/services/poseDetection/PoseAnalysisService.ts`, `functions/src/pose/formContextBuilder.ts` |
| Nutrition | `mobile/services/NutritionService.js`, `src/pages/NutritionDiary.tsx` |
| Health Integration | `mobile/services/healthService.js`, `mobile/services/progressDataAggregator.js` |
| Knowledge Search | `mobile/services/KnowledgeService.js`, `functions/src/knowledge/*`, `knowledge-pipeline/src/fitness-ingestor.ts` |
| Payments | `src/pages/Pricing.tsx`, `src/pages/CheckoutSuccess.tsx`, `functions/src/stripe/*` |

---

### How to Keep This Doc Current
- Update this file whenever architecture, env expectations, or release criteria change.
- Link new modules or services under the Appendix table instead of creating new stand-alone docs.
- Record outstanding launch blockers directly in §9 so the release team has a source of truth.

This playbook is now the authoritative reference for preparing and shipping the Strength.Design mobile application.***
