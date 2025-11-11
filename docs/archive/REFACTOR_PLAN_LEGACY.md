
# Mobile App Refactoring & Unification Plan

## 1. Executive Summary

This document outlines the technical plan to refactor the legacy React Native mobile application by integrating the architecture, backend services, and UI/UX patterns from the newer `@epic-memory-system` web application. The goal is to create a single, modern, and performant React Native codebase.

**Core Hypothesis:** The `@epic-memory-system` project represents the target architecture. Its "faster APIs" are assumed to be Firebase Functions, and its UI is the design target.

**Methodology:** This is not a direct code merge. It is a strategic, phased refactoring process involving the translation of web-specific implementations (React DOM, CSS) into their React Native equivalents, while connecting to the new Firebase-based backend. All new code will be written in TypeScript to improve maintainability and type safety.

---

## 2. Phase 1: Foundational Rearchitecture

This phase focuses on replacing the foundational layers of the application: backend communication and authentication.

### 2.1. Service Layer Consolidation

The existing service layer in `/services` will be deprecated in favor of a new layer that communicates directly with the Firebase Functions defined in `/epic-memory-system/functions`.

**Technical Steps:**

1.  **Analyze Firebase Functions:** Identify all callable HTTPS functions within `/epic-memory-system/functions/src/*.ts`. These are the new API endpoints.
2.  **Install Firebase Dependencies:** Add the necessary Firebase client libraries to `mobile/package.json`:
    ```bash
    npm install @react-native-firebase/app @react-native-firebase/functions @react-native-firebase/auth
    ```
3.  **Create a Unified Firebase Client:** A single, configured Firebase client will be created.
    *   **File:** `mobile/src/lib/firebase.ts`
    *   **Purpose:** Initialize the Firebase app and export instances of the services (Auth, Functions). This abstracts the setup from the rest of the application.
4.  **Refactor Services:** For each legacy service, a new TypeScript service will be created.
    *   **Example (`aiService`):**
        *   **Legacy:** `mobile/services/aiService.js` (makes a REST call to a custom backend)
        *   **New:** `mobile/src/services/aiService.ts`
        *   **Implementation:**
            ```typescript
            import { functions } from '../lib/firebase';
            import { httpsCallable } from 'firebase/functions';

            // Assumes a Firebase Function named 'generateWorkout'
            const generateWorkoutFn = httpsCallable(functions, 'generateWorkout');

            export const AI_Service = {
              generateWorkout: async (userContext: any): Promise<any> => {
                try {
                  const result = await generateWorkoutFn({ context: userContext });
                  return result.data;
                } catch (error) {
                  console.error("Error calling generateWorkout function:", error);
                  throw error;
                }
              }
            };
            ```

### 2.2. Authentication Migration

The legacy authentication flow will be replaced with Firebase Authentication.

**Technical Steps:**

1.  **Translate Auth UI:** The React components from `/epic-memory-system/src/pages/Auth.tsx` and `FirebaseAuth.tsx` will be translated into React Native components.
2.  **Implement Firebase Auth Logic:** The new login/signup screens will use the `@react-native-firebase/auth` module to handle user creation, sign-in, and session management.
    ```typescript
    // Example snippet for a new LoginScreen.tsx
    import auth from '@react-native-firebase/auth';

    const handleLogin = async (email, password) => {
      try {
        await auth().signInWithEmailAndPassword(email, password);
        // Navigate to HomeScreen
      } catch (error) {
        // Handle login errors
      }
    };
    ```
3.  **Deprecate Legacy Screens:** `LoginScreen.js` and `SimpleLoginScreen.js` will be removed post-migration.

---

## 3. Phase 2: UI/UX Unification

This phase focuses on creating a consistent design system and translating shared components.

### 3.1. Establish React Native Design System

A new design system will be created based on the web project's styles.

**Technical Steps:**

1.  **Translate Design Tokens:** The variables defined in `/epic-memory-system/src/lib/design-tokens.ts` will be converted into a JavaScript object for use with React Native's `StyleSheet`.
    *   **File:** `mobile/src/styles/theme.ts`
2.  **Create Themed Components:** Instead of using global CSS classes, we will create higher-order components or hooks that consume this theme object.
3.  **Translate Glassmorphism:** The CSS-based glassmorphism from `/epic-memory-system/src/lib/glassmorphism.ts` will be replicated using libraries like `@react-native-community/blur` for the blur effect and `react-native-linear-gradient` for frosted glass effects.
4.  **Deprecate Legacy Components:** `GlassmorphismComponents.js` will be deprecated.

### 3.2. Component Translation

Shared UI components will be translated from React DOM to React Native.

**Example (`Card` component):**

*   **Web (`/epic-memory-system/src/components/Card.tsx`):**
    ```jsx
    // Uses <div>, CSS classes for styling
    const Card = ({ children }) => <div className="card shadow-lg">{children}</div>;
    ```
*   **React Native (`mobile/src/components/Card.tsx`):**
    ```jsx
    // Uses <View>, StyleSheet for styling
    import { View, StyleSheet } from 'react-native';
    import { theme } from '../styles/theme';

    const Card = ({ children }) => <View style={styles.card}>{children}</View>;

    const styles = StyleSheet.create({
      card: {
        backgroundColor: theme.colors.cardBackground,
        borderRadius: theme.borderRadius.large,
        padding: theme.spacing.medium,
        // iOS shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        // Android shadow
        elevation: 5,
      },
    });
    ```

---

## 4. Phase 3: Screen-by-Screen Replacement

Legacy screens will be progressively replaced with new, refactored screens.

| Priority | Feature | Legacy Screen(s) | New Screen | Technical Notes |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Workout Generation** | `WorkoutGeneratorScreen.js`, `EnhancedGeneratorScreen.js` | `WorkoutGeneratorScreen.tsx` | Will use the new `aiService.ts` and translated UI components. |
| **2** | **AI Chat** | `EnhancedAIWorkoutChat.js`, `StreamingChatScreen.js` | `ProgramChatScreen.tsx` | UI translated from `ProgramChat.tsx`. Will connect to a new `chatService.ts` backed by a Firebase Function. |
| **3** | **Workout History** | `WorkoutsScreen.js` | `WorkoutHistoryScreen.tsx` | Will fetch data from Firestore via a new `workoutHistoryService.ts`. |
| **4** | **Movement Analysis** | `PoseAnalysisScreen.js`, `PoseProgressScreen.js` | `MovementAnalysisScreen.tsx` | This is a high-effort task. It requires translating the UI from `VideoAnalysis.tsx` while integrating with native device capabilities (camera, video processing) using libraries like `react-native-vision-camera`. |

---

## 5. Phase 4: Finalization

1.  **Code Removal:** Once a feature is fully migrated, the corresponding legacy files in `/screens`, `/components`, and `/services` will be deleted.
2.  **Dependency Cleanup:** The `mobile/package.json` will be audited. All web-specific dependencies (e.g., `react-dom`, postcss, tailwindcss) and redundant packages will be removed.
3.  **Monorepo Consideration:** The nested projects `/epic-memory-system` and `/epic-pose-analysis` should be archived or removed from the `mobile` directory to finalize the consolidation into a single, cohesive application structure.
