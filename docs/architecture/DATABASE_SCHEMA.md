# Firebase Studio Data Structure Design

## Overview
This document outlines the Firebase/Firestore data structure design based on the current Supabase schema for Strength.Design. The migration involves converting from a relational PostgreSQL database to a document-based NoSQL structure.

## Key Architectural Differences

### Supabase (PostgreSQL)
- Relational database with tables and foreign keys
- Strong consistency and ACID transactions
- SQL queries with JOINs
- Row-level security (RLS) policies
- Built-in auth with auth.users table

### Firebase (Firestore)
- Document-based NoSQL database
- Collections and documents with subcollections
- Limited transactions across documents
- Security rules instead of RLS
- Firebase Auth with user profiles stored separately

## Data Structure Design

### 1. Users Collection
```
/users/{userId}
{
  // Profile data (from profiles table)
  createdAt: timestamp,
  updatedAt: timestamp,
  tier: "free" | "pro" | "premium",
  freeWorkoutsUsed: number,
  trialEndDate: timestamp | null,
  
  // From user_fitness_profiles
  fitnessProfile: {
    age: number,
    gender: "male" | "female" | "other" | "prefer_not_to_say",
    heightCm: number,
    weightKg: number,
    activityLevel: "sedentary" | "lightly_active" | etc,
    primaryGoal: string,
    secondaryGoals: string[],
    targetWeightKg: number,
    targetDate: timestamp,
    trainingExperience: "beginner" | "intermediate" | "advanced" | "expert",
    preferredTrainingDays: number,
    preferredWorkoutDuration: number,
    preferredTrainingTime: "morning" | "afternoon" | "evening" | "flexible",
    injuries: string[],
    medicalConditions: string[],
    medications: string[],
    allergies: string[],
    dietaryRestrictions: string[],
    gymAccess: boolean,
    homeEquipment: string[],
    chatExtractedData: map,
    fileExtractedData: map,
    aiRecommendations: map
  },
  
  // From nutrition_settings
  nutritionSettings: {
    targetCalories: number,
    targetProtein: number,
    targetCarbs: number,
    targetFat: number,
    targetFiber: number,
    targetSugar: number,
    targetSodium: number,
    targetCholesterol: number,
    targetSaturatedFat: number,
    targetWaterMl: number,
    customTargets: map,
    integrations: map
  },
  
  // From subscriptions
  subscription: {
    status: "trialing" | "active" | "past_due" | "canceled" | "incomplete",
    priceId: string,
    currentPeriodEnd: timestamp,
    currentPeriodStart: timestamp,
    cancelAtPeriodEnd: boolean,
    metadata: map
  }
}
```

### 2. Workouts Collection Structure
```
/users/{userId}/workouts/{workoutId}
{
  createdAt: timestamp,
  updatedAt: timestamp,
  day: string,
  description: string,
  warmup: string,
  workout: string,
  strength: string,
  notes: string,
  
  // From generated_workouts
  workoutData: map,
  title: string,
  summary: string,
  difficultyLevel: number,
  equipmentNeeded: string[],
  estimatedDurationMinutes: number,
  targetMuscleGroups: string[],
  tags: string[],
  isFavorite: boolean,
  scheduledDate: timestamp
}

// Subcollection for workout history
/users/{userId}/workouts/{workoutId}/history/{historyId}
{
  createdAt: timestamp,
  previousWod: string,
  newWod: string,
  prompt: string
}

// Subcollection for voice recordings
/users/{userId}/workouts/{workoutId}/voiceRecordings/{recordingId}
{
  createdAt: timestamp,
  audioUrl: string
}
```

### 3. Workout Sessions Collection
```
/users/{userId}/workoutSessions/{sessionId}
{
  createdAt: timestamp,
  updatedAt: timestamp,
  workoutId: string, // Reference to workout
  scheduledDate: timestamp,
  completedDate: timestamp | null,
  status: "scheduled" | "completed" | "cancelled",
  actualDurationMinutes: number,
  perceivedExertion: number,
  satisfactionRating: number,
  modifications: string,
  notes: string,
  
  // Subcollection for metrics
  metrics: [
    {
      exerciseName: string,
      setsCompleted: number,
      repsCompleted: number,
      weightUsed: number,
      restTimeSeconds: number,
      formRating: number,
      difficultyRating: number,
      notes: string
    }
  ]
}
```

### 4. Nutrition Collection
```
/users/{userId}/nutritionLogs/{date}
{
  date: string, // YYYY-MM-DD format as document ID
  createdAt: timestamp,
  updatedAt: timestamp,
  waterConsumedMl: number,
  
  // Subcollection for meals
  meals: {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  }
}

// Subcollection for meal entries
/users/{userId}/nutritionLogs/{date}/meals/{mealId}
{
  createdAt: timestamp,
  mealGroup: "breakfast" | "lunch" | "dinner" | "snacks",
  foodItemId: string, // Reference to food item
  foodItem: { // Denormalized data
    name: string,
    brand: string,
    caloriesPerServing: number,
    proteinPerServing: number,
    carbsPerServing: number,
    fatPerServing: number
  },
  servingMultiplier: number,
  amount: number
}

// Subcollection for exercise entries
/users/{userId}/nutritionLogs/{date}/exercises/{exerciseId}
{
  createdAt: timestamp,
  exerciseName: string,
  durationMinutes: number,
  caloriesBurned: number,
  workoutData: map
}
```

