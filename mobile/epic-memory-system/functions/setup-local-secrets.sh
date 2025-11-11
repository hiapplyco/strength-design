#!/bin/bash

# Setup local secrets for Firebase Functions emulator
# This script creates .runtimeconfig.json for local development

echo "Setting up local secrets for Firebase Functions emulator..."

# Check if .runtimeconfig.json exists
if [ -f ".runtimeconfig.json" ]; then
    echo "⚠️  .runtimeconfig.json already exists. Backing up to .runtimeconfig.json.backup"
    cp .runtimeconfig.json .runtimeconfig.json.backup
fi

# Create .runtimeconfig.json with secret placeholders
cat > .runtimeconfig.json << 'EOF'
{
  "gemini": {
    "api_key": "YOUR_GEMINI_API_KEY_HERE"
  },
  "stripe": {
    "secret_key": "YOUR_STRIPE_SECRET_KEY_HERE",
    "webhook_secret": "YOUR_STRIPE_WEBHOOK_SECRET_HERE"
  }
}
EOF

echo "✅ Created .runtimeconfig.json with placeholders"
echo ""
echo "⚠️  IMPORTANT: Replace the following values in .runtimeconfig.json:"
echo "   - YOUR_GEMINI_API_KEY_HERE"
echo "   - YOUR_STRIPE_SECRET_KEY_HERE"
echo "   - YOUR_STRIPE_WEBHOOK_SECRET_HERE"
echo ""
echo "To get your actual secret values, run:"
echo "   firebase functions:secrets:access GEMINI_API_KEY"
echo "   firebase functions:secrets:access STRIPE_SECRET_KEY"
echo "   firebase functions:secrets:access STRIPE_WEBHOOK_SECRET"
echo ""
echo "Note: .runtimeconfig.json is already in .gitignore, so it won't be committed."