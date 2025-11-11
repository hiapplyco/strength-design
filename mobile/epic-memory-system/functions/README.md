# Firebase Functions for Strength.Design

This directory contains the Firebase Cloud Functions for the Strength.Design platform.

## Setup

1. Install dependencies:
```bash
cd functions
npm install
```

2. Set up environment configuration:
```bash
firebase functions:config:set stripe.secret_key="YOUR_STRIPE_SECRET_KEY"
firebase functions:config:set stripe.webhook_secret="YOUR_STRIPE_WEBHOOK_SECRET"
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
```

3. For local development, get the config:
```bash
firebase functions:config:get > .runtimeconfig.json
```

## Development

Run the emulator:
```bash
npm run serve
```

## Deployment

Deploy all functions:
```bash
npm run deploy
```

Deploy specific functions:
```bash
firebase deploy --only functions:createCheckout,functions:stripeWebhook
```

## Function Categories

### Stripe Integration
- `createCheckout` - Creates Stripe checkout sessions
- `customerPortal` - Creates Stripe customer portal sessions
- `stripeWebhook` - Handles Stripe webhook events

### AI/ML Functions
- `chatWithGemini` - Chat with Google Gemini AI
- `enhancedChat` - Advanced chat features (WIP)
- `generateWorkout` - AI workout generation (WIP)
- `generateWorkoutTitle` - Generate workout titles (WIP)
- `generateWorkoutSummary` - Generate workout summaries (WIP)

### Utility Functions
- Various utility functions (to be migrated)