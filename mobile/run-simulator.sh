#!/bin/bash

echo "Opening iOS Simulator with Expo Go..."

# Kill any existing processes
pkill -f "Simulator" 2>/dev/null
pkill -f "expo" 2>/dev/null

# Open Simulator
open -a Simulator

# Wait for simulator to boot
echo "Waiting for simulator to boot..."
sleep 5

# Install Expo Go in simulator if needed
xcrun simctl install booted ~/.expo/ios-simulator-app-cache/Exponent-2.33.4.tar.app 2>/dev/null || {
    echo "Downloading Expo Go for simulator..."
    curl -o /tmp/expo-go.tar.gz https://dpq5q02fu5f55.cloudfront.net/Exponent-2.33.4.tar.gz
    tar -xzf /tmp/expo-go.tar.gz -C /tmp
    xcrun simctl install booted /tmp/Exponent.app
}

# Start Expo
echo "Starting Expo..."
npx expo start --ios

echo "App should now be running in iOS Simulator!"