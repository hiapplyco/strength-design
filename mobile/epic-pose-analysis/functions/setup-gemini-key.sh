#!/bin/bash

echo "Setting up Gemini API key for local Firebase Functions development"
echo ""
echo "You need a Gemini API key from: https://makersuite.google.com/app/apikey"
echo ""
read -p "Enter your Gemini API key: " GEMINI_KEY

if [ -z "$GEMINI_KEY" ]; then
    echo "Error: No API key provided"
    exit 1
fi

# Create or update .runtimeconfig.json
cat > .runtimeconfig.json << EOF
{
  "gemini": {
    "api_key": "$GEMINI_KEY"
  },
  "stripe": {
    "secret_key": "YOUR_STRIPE_SECRET_KEY_HERE",
    "webhook_secret": "YOUR_STRIPE_WEBHOOK_SECRET_HERE"
  }
}
EOF

echo ""
echo "✅ Gemini API key configured for local development!"
echo ""
echo "Note: .runtimeconfig.json is already in .gitignore, so it won't be committed."
echo ""
echo "You can now restart the Firebase emulators to use the new configuration."