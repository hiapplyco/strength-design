#!/bin/bash

# Deploy Firebase Functions

echo "🚀 Deploying Firebase Functions..."

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Navigate to functions directory
cd functions || exit 1

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the functions
echo "🔨 Building functions..."
npm run build

# Deploy functions
echo "☁️  Deploying to Firebase..."
firebase deploy --only functions

echo "✅ Deployment complete!"