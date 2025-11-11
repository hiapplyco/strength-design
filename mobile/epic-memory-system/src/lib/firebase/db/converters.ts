import {
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
  WithFieldValue,
  PartialWithFieldValue,
  FirestoreDataConverter
} from 'firebase/firestore';
import type {
  UserProfile,
  Workout,
  WorkoutSession,
  NutritionLog,
  FoodItem,
  Exercise,
  ChatSession,
  ChatMessage,
  FileUpload,
  JournalEntry,
  AIInsight,
  MealEntry,
  ExerciseEntry,
  WorkoutHistory,
  VoiceRecording,
  SharedDocument
} from './types';

// Helper function to convert Firestore timestamps to dates
const timestampToDate = (timestamp: any): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return null;
};

// Generic converter factory
function createConverter<T extends { createdAt?: any; updatedAt?: any }>(
  typeName: string
): FirestoreDataConverter<T> {
  return {
    toFirestore(data: WithFieldValue<T> | PartialWithFieldValue<T>): DocumentData {
      return data as DocumentData;
    },
    fromFirestore(
      snapshot: QueryDocumentSnapshot<DocumentData>,
      options: SnapshotOptions
    ): T {
      const data = snapshot.data(options);
      
      // Convert timestamps
      if (data.createdAt) {
        data.createdAt = timestampToDate(data.createdAt);
      }
      if (data.updatedAt) {
        data.updatedAt = timestampToDate(data.updatedAt);
      }
      
      // Convert other timestamp fields based on type
      const timestampFields = getTimestampFieldsForType(typeName);
      timestampFields.forEach(field => {
        if (data[field]) {
          data[field] = timestampToDate(data[field]);
        }
      });
      
      return { id: snapshot.id, ...data } as T;
    }
  };
}

// Define timestamp fields for each type
function getTimestampFieldsForType(typeName: string): string[] {
  const timestampFieldsMap: Record<string, string[]> = {
    UserProfile: ['trialEndDate', 'fitnessProfile.targetDate', 'subscription.currentPeriodEnd', 'subscription.currentPeriodStart'],
    Workout: ['scheduledDate'],
    WorkoutSession: ['scheduledDate', 'completedDate'],
    ChatSession: ['startedAt', 'endedAt'],
    FileUpload: ['processedAt'],
  };
  
  return timestampFieldsMap[typeName] || [];
}

// Create converters for each type
export const userProfileConverter = createConverter<UserProfile>('UserProfile');
export const workoutConverter = createConverter<Workout>('Workout');
export const workoutSessionConverter = createConverter<WorkoutSession>('WorkoutSession');
export const nutritionLogConverter = createConverter<NutritionLog>('NutritionLog');
export const foodItemConverter = createConverter<FoodItem>('FoodItem');
export const exerciseConverter = createConverter<Exercise>('Exercise');
export const chatSessionConverter = createConverter<ChatSession>('ChatSession');
export const chatMessageConverter = createConverter<ChatMessage>('ChatMessage');
export const fileUploadConverter = createConverter<FileUpload>('FileUpload');
export const journalEntryConverter = createConverter<JournalEntry>('JournalEntry');
export const aiInsightConverter = createConverter<AIInsight>('AIInsight');
export const mealEntryConverter = createConverter<MealEntry>('MealEntry');
export const exerciseEntryConverter = createConverter<ExerciseEntry>('ExerciseEntry');
export const workoutHistoryConverter = createConverter<WorkoutHistory>('WorkoutHistory');
export const voiceRecordingConverter = createConverter<VoiceRecording>('VoiceRecording');
export const sharedDocumentConverter = createConverter<SharedDocument>('SharedDocument');

// Export a map of all converters
export const converters = {
  userProfile: userProfileConverter,
  workout: workoutConverter,
  workoutSession: workoutSessionConverter,
  nutritionLog: nutritionLogConverter,
  foodItem: foodItemConverter,
  exercise: exerciseConverter,
  chatSession: chatSessionConverter,
  chatMessage: chatMessageConverter,
  fileUpload: fileUploadConverter,
  journalEntry: journalEntryConverter,
  aiInsight: aiInsightConverter,
  mealEntry: mealEntryConverter,
  exerciseEntry: exerciseEntryConverter,
  workoutHistory: workoutHistoryConverter,
  voiceRecording: voiceRecordingConverter,
  sharedDocument: sharedDocumentConverter,
} as const;