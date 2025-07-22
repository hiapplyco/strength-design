# Firebase Setup Guide for Strength.Design

## Quick Start

1. **Create a Firebase Project**
   - Go to https://console.firebase.google.com
   - Click "Create a project"
   - Name it "strength-design" (or your preferred name)
   - Disable Google Analytics for now (optional)

2. **Enable Authentication**
   - In Firebase Console, go to Authentication
   - Click "Get started"
   - Enable these providers:
     - Email/Password
     - Google
     - Phone (requires additional setup)

3. **Create Firestore Database**
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in test mode" for development
   - Select your preferred location

4. **Enable Storage**
   - Go to Storage
   - Click "Get started"
   - Start in test mode for development

5. **Get Your Configuration**
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click "Web" icon (</>) 
   - Register app with a nickname
   - Copy the configuration

6. **Set Up Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` with your Firebase config:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

7. **Deploy Security Rules** (optional for production)
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   firebase deploy --only firestore:rules,storage:rules
   ```

## Testing the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:8080

3. You should see a Firebase Demo card on the homepage

4. Click "Sign in with Google" to test authentication

## What's Working

✅ **Authentication**
- Google Sign-in
- Email/Password (via Auth page)
- Phone authentication (requires Recaptcha setup)
- User profile creation

✅ **Data Layer**
- User profiles with tiers (free/pro/premium)
- Workout creation and management
- Nutrition tracking
- Chat sessions
- File uploads

✅ **Compatibility**
- Supabase hooks mapped to Firebase
- Existing components work with minimal changes

## Next Steps

1. **For Production:**
   - Deploy security rules
   - Enable App Check for security
   - Set up Firebase Functions for AI features
   - Configure custom domain

2. **For Development:**
   - Test all features with Firebase
   - Monitor Firebase Console for usage
   - Set up Firebase Emulators for offline development

## Troubleshooting

**"Firebase not initialized" warning:**
- Make sure all environment variables are set in `.env.local`
- Restart the dev server after changing env vars

**Authentication not working:**
- Check that providers are enabled in Firebase Console
- Verify your domain is authorized (Authentication > Settings > Authorized domains)

**Data not saving:**
- Check Firestore rules allow write access
- Verify you're authenticated
- Check browser console for errors

## Demo Component

The `FirebaseDemo` component on the homepage shows:
- Current authentication status
- User profile information
- Sign in/out functionality

Remove this component for production by editing `src/pages/Index.tsx`.