import * as admin from "firebase-admin";

// Initialize Firebase Admin only if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export functions from different modules
export * from "./stripe";
// Export AI functions individually to avoid conflicts
export { 
  chatWithGemini, 
  generateWorkout, 
  streamingChat,
  streamingChatEnhanced,
  enhancedChat,
  editWorkoutDay,
  generateStructuredWorkout,
  generateWorkoutTitle,
  generateWorkoutSummary,
  generateVideoNarration,
  // Form data summarization functions - Issue #16 Stream A
  summarizeFormData,
  calculateFormCompetency,
  // Form-aware AI coaching functions - Issue #16 Stream B
  generateFormAwareWorkout,
  getPersonalizedCoachingCues,
  adaptCoachingStyle,
  analyzeYoutubeVideo
} from "./ai";
export * from "./utils";
export * from "./payments";
export * from "./exercises";
// Export pose analysis functions
export {
  buildFormContext,
  getHistoricalFormContext
} from "./pose/formContextBuilder";
// export * from "./knowledge"; // Temporarily disabled due to TypeScript errors
export { searchPrograms } from "./programs/searchPrograms";
// export * from "./notifications"; // Temporarily disabled
export * from "./youtube";