### 5. Food Items Collection (Global)
```
/foodItems/{foodItemId}
{
  name: string,
  brand: string | null,
  caloriesPerServing: number,
  proteinPerServing: number,
  carbsPerServing: number,
  fatPerServing: number,
  fiberPerServing: number | null,
  sugarPerServing: number | null,
  sodiumPerServing: number | null,
  servingSize: string,
  servingUnit: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string // userId
}
```

### 6. Exercises Collection (Global)
```
/exercises/{exerciseId}
{
  name: string,
  category: string,
  equipment: string,
  force: string,
  level: string,
  mechanic: string,
  primaryMuscles: string[],
  secondaryMuscles: string[],
  instructions: string[],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 7. Chat Sessions Collection
```
/users/{userId}/chatSessions/{sessionId}
{
  createdAt: timestamp,
  sessionType: "workout" | "nutrition" | "wellness" | "general",
  startedAt: timestamp,
  endedAt: timestamp | null,
  messageCount: number,
  uploadedFiles: array,
  extractedProfileData: map,
  extractedNutritionData: map,
  extractedWorkoutData: map,
  aiSummary: string,
  keyInsights: string[]
}

// Subcollection for messages
/users/{userId}/chatSessions/{sessionId}/messages/{messageId}
{
  createdAt: timestamp,
  message: string,
  response: string | null,
  attachments: array,
  extractedData: map,
  tokensUsed: number,
  modelUsed: string
}
```

### 8. File Uploads Collection
```
/users/{userId}/fileUploads/{uploadId}
{
  createdAt: timestamp,
  sessionId: string | null,
  fileName: string,
  fileType: string,
  fileSize: number,
  storagePath: string,
  processingStatus: "pending" | "processing" | "completed" | "failed",
  processedAt: timestamp | null,
  extractedData: map,
  dataType: "workout" | "nutrition" | "medical" | "progress_photo",
  aiAnalysis: string,
  keyInsights: string[]
}
```

### 9. Journal Entries Collection
```
/users/{userId}/journalEntries/{entryId}
{
  createdAt: timestamp,
  updatedAt: timestamp,
  date: string,
  title: string,
  content: string,
  moodRating: number,
  energyLevel: number,
  sleepQuality: number,
  stressLevel: number
}
```

### 10. AI Insights Collection
```
/users/{userId}/aiInsights/{insightId}
{
  createdAt: timestamp,
  insightType: string,
  title: string,
  content: string,
  confidenceScore: number,
  actionRequired: boolean,
  isRead: boolean,
  metadata: map,
  relatedWorkoutSessionId: string | null,
  relatedJournalEntryId: string | null
}
```

## Storage Structure

### Firebase Storage Buckets
```
/workout-uploads/{userId}/{fileName}
/nutrition-uploads/{userId}/{fileName}
/videos/{userId}/{videoId}/{fileName}
/photos/{userId}/{photoId}/{fileName}
/voice-recordings/{userId}/{workoutId}/{recordingId}.mp3
```

## Security Rules Example

```javascript
// Users collection
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// Workouts subcollection
match /users/{userId}/workouts/{workoutId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// Global exercises (read-only for authenticated users)
match /exercises/{exerciseId} {
  allow read: if request.auth != null;
  allow write: if false; // Admin only
}

// Food items (read for all, write for creator)
match /foodItems/{foodItemId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update, delete: if request.auth != null && 
    request.auth.uid == resource.data.createdBy;
}
```

## Migration Considerations

### 1. Data Denormalization
- Store frequently accessed data together (e.g., food item details in meal entries)
- Reduces need for "joins" but increases storage
- Use Cloud Functions to maintain consistency

### 2. Relationships
- Use document references for strong relationships
- Denormalize data for performance
- Consider subcollections for 1-to-many relationships

### 3. Queries
- Design collections based on query patterns
- Use composite indexes for complex queries
- Consider collection group queries for cross-user data

### 4. Transactions
- Group related data in same document when possible
- Use batched writes for multi-document updates
- Implement Cloud Functions for complex operations

### 5. Real-time Updates
- Leverage Firestore's real-time listeners
- Design data structure to minimize listener overhead
- Use pagination for large collections

### 6. Cost Optimization
- Minimize document reads with proper data structure
- Use caching strategies
- Aggregate data in Cloud Functions

## Migration Steps

1. **Phase 1: Setup**
   - Configure Firebase project
   - Set up authentication
   - Create security rules
   - Set up storage buckets

2. **Phase 2: Data Export**
   - Export Supabase data to JSON
   - Transform relational data to document structure
   - Handle data denormalization

3. **Phase 3: Import**
   - Batch import data to Firestore
   - Verify data integrity
   - Test security rules

4. **Phase 4: Application Updates**
   - Update data access layer
   - Implement Firestore queries
   - Update real-time features

5. **Phase 5: Testing & Optimization**
   - Performance testing
   - Query optimization
   - Cost analysis

## Performance Optimizations

1. **Indexing Strategy**
   - Create composite indexes for complex queries
   - Use collection group indexes sparingly
   - Monitor index usage

2. **Caching**
   - Enable offline persistence
   - Implement client-side caching
   - Use Firestore bundles for static data

3. **Query Optimization**
   - Limit query results
   - Use pagination
   - Avoid deep subcollection queries

4. **Data Structure**
   - Keep documents under 1MB
   - Avoid deeply nested data
   - Balance between normalization and denormalization