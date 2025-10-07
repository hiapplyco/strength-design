
# Implementation Plan

This document outlines the phased implementation plan for building the Strength Design Flutter application.

## Journal

**Phase 3: Authentication**

*   **Challenge:** I encountered significant issues with the `google_sign_in` package due to breaking changes in version 7.0.0. The documentation and examples I found were outdated, leading to a loop of analyzer errors.
*   **Solution:** To resolve this, I switched to the `firebase_ui_auth` package, which provides a pre-built UI for Firebase Authentication. This simplified the implementation and resolved the errors quickly.
*   **Learning:** It's crucial to check the changelog for breaking changes when using packages, and to use higher-level libraries like `firebase_ui_auth` when available to simplify development and avoid common pitfalls.

## Phase 1: Project Setup

- [x] Create a new Flutter project named `strength_design` in the `strength_design` directory.
- [x] Remove any boilerplate code from the `lib` and `test` directories.
- [x] Update the `pubspec.yaml` file with the project description and set the version to `0.1.0`.
- [x] Create a placeholder `README.md` file with a brief description of the project.
- [x] Create a `CHANGELOG.md` file with an initial entry for version `0.1.0`.
- [x] Commit the initial project setup to the current branch.

## Phase 2: Core Architecture & UI Shell

- [x] Add dependencies: `flutter_riverpod`, `go_router`, `firebase_core`.
- [x] Set up the feature-based project structure as defined in `DESIGN.md`.
- [x] Implement the main `MaterialApp.router` with the initial `go_router` configuration.
- [x] Create a basic app shell with a `BottomNavigationBar`.
- [x] Implement the glassmorphism theme using `BackdropFilter` and create a few reusable glassmorphism widgets.
- [x] Wrap the app in a `ProviderScope` to enable Riverpod.
- [x] Create unit tests for any new utilities or services.
- [x] Run `dart_fix`, `analyze_files`, `flutter test`, and `dart_format`.
- [x] Update the Journal in this document.
- [x] Commit the changes.

## Phase 3: Authentication

- [x] Add dependencies: `firebase_auth`, `google_sign_in`.
- [x] Implement an authentication service to handle user sign-in, sign-out, and registration.
- [x] Create the UI for the login and sign-up screens.
- [x] Implement the authentication flow using `go_router` redirects.
- [x] Create a Riverpod provider to manage the authentication state.
- [x] Create widget tests for the login and sign-up screens.
- [x] Run `dart_fix`, `analyze_files`, `flutter test`, and `dart_format`.
- [x] Update the Journal in this document.
- [x] Commit the changes.

## Phase 4: Exercise Library

- [x] Add dependencies: `cloud_firestore`, `sqflite`.
- [x] Define the data models for exercises.
- [x] Implement a repository to fetch exercises from Firestore and cache them in `sqflite`.
- [x] Create the UI for the exercise library screen, including search functionality.
- [x] Create the UI for the exercise detail screen.
- [x] Create widget tests for the exercise library and detail screens.
- [x] Run `dart_fix`, `analyze_files`, `flutter test`, and `dart_format`.
- [x] Update the Journal in this document.
- [x] Commit the changes.

## Phase 5: AI Workout Generation

- [ ] Add the `google_generative_ai` dependency.
- [ ] Implement a service to interact with the Gemini API.
- [ ] Create the UI for the AI chat screen for workout generation.
- [ ] Integrate the AI service with the UI using Riverpod.
- [ ] Create widget tests for the AI chat screen.
- [ ] Run `dart_fix`, `analyze_files`, `flutter test`, and `dart_format`.
- [ ] Update the Journal in this document.
- [ ] Commit the changes.

## Phase 6: Nutrition Tracking

- [ ] Research and add a suitable nutrition database API package.
- [ ] Implement a service and repository for nutrition data.
- [ ] Create the UI for nutrition search and logging.
- [ ] Create widget tests for the nutrition screens.
- [ ] Run `dart_fix`, `analyze_files`, `flutter test`, and `dart_format`.
- [ ] Update the Journal in this document.
- [ ] Commit the changes.

## Phase 7: Health Integration

- [ ] Add the `health` package dependency.
- [ ] Implement a service to handle communication with Apple Health and Google Fit.
- [ ] Integrate the health service with the workout tracking features.
- [ ] Create unit tests for the health service.
- [ ] Run `dart_fix`, `analyze_files`, `flutter test`, and `dart_format`.
- [ ] Update the Journal in this document.
- [ ] Commit the changes.

## Phase 8: Finalization

- [ ] Create a comprehensive `README.md` file for the project.
- [ ] Create a `GEMINI.md` file that describes the app, its purpose, and implementation details.
- [ ] Ask for a final review of the app and the code.

After completing a task, if you added any TODOs to the code or didn't fully implement anything, make sure to add new tasks so that you can come back and complete them later.
