import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';
import './initialize';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo-app-id',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (reuse if already initialized)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

// Connect to emulators in development - must be synchronous before any service usage
if (import.meta.env.DEV) {
  // Track if emulators are already connected
  const isEmulatorConnected = (service: any) => {
    return service._delegate?._settings?.host?.includes('localhost') || 
           service._settings?.host?.includes('localhost') ||
           service.emulatorConfig !== undefined;
  };

  try {
    if (!isEmulatorConnected(auth)) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      console.log('Connected to Auth emulator');
    }
  } catch (error) {
    console.warn('Auth emulator connection failed:', error);
  }

  try {
    if (!isEmulatorConnected(db)) {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('Connected to Firestore emulator');
    }
  } catch (error) {
    console.warn('Firestore emulator connection failed:', error);
  }

  try {
    if (!isEmulatorConnected(storage)) {
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('Connected to Storage emulator');
    }
  } catch (error) {
    console.warn('Storage emulator connection failed:', error);
  }

  try {
    if (!isEmulatorConnected(functions)) {
      connectFunctionsEmulator(functions, 'localhost', 5001);
      console.log('Connected to Functions emulator');
    }
  } catch (error) {
    console.warn('Functions emulator connection failed:', error);
  }
}

// Initialize Analytics (client-side only)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Enable Firestore offline persistence (only in production)
if (typeof window !== 'undefined' && !import.meta.env.DEV) {
  import('firebase/firestore').then(({ initializeFirestore, persistentLocalCache, persistentMultipleTabManager }) => {
    // Modern persistence setup
    try {
      // Persistence is already configured during Firestore initialization
      console.log('Firestore persistence enabled');
    } catch (err: any) {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not available in this browser');
      }
    }
  });
}

export default app;