# Mobile App Deployment Guide

This guide provides the steps to build and deploy the mobile application to the Apple App Store and Google Play Store using Expo Application Services (EAS).

## Prerequisites

1.  **Node.js**: Ensure you have Node.js (LTS version) installed.
2.  **EAS CLI**: Install the EAS CLI globally.
    ```bash
    npm install -g eas-cli
    ```
3.  **Expo Account**: You need an Expo account. You will be prompted to log in.
    ```bash
    eas login
    ```

## Initial Project Setup

If this is the first time deploying this project from your machine, you need to link the local project to the EAS project.

1.  **Navigate to the mobile directory**:
    ```bash
    cd mobile-working
    ```
2.  **Initialize the EAS Project**: This will create or link to an existing project on EAS and update your `app.json` with the project ID.
    ```bash
    eas project:init
    ```

## Building the Application

The build process creates a native binary (`.ipa` for iOS, `.aab` for Android) that can be submitted to the respective stores.

### iOS Build (TestFlight)

1.  **Start the build**:
    ```bash
    eas build --platform ios
    ```
2.  **Follow the prompts**: The CLI will guide you through the process, including setting up credentials if it's your first time.
3.  **Wait for the build to complete**: EAS will queue the build and execute it on their servers. You can monitor the progress from the link provided in the terminal.

### Android Build (Play Store)

1.  **Start the build**:
    ```bash
    eas build --platform android
    ```
2.  **Follow the prompts**: Similar to iOS, the CLI will guide you through the process.
3.  **Wait for the build to complete**: Monitor the build progress via the provided link.

## Submitting to App Stores

Once the build is complete, you can submit it to the stores.

### iOS Submission (App Store Connect)

1.  **Submit the build**: Use the build ID from the previous step or let EAS choose the latest successful build.
    ```bash
    eas submit --platform ios
    ```
2.  **App Store Connect**: You may need to log in to App Store Connect to provide additional information, especially regarding encryption (`ITSAppUsesNonExemptEncryption`). This can be configured in `app.json`:
    ```json
    {
      "expo": {
        "ios": {
          "infoPlist": {
            "ITSAppUsesNonExemptEncryption": false
          }
        }
      }
    }
    ```

### Android Submission (Google Play Console)

1.  **Submit the build**:
    ```bash
    eas submit --platform android
    ```
2.  **Google Play Console**: Ensure your Google Play Console listing is complete and that you have set up service account credentials for EAS to use for the upload.

## Configuration Files

-   **`eas.json`**: This file configures the build profiles (e.g., `development`, `preview`, `production`). You can customize build settings here.
-   **`app.json`**: This is the main configuration file for your Expo project. It contains settings for the app name, version, bundle identifier, and more. The `eas project:init` command adds an `extra.eas.projectId` field to this file.
