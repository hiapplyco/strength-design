# C++ Exception Diagnostic & Solutions

## Issue
Getting `non-std C++ exception` in RCTMessageThread even with fresh Expo project.

## Environment
- macOS 15.5 (Sequoia) - Apple Silicon M1/M2
- Node v20.15.1
- Expo CLI 0.24.20
- Expo SDK 53

## Root Cause Analysis
The C++ exception in `RCTMessageThread::tryFunc` indicates a native-level issue, likely:
1. **Expo Go incompatibility with macOS 15.5**
2. **Apple Silicon architecture issues**
3. **Expo SDK 53 compatibility problem**

## Solutions to Try (in order)

### 1. Update/Reinstall Expo Go
On your iPhone:
- Delete Expo Go app completely
- Restart phone
- Reinstall Expo Go from App Store
- Make sure it's version 2.33.x or later

### 2. Use Development Build Instead of Expo Go
```bash
cd /Users/jms/Development/strength-design/mobile-working

# Install EAS CLI
npm install -g eas-cli

# Initialize EAS
npx eas build:configure

# Create development build
npx eas build --profile development --platform ios
```

### 3. Run in iOS Simulator
```bash
# Open iOS Simulator first
open -a Simulator

# Then run Expo
npx expo start --ios
```

### 4. Use Older Expo SDK
```bash
# Downgrade to SDK 52
npm uninstall expo
npm install expo@~52.0.0
npx expo install --fix
```

### 5. Clear All Caches
```bash
# Nuclear option - clear everything
watchman watch-del-all
rm -rf node_modules
rm -rf .expo
rm -rf ~/Library/Developer/Xcode/DerivedData
npm cache clean --force
npm install
npx expo start --clear
```

### 6. Create Bare React Native Project
If Expo continues to fail:
```bash
npx react-native@latest init StrengthDesignApp
cd StrengthDesignApp
npx react-native run-ios
```

## Immediate Workaround
Use the web version for demo:
```bash
npx expo start --web
```

## Debug Information Needed
1. What version of Expo Go is on your phone?
2. Does it work in iOS Simulator?
3. Do other Expo apps work on your device?
4. Is your iPhone on iOS 17 or 18?