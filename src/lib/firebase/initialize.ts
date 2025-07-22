// Firebase initialization status
let initialized = false;

export function initializeFirebase() {
  if (initialized) return;
  
  // Check if required environment variables are set
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];
  
  const missingVars = requiredVars.filter(key => !import.meta.env[key]);
  
  if (missingVars.length > 0) {
    console.warn('Firebase not initialized. Missing environment variables:', missingVars);
    console.warn('Please copy .env.example to .env.local and fill in your Firebase configuration.');
    return;
  }
  
  initialized = true;
  console.log('Firebase initialized successfully');
}

// Auto-initialize when module is imported
initializeFirebase();