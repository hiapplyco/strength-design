# Strength Design (Flutter)

Strength Design is the Flutter implementation of the Strength Design mobile experience.  
The app brings together Firebase Authentication, an exercise library backed by Firestore and
sqflite caching, an AI workout generator powered by Gemini, nutrition tracking with
OpenFoodFacts, and daily health metrics sourced from Apple Health / Google Fit.

## Feature Highlights
- **Authentication** – Email flows delivered through `firebase_ui_auth`, with routing handled by `go_router`.
- **Exercise Library** – Exercises load from Firestore and are cached locally via `sqflite` for offline access.
- **AI Workout Generator** – Gemini (`google_generative_ai`) produces contextual workouts from free-form prompts.
- **Nutrition Tracking** – Search foods through OpenFoodFacts and log macros with Riverpod state.
- **Health Dashboard** – The `health` plugin surfaces today’s steps, active energy, and workouts on the home screen.
- **State Management** – The app is composed with `flutter_riverpod`, enabling composable providers and testable business logic.

## Project Structure
```
lib/
  firebase_options.dart        // Firebase config generated via FlutterFire CLI
  main.dart                    // App bootstrap with ProviderScope + router
  src/
    core/                      // Cross-cutting concerns (router, services, theme)
    data/                      // Models and repositories (Firestore, sqflite, APIs)
    features/                  // Feature-specific UI & state (home, workout, nutrition)
```

## Prerequisites
- Flutter SDK 3.5 or newer (Dart 3.5+)
- An initialized Firebase project (use `flutterfire configure` to regenerate `firebase_options.dart` if needed)
- iOS or Android tooling for running Flutter apps (Xcode, Android Studio/SDK)
- Google Gemini API key for workout generation (obtain from [ai.google.dev](https://ai.google.dev/))

## Setup
1. Install Flutter and confirm it works: `flutter doctor`
2. Install dependencies:
   ```bash
   flutter pub get
   ```
3. Configure Firebase:
   - Replace `firebase_options.dart` by running the FlutterFire CLI, or keep the existing config if it already points at your project.
4. (Optional) Seed Firestore with exercise documents matching the `Exercise` model schema.

## Running the App
Provide your Gemini key via a Dart define when launching:
```bash
flutter run --dart-define=GEMINI_API_KEY=your_gemini_key_here
```

For iOS simulators or Android emulators, ensure Health permissions are granted in the device settings to populate the home dashboard.

## Testing
Execute the full test suite:
```bash
flutter test
```

## Configuration Notes
- **Gemini** – The AI module throws a clear error if `GEMINI_API_KEY` is missing; add it to `launch.json` or your CI secrets.
- **OpenFoodFacts** – Uses the public API and does not require an API key, but you should set a descriptive `UserAgent` before shipping.
- **sqflite Cache** – Exercise data persists to the on-device SQLite database. Delete the app or clear the database if you need to reset cached data.

## Troubleshooting
- Running into `Operation not permitted` errors on macOS? Allow Flutter to manage its cache directories or rerun with elevated permissions.
- If Health metrics show zero values, open Apple Health/Google Fit to sync fresh data, then tap “Refresh” in the dashboard.
- For authentication issues, verify the Firebase project has Email/Password enabled and the iOS/Android bundle IDs match your app.
