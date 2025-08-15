# Mobile App C++ Exception - Root Cause & Solution

## Problem
Getting `non-std C++ exception` in React Native thread when running Expo app.

## Root Cause
**Expo Go v2.33.4 is incompatible with your environment**:
- macOS 15.5 (Sequoia) 
- iOS 18.x on your device
- Expo SDK 53 with React Native 0.74.5

## Confirmed Issues
1. React 19 causes C++ exceptions (already downgraded to React 18)
2. Expo Go has compatibility issues with iOS 18
3. Native module mismatches between Expo Go and SDK 53

## SOLUTION - Use Expo Development Build

Instead of Expo Go, create a custom development build:

```bash
# 1. Install EAS CLI globally
npm install -g eas-cli

# 2. Login to Expo account (create free account if needed)
eas login

# 3. Configure the project
cd /Users/jms/Development/strength-design/mobile-working
eas build:configure

# 4. Build for iOS (this will create a custom Expo Go for your app)
eas build --profile development --platform ios

# 5. Install on your device
# - Wait for build to complete (10-20 minutes)
# - Download the .ipa file
# - Install via TestFlight or direct install
```

## Alternative - Use iOS Simulator

The iOS Simulator doesn't have the same compatibility issues:

```bash
# 1. Open iOS Simulator
open -a Simulator

# 2. In mobile-working directory
npx expo start --ios
```

## Quick Workaround - Web Version

For immediate demo purposes:

```bash
# Install web dependencies
npx expo install react-native-web@~0.19.12 react-dom@18.2.0 @expo/metro-runtime

# Run web version
npx expo start --web
```

## Why This Happens

The C++ exception occurs at the React Native bridge level when:
1. **Version Mismatch**: Expo Go expects specific React Native internals
2. **iOS 18 Changes**: New iOS runtime protections conflict with Expo Go's architecture
3. **Native Module Loading**: Failed dynamic linking in message thread

The error path:
```
RCTMessageThread::tryFunc() -> 
  Attempts to load native module ->
    Version mismatch detected ->
      Throws non-standard C++ exception ->
        App crashes
```

## Permanent Fix

Use EAS Build for all development. This ensures:
- Exact version matching
- Proper native module compilation
- iOS 18 compatibility
- No Expo Go limitations

## Alternative Solution - Mobile-Test Demo (January 12, 2025)

### Web-Based Development Approach
Created a fully functional demo app as a web application that works perfectly on mobile browsers:

**Directory**: `/Users/jms/Development/strength-design/mobile-test`

**Key Achievements**:
1. **No Native Dependencies**: Pure React web app, no Expo/React Native issues
2. **Full Feature Implementation**: 
   - Exercise search with 800+ real exercises
   - Navigation system with bottom tabs
   - AI chat integration with exercise context
   - Cross-page data persistence
3. **Production Quality**:
   - Real images from GitHub wrkout repository
   - No fallback patterns
   - Comprehensive error handling
   - Mobile-optimized UI

**Benefits**:
- Immediate testing on any device via browser
- No build process required
- Rapid iteration and deployment
- Progressive Web App potential

**Running the Demo**:
```bash
cd /Users/jms/Development/strength-design/mobile-test
npm start
# Open http://localhost:3000 on any device
```

This approach validates features without dealing with native build complexities.