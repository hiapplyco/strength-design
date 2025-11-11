/**
 * Firebase configuration for mobile app
 * Centralized config for Firebase services
 */

import { Platform } from 'react-native';

// Firebase Functions URLs
// Firebase Functions v2 have specific URLs per function
// Use production URLs - local emulators are disabled
export const FUNCTIONS_URL = 'https://us-central1-strength-design.cloudfunctions.net';

// Function-specific URLs for v2 functions
export const FUNCTION_URLS = {
  enhancedChat: 'https://enhancedchat-ieybkt7vca-uc.a.run.app',
  streamingChatEnhanced: 'https://streamingchatenhanced-ieybkt7vca-uc.a.run.app',
  generateStructuredWorkout: 'https://generatestructuredworkout-ieybkt7vca-uc.a.run.app',
  chatWithGemini: 'https://chatwithgemini-ieybkt7vca-uc.a.run.app',
  generateWorkout: 'https://generateworkout-ieybkt7vca-uc.a.run.app',
  searchPrograms: 'https://searchprograms-ieybkt7vca-uc.a.run.app',
};

// For local development with emulators (currently disabled)
const LOCAL_FUNCTIONS_URL = Platform.select({
  ios: 'http://localhost:5001/strength-design/us-central1',
  android: 'http://10.0.2.2:5001/strength-design/us-central1',
  web: 'http://localhost:5001/strength-design/us-central1',
});

// Export the active Functions URL
export const getFunctionsUrl = () => {
  // Always use production for now since emulators are disabled
  return FUNCTIONS_URL;
};

// Helper to call Firebase Functions
export const callFunction = async (functionName, data, options = {}) => {
  const url = `${getFunctionsUrl()}/${functionName}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`Function call failed: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error(`Error calling function ${functionName}:`, error);
    throw error;
  }
};