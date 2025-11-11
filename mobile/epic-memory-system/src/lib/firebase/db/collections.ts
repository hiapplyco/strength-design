// Firestore collection references and paths
export const COLLECTIONS = {
  USERS: 'users',
  EXERCISES: 'exercises',
  FOOD_ITEMS: 'foodItems',
  DOCUMENTS: 'documents',
  
  // User subcollections
  WORKOUTS: 'workouts',
  WORKOUT_SESSIONS: 'workoutSessions',
  NUTRITION_LOGS: 'nutritionLogs',
  CHAT_SESSIONS: 'chatSessions',
  FILE_UPLOADS: 'fileUploads',
  JOURNAL_ENTRIES: 'journalEntries',
  AI_INSIGHTS: 'aiInsights',
  
  // Nested subcollections
  WORKOUT_HISTORY: 'history',
  VOICE_RECORDINGS: 'voiceRecordings',
  MESSAGES: 'messages',
  MEALS: 'meals',
  EXERCISES_LOG: 'exercises',
} as const;

// Helper functions to construct collection paths
export const userCollection = (userId: string) => 
  `${COLLECTIONS.USERS}/${userId}`;

export const userWorkoutsCollection = (userId: string) => 
  `${userCollection(userId)}/${COLLECTIONS.WORKOUTS}`;

export const userWorkoutSessionsCollection = (userId: string) => 
  `${userCollection(userId)}/${COLLECTIONS.WORKOUT_SESSIONS}`;

export const userNutritionLogsCollection = (userId: string) => 
  `${userCollection(userId)}/${COLLECTIONS.NUTRITION_LOGS}`;

export const userChatSessionsCollection = (userId: string) => 
  `${userCollection(userId)}/${COLLECTIONS.CHAT_SESSIONS}`;

export const userFileUploadsCollection = (userId: string) => 
  `${userCollection(userId)}/${COLLECTIONS.FILE_UPLOADS}`;

export const userJournalEntriesCollection = (userId: string) => 
  `${userCollection(userId)}/${COLLECTIONS.JOURNAL_ENTRIES}`;

export const userAIInsightsCollection = (userId: string) => 
  `${userCollection(userId)}/${COLLECTIONS.AI_INSIGHTS}`;

// Nested subcollection paths
export const workoutHistoryCollection = (userId: string, workoutId: string) => 
  `${userWorkoutsCollection(userId)}/${workoutId}/${COLLECTIONS.WORKOUT_HISTORY}`;

export const workoutVoiceRecordingsCollection = (userId: string, workoutId: string) => 
  `${userWorkoutsCollection(userId)}/${workoutId}/${COLLECTIONS.VOICE_RECORDINGS}`;

export const chatMessagesCollection = (userId: string, sessionId: string) => 
  `${userChatSessionsCollection(userId)}/${sessionId}/${COLLECTIONS.MESSAGES}`;

export const nutritionMealsCollection = (userId: string, date: string) => 
  `${userNutritionLogsCollection(userId)}/${date}/${COLLECTIONS.MEALS}`;

export const nutritionExercisesCollection = (userId: string, date: string) => 
  `${userNutritionLogsCollection(userId)}/${date}/${COLLECTIONS.EXERCISES_LOG}`;