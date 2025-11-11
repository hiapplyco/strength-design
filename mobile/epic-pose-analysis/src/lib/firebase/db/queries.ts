import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentReference,
  CollectionReference,
  Query,
  Timestamp,
  serverTimestamp,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove,
  FieldValue
} from 'firebase/firestore';
import { db } from '../config';
import { 
  COLLECTIONS,
  userCollection,
  userWorkoutsCollection,
  userWorkoutSessionsCollection,
  userNutritionLogsCollection,
  userChatSessionsCollection,
  userFileUploadsCollection,
  userJournalEntriesCollection,
  userAIInsightsCollection,
  workoutHistoryCollection,
  workoutVoiceRecordingsCollection,
  chatMessagesCollection,
  nutritionMealsCollection,
  nutritionExercisesCollection
} from './collections';
import { converters } from './converters';
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

// User Profile Queries
export const userQueries = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const docRef = doc(db, COLLECTIONS.USERS, userId).withConverter(converters.userProfile);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  async createProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async incrementFreeWorkouts(userId: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(docRef, {
      freeWorkoutsUsed: increment(1),
      updatedAt: serverTimestamp(),
    });
  },
};

// Workout Queries
export const workoutQueries = {
  async getWorkout(userId: string, workoutId: string): Promise<Workout | null> {
    const docRef = doc(db, userWorkoutsCollection(userId), workoutId).withConverter(converters.workout);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  async getUserWorkouts(userId: string, limitCount: number = 20): Promise<Workout[]> {
    const q = query(
      collection(db, userWorkoutsCollection(userId)).withConverter(converters.workout),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },

  async getFavoriteWorkouts(userId: string): Promise<Workout[]> {
    const q = query(
      collection(db, userWorkoutsCollection(userId)).withConverter(converters.workout),
      where('isFavorite', '==', true),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },

  async createWorkout(userId: string, data: Partial<Workout>): Promise<string> {
    const colRef = collection(db, userWorkoutsCollection(userId));
    const docRef = doc(colRef);
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateWorkout(userId: string, workoutId: string, data: Partial<Workout>): Promise<void> {
    const docRef = doc(db, userWorkoutsCollection(userId), workoutId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteWorkout(userId: string, workoutId: string): Promise<void> {
    const docRef = doc(db, userWorkoutsCollection(userId), workoutId);
    await deleteDoc(docRef);
  },

  async toggleFavorite(userId: string, workoutId: string, isFavorite: boolean): Promise<void> {
    const docRef = doc(db, userWorkoutsCollection(userId), workoutId);
    await updateDoc(docRef, {
      isFavorite,
      updatedAt: serverTimestamp(),
    });
  },

  async addWorkoutHistory(userId: string, workoutId: string, history: Partial<WorkoutHistory>): Promise<void> {
    const colRef = collection(db, workoutHistoryCollection(userId, workoutId));
    await setDoc(doc(colRef), {
      ...history,
      createdAt: serverTimestamp(),
    });
  },

  async getWorkoutHistory(userId: string, workoutId: string): Promise<WorkoutHistory[]> {
    const q = query(
      collection(db, workoutHistoryCollection(userId, workoutId)).withConverter(converters.workoutHistory),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },
};

// Workout Session Queries
export const workoutSessionQueries = {
  async createSession(userId: string, data: Partial<WorkoutSession>): Promise<string> {
    const colRef = collection(db, userWorkoutSessionsCollection(userId));
    const docRef = doc(colRef);
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateSession(userId: string, sessionId: string, data: Partial<WorkoutSession>): Promise<void> {
    const docRef = doc(db, userWorkoutSessionsCollection(userId), sessionId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async getUpcomingSessions(userId: string): Promise<WorkoutSession[]> {
    const q = query(
      collection(db, userWorkoutSessionsCollection(userId)).withConverter(converters.workoutSession),
      where('status', '==', 'scheduled'),
      where('scheduledDate', '>=', Timestamp.now()),
      orderBy('scheduledDate', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },

  async getCompletedSessions(userId: string, limitCount: number = 20): Promise<WorkoutSession[]> {
    const q = query(
      collection(db, userWorkoutSessionsCollection(userId)).withConverter(converters.workoutSession),
      where('status', '==', 'completed'),
      orderBy('completedDate', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },
};

// Nutrition Queries
export const nutritionQueries = {
  async getNutritionLog(userId: string, date: string): Promise<NutritionLog | null> {
    const docRef = doc(db, userNutritionLogsCollection(userId), date).withConverter(converters.nutritionLog);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  async createOrUpdateNutritionLog(userId: string, date: string, data: Partial<NutritionLog>): Promise<void> {
    const docRef = doc(db, userNutritionLogsCollection(userId), date);
    await setDoc(docRef, {
      ...data,
      date,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  },

  async addMealEntry(userId: string, date: string, meal: Partial<MealEntry>): Promise<string> {
    const colRef = collection(db, nutritionMealsCollection(userId, date));
    const docRef = doc(colRef);
    await setDoc(docRef, {
      ...meal,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getMealEntries(userId: string, date: string): Promise<MealEntry[]> {
    const q = query(
      collection(db, nutritionMealsCollection(userId, date)).withConverter(converters.mealEntry),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },

  async deleteMealEntry(userId: string, date: string, mealId: string): Promise<void> {
    const docRef = doc(db, nutritionMealsCollection(userId, date), mealId);
    await deleteDoc(docRef);
  },

  async addExerciseEntry(userId: string, date: string, exercise: Partial<ExerciseEntry>): Promise<string> {
    const colRef = collection(db, nutritionExercisesCollection(userId, date));
    const docRef = doc(colRef);
    await setDoc(docRef, {
      ...exercise,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getExerciseEntries(userId: string, date: string): Promise<ExerciseEntry[]> {
    const q = query(
      collection(db, nutritionExercisesCollection(userId, date)).withConverter(converters.exerciseEntry),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },
};

// Food Item Queries
export const foodItemQueries = {
  async searchFoodItems(searchTerm: string, limitCount: number = 20): Promise<FoodItem[]> {
    // Note: Firestore doesn't support full-text search natively
    // For production, consider using Algolia or Elasticsearch
    const q = query(
      collection(db, COLLECTIONS.FOOD_ITEMS).withConverter(converters.foodItem),
      orderBy('name'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const allItems = snapshot.docs.map(doc => doc.data());
    
    // Client-side filtering (not ideal for large datasets)
    return allItems.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },

  async createFoodItem(data: Partial<FoodItem>, userId: string): Promise<string> {
    const colRef = collection(db, COLLECTIONS.FOOD_ITEMS);
    const docRef = doc(colRef);
    await setDoc(docRef, {
      ...data,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getUserFoodItems(userId: string): Promise<FoodItem[]> {
    const q = query(
      collection(db, COLLECTIONS.FOOD_ITEMS).withConverter(converters.foodItem),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },
};

// Exercise Queries
export const exerciseQueries = {
  async getAllExercises(): Promise<Exercise[]> {
    const q = query(
      collection(db, COLLECTIONS.EXERCISES).withConverter(converters.exercise),
      orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },

  async getExercisesByCategory(category: string): Promise<Exercise[]> {
    const q = query(
      collection(db, COLLECTIONS.EXERCISES).withConverter(converters.exercise),
      where('category', '==', category),
      orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },

  async getExercisesByMuscle(muscle: string): Promise<Exercise[]> {
    const q = query(
      collection(db, COLLECTIONS.EXERCISES).withConverter(converters.exercise),
      where('primaryMuscles', 'array-contains', muscle),
      orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },

  async searchExercises(searchTerm: string): Promise<Exercise[]> {
    // Similar to food items, this requires client-side filtering
    // or integration with a search service
    const q = query(
      collection(db, COLLECTIONS.EXERCISES).withConverter(converters.exercise),
      orderBy('name')
    );
    const snapshot = await getDocs(q);
    const allExercises = snapshot.docs.map(doc => doc.data());
    
    return allExercises.filter(exercise => 
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.primaryMuscles?.some(muscle => 
        muscle.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  },
};

// Chat Session Queries
export const chatQueries = {
  async createChatSession(userId: string, data: Partial<ChatSession>): Promise<string> {
    const colRef = collection(db, userChatSessionsCollection(userId));
    const docRef = doc(colRef);
    await setDoc(docRef, {
      ...data,
      startedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      messageCount: 0,
    });
    return docRef.id;
  },

  async updateChatSession(userId: string, sessionId: string, data: Partial<ChatSession>): Promise<void> {
    const docRef = doc(db, userChatSessionsCollection(userId), sessionId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async addChatMessage(userId: string, sessionId: string, message: Partial<ChatMessage>): Promise<string> {
    const batch = writeBatch(db);
    
    // Add message
    const messageRef = doc(collection(db, chatMessagesCollection(userId, sessionId)));
    batch.set(messageRef, {
      ...message,
      createdAt: serverTimestamp(),
    });
    
    // Update session message count
    const sessionRef = doc(db, userChatSessionsCollection(userId), sessionId);
    batch.update(sessionRef, {
      messageCount: increment(1),
      updatedAt: serverTimestamp(),
    });
    
    await batch.commit();
    return messageRef.id;
  },

  async getChatMessages(userId: string, sessionId: string): Promise<ChatMessage[]> {
    const q = query(
      collection(db, chatMessagesCollection(userId, sessionId)).withConverter(converters.chatMessage),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },

  async getRecentChatSessions(userId: string, limitCount: number = 10): Promise<ChatSession[]> {
    const q = query(
      collection(db, userChatSessionsCollection(userId)).withConverter(converters.chatSession),
      orderBy('startedAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },
};

// Document queries
export const documentQueries = {
  async createDocument(data: Partial<SharedDocument>): Promise<string> {
    const colRef = collection(db, COLLECTIONS.DOCUMENTS);
    const docRef = doc(colRef);
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      views: 0,
      isPublic: true,
    });
    return docRef.id;
  },

  async updateDocument(documentId: string, data: Partial<SharedDocument>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async getDocument(documentId: string): Promise<SharedDocument | null> {
    const docRef = doc(db, COLLECTIONS.DOCUMENTS, documentId).withConverter(converters.sharedDocument);
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      // Increment view count
      await updateDoc(doc(db, COLLECTIONS.DOCUMENTS, documentId), {
        views: increment(1),
      });
    }
    
    return snapshot.exists() ? snapshot.data() : null;
  },

  async getUserDocuments(userId: string): Promise<SharedDocument[]> {
    const q = query(
      collection(db, COLLECTIONS.DOCUMENTS).withConverter(converters.sharedDocument),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  },
};

// Helper function to batch operations
export const batchOperations = {
  async batchWrite(operations: Array<() => Promise<void>>): Promise<void> {
    const batch = writeBatch(db);
    // Execute operations in batch
    // Note: Firestore batches are limited to 500 operations
    await Promise.all(operations);
  },
};