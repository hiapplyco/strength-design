/**
 * Firebase Configuration for Mobile App
 *
 * This file initializes Firebase services for the React Native mobile app.
 * Configuration values are sourced from environment variables (EXPO_PUBLIC_ prefix).
 *
 * Services exported:
 * - auth: Firebase Authentication
 * - db: Cloud Firestore
 * - storage: Cloud Storage
 * - functions: Cloud Functions (us-central1 region)
 *
 * Emulator Support:
 * - Set EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true to enable emulators
 * - Set EXPO_PUBLIC_EMULATOR_HOST for custom emulator host (optional)
 * - Defaults: localhost (iOS/web), 10.0.2.2 (Android)
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  connectAuthEmulator
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator
} from 'firebase/firestore';
import {
  getStorage,
  connectStorageEmulator
} from 'firebase/storage';
import {
  getFunctions,
  connectFunctionsEmulator
} from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_API_KEY ||
          process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
          'demo-api-key',
  authDomain: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
              process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
              'demo.firebaseapp.com',
  projectId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
             process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
             'demo-project',
  storageBucket: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
                 process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
                 'demo.appspot.com',
  messagingSenderId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
                     process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
                     '123456789',
  appId: Constants.expoConfig?.extra?.EXPO_PUBLIC_FIREBASE_APP_ID ||
         process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
         'demo-app-id',
};

// Emulator configuration
const USE_EMULATORS =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === 'true' ||
  process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === 'true' ||
  false;

// Determine emulator host based on platform
// iOS simulator & web use localhost, Android emulator uses 10.0.2.2
// Can be overridden via EXPO_PUBLIC_EMULATOR_HOST
const DEFAULT_EMULATOR_HOST = Platform.select({
  ios: 'localhost',
  android: '10.0.2.2',
  web: 'localhost',
  default: 'localhost'
});

const EMULATOR_HOST =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_EMULATOR_HOST ||
  process.env.EXPO_PUBLIC_EMULATOR_HOST ||
  DEFAULT_EMULATOR_HOST;

// Log configuration status (without exposing sensitive data)
console.log('Firebase Config:', {
  projectId: firebaseConfig.projectId,
  hasApiKey: !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'demo-api-key',
  environment: __DEV__ ? 'development' : 'production',
  emulators: USE_EMULATORS ? `enabled (${EMULATOR_HOST})` : 'disabled'
});

// Initialize Firebase (reuse if already initialized)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth with React Native persistence
// Note: initializeAuth must be called before getAuth for custom persistence
let auth;
try {
  // Try to initialize with AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  console.log('Firebase Auth initialized with AsyncStorage persistence');
} catch (error) {
  // If already initialized, just get the existing instance
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
    console.log('Firebase Auth already initialized, using existing instance');
  } else {
    console.error('Error initializing Firebase Auth:', error);
    auth = getAuth(app);
  }
}

// Initialize other Firebase services
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'us-central1');

// Connect to Firebase Emulators (if enabled)
if (USE_EMULATORS) {
  console.log(`[EMULATOR] Connecting to Firebase emulators at ${EMULATOR_HOST}`);

  // Connect Auth Emulator (port 9099)
  try {
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, {
      disableWarnings: true
    });
    console.log('[EMULATOR] ✅ Auth emulator connected');

    // Set up error handling for auth operations
    auth.onAuthStateChanged(null, (error) => {
      if (error?.code === 'auth/user-not-found') {
        // Silently handle user not found errors in emulator
        return;
      }
    });
  } catch (error) {
    console.log('[EMULATOR] Auth emulator already connected');
  }

  // Connect Firestore Emulator (port 8080)
  try {
    connectFirestoreEmulator(db, EMULATOR_HOST, 8080);
    console.log('[EMULATOR] ✅ Firestore emulator connected');
  } catch (error) {
    console.log('[EMULATOR] Firestore emulator already connected');
  }

  // Connect Functions Emulator (port 5001)
  try {
    connectFunctionsEmulator(functions, EMULATOR_HOST, 5001);
    console.log('[EMULATOR] ✅ Functions emulator connected');
  } catch (error) {
    console.log('[EMULATOR] Functions emulator already connected');
  }

  // Connect Storage Emulator (port 9199)
  try {
    connectStorageEmulator(storage, EMULATOR_HOST, 9199);
    console.log('[EMULATOR] ✅ Storage emulator connected');
  } catch (error) {
    console.log('[EMULATOR] Storage emulator already connected');
  }
}

// Export Firebase services
export { auth, db, storage, functions };

// Export the app instance
export default app;

// Development utilities
if (__DEV__) {
  console.log('Firebase services initialized:', {
    auth: !!auth,
    db: !!db,
    storage: !!storage,
    functions: !!functions,
    emulators: USE_EMULATORS
  });
}
