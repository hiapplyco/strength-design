import { initializeApp } from 'firebase/app';
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
  getFunctions, 
  connectFunctionsEmulator 
} from 'firebase/functions';
import { 
  getStorage, 
  connectStorageEmulator 
} from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// --- Use your computer's IP address for emulators ---
// Make sure your phone and computer are on the same Wi-Fi network.
const USE_EMULATORS = true; // Enable emulators for development
// Use localhost for iOS simulator, actual IP for physical devices
const EMULATOR_HOST = (Platform.OS === 'web' || Platform.OS === 'ios') ? 'localhost' : '192.168.86.26'; 

const firebaseConfig = {
  apiKey: "AIzaSyDTyxs6cZKUbN7ejmYk_rLVxNg5wVKoSlQ",
  authDomain: "strength-design.firebaseapp.com",
  projectId: "strength-design",
  storageBucket: "strength-design.firebasestorage.app",
  messagingSenderId: "739613827248",
  appId: "1:739613827248:web:2ae23e6e858a582275a0d8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = Platform.OS === 'web' 
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

// Connect to emulators in development
if (USE_EMULATORS) {
  console.log(`[EMULATOR] Connecting to Firebase emulators at ${EMULATOR_HOST}`);
  
  // Use try-catch to avoid re-connection errors
  try {
    // Disable warnings for emulator and handle initial auth state gracefully
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, { 
      disableWarnings: true
    });
    
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
  
  try {
    connectFirestoreEmulator(db, EMULATOR_HOST, 8080);
  } catch (error) {
    console.log('[EMULATOR] Firestore emulator already connected');
  }
  
  try {
    connectFunctionsEmulator(functions, EMULATOR_HOST, 5001);
  } catch (error) {
    console.log('[EMULATOR] Functions emulator already connected');
  }
  
  try {
    connectStorageEmulator(storage, EMULATOR_HOST, 9199);
  } catch (error) {
    console.log('[EMULATOR] Storage emulator already connected');
  }
}

export { auth, db, functions, storage };
export default app;
