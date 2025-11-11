# iOS Testing Guide for Strength.Design Mobile App

## Quick Start Options

### Option 1: Expo Go (Fastest - Recommended)
1. **Install Expo Go** on your iOS Simulator:
   - Open the iOS Simulator
   - Open Safari in the simulator
   - Go to: https://expo.dev/go
   - Download and install Expo Go

2. **Connect to the app:**
   - Your app is running at: http://localhost:8081
   - In the simulator, open Expo Go
   - Tap "Enter URL manually"
   - Type: `exp://localhost:8081`
   - Press "Connect"

### Option 2: Native Build (Currently Building)
The `npx expo run:ios` command is building a native iOS app. This takes longer but provides:
- Better performance
- Full native capabilities
- No Expo Go limitations

Status: Currently installing CocoaPods dependencies...

### Option 3: Using Physical iPhone
1. Install Expo Go from the App Store on your iPhone
2. Make sure your phone and computer are on the same WiFi network
3. In Terminal, run: `npx expo start`
4. Scan the QR code with your iPhone camera
5. Tap the notification to open in Expo Go

## Current Setup

### Services Running:
- ✅ **Web Server**: http://localhost:8081 (Expo/Metro bundler)
- ✅ **Firebase Emulators**: 
  - Auth: http://localhost:9099
  - Firestore: http://localhost:8080
  - Functions: http://localhost:5001
  - UI: http://localhost:4001

### Test Credentials:
- Email: `test@test.com`
- Password: `test123`

OR

- Email: `demo@example.com`
- Password: `demo123456`

## Troubleshooting

### If Expo Go crashes:
```bash
# Clear cache and restart
npx expo start -c
```

### If simulator doesn't connect:
```bash
# Kill all processes and restart
killall -9 node
cd /Users/jms/Development/strength-design/mobile
npm run ios
```

### To see logs:
```bash
# In a new terminal
npx react-native log-ios
```

## Features to Test

1. **Authentication**
   - Sign in with test credentials
   - Sign up for new account
   - Biometric authentication (FaceID in simulator)

2. **AI Workout Generator**
   - Tap "Generator" tab
   - Chat with AI coach
   - Watch progress bar fill
   - Generate workout plan

3. **Workouts**
   - View daily workout cards
   - Edit exercises
   - Mark workouts complete

4. **Search**
   - Natural language search
   - "chest exercises for muscle"
   - "high protein breakfast"

5. **Profile**
   - Update fitness goals
   - Change preferences
   - View stats

## Development Tips

### Hot Reload:
- Shake the device/simulator or press `Cmd + D` to open developer menu
- Select "Fast Refresh" to enable hot reload

### Debug Menu:
- `Cmd + D` in simulator opens debug menu
- Can inspect elements, view performance, etc.

### Network Inspection:
- Use React Native Debugger for network requests
- Or use Flipper for advanced debugging

## Current Build Status

The native iOS build is in progress. Once complete, the app will automatically launch in your simulator. This provides the best testing experience with full native capabilities.

Meanwhile, you can use Expo Go for immediate testing!