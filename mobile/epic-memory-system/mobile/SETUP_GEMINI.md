# 🚀 Set Up Gemini 2.5 Flash for Strength.Design

## Quick Setup (5 minutes)

### Step 1: Get Your FREE API Key
1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Select "Create API key in existing project" or create new
4. Copy your API key (starts with `AIza...`)

### Step 2: Set API Key in Firebase Emulator
Run this command with YOUR API key:
```bash
cd /Users/jms/Development/strength-design/mobile
export GEMINI_API_KEY="YOUR_API_KEY_HERE"
```

### Step 3: Update Functions with Your Key
```bash
# Option A: Set in functions/index.js directly (for testing)
# Edit line 10 in functions/index.js:
# const genAI = new GoogleGenerativeAI('YOUR_API_KEY_HERE');

# Option B: Use environment variable (recommended)
cd functions
echo "GEMINI_API_KEY=YOUR_API_KEY_HERE" > .env
```

### Step 4: Restart Firebase Emulators
```bash
# Kill current emulators (Ctrl+C in that terminal)
# Then restart with your API key:
export GEMINI_API_KEY="YOUR_API_KEY_HERE"
firebase emulators:start --project demo-strength-design
```

### Step 5: Test the AI Chat
1. Go to the "Generator" tab in the app
2. You should see: "Welcome! I'm your elite AI fitness coach..."
3. Type: "I want to build muscle"
4. You'll get a real AI response powered by Gemini 2.5 Flash!

## What You Get with Gemini 2.5 Flash:
- ✅ **Real AI conversations** - Not pre-written responses
- ✅ **Context awareness** - Remembers your conversation
- ✅ **Personalized workouts** - Based on YOUR goals
- ✅ **Streaming responses** - See the AI think in real-time
- ✅ **Smart recommendations** - Exercise, nutrition, recovery

## Current Status:
- ❌ API Key Invalid: `AIzaSyCnQPJPLmPCcnEXNNTBSWDCTKLY3nFxECw`
- ⏳ Waiting for your valid API key

## Troubleshooting:

### If you get "API key not valid" error:
1. Make sure you copied the full key
2. Check it starts with `AIza`
3. Ensure you're using a Google AI Studio key (not Firebase key)

### If chat doesn't stream:
1. Check Firebase emulators are running
2. Verify functions are deployed to emulator
3. Look at emulator logs for errors

## For Production Deployment:
```bash
# Set the API key in Firebase (for production)
firebase functions:config:set gemini.api_key="YOUR_API_KEY_HERE"

# Deploy functions
firebase deploy --only functions

# Update your production app to use real Firebase (not emulators)
```

---

**Ready to enable AI?** Get your key from: https://aistudio.google.com/app/apikey

It's FREE and takes 1 minute!