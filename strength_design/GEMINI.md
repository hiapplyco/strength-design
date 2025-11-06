# Gemini Integration

This document captures how the Strength Design Flutter app integrates with Google’s Gemini models
to generate personalized workouts.

## Overview
- **Use case** – Convert a free-form fitness prompt into a structured workout suggestion.
- **Model** – `gemini-pro` via the `google_generative_ai` Dart package.
- **Entrypoint** – The AI Workout Generator screen at `lib/src/features/workout/ai_workout_screen.dart`.

## Architecture
1. The `AiService` (`lib/src/core/services/ai_service.dart`) wraps `GenerativeModel` and exposes a
   single `generateWorkout` method that accepts plain-text prompts.
2. The `aiServiceProvider` (`lib/src/core/services/ai_service_provider.dart`) lazily constructs
   `AiService`, reading the API key from a compile-time `String.fromEnvironment('GEMINI_API_KEY')`.
3. The AI Workout screen reads the provider, sends the user’s prompt to Gemini, and renders the
   returned text inside a scrollable panel.
4. Errors are caught in the service and surfaced to the UI as readable error strings, ensuring the
   user stays informed even if the API call fails.

## Configuration
Pass your Gemini API key when launching the app:
```bash
flutter run --dart-define=GEMINI_API_KEY=your_gemini_key_here
```
In CI or release builds, set the same define on the build command so the provider can instantiate
`AiService`. Without the define, the provider throws an exception on startup.

## Prompting Guidelines
- Encourage users to supply context such as available equipment, time, and goals to help the model
  give practical output.
- The raw response is rendered verbatim; consider sanitizing or post-processing if future features
  require structured data (e.g., JSON parsing).
- Gemini models may produce variable-length content. The screen’s scrollable container already
  handles longer responses, but a max-length guard can be added if needed.

## Testing
- Widget tests can override `aiServiceProvider` with a fake implementation to validate UI behaviour
  without live API calls.
- Unit tests for `AiService` should focus on error handling (e.g., simulate exceptions) rather than
  real network traffic.

## Operational Notes
- Monitor usage quotas in the Google AI Studio dashboard, especially if you enable automatic testing
  or background generations.
- Rotate API keys regularly and avoid embedding them directly in source control.
