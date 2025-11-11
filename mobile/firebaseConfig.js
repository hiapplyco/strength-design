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
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

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

// Log configuration status (without exposing sensitive data)
console.log('Firebase Config:', {
  projectId: firebaseConfig.projectId,
  hasApiKey: !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'demo-api-key',
  environment: __DEV__ ? 'development' : 'production'
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
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

// Export auth
export { auth };

// Export the app instance
export default app;

// Development utilities
if (__DEV__) {
  console.log('Firebase services initialized:', {
    auth: !!auth,
    db: !!db,
    storage: !!storage,
    functions: !!functions,
  });
}
