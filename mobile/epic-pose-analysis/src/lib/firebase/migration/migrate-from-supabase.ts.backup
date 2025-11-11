import { createClient } from '@supabase/supabase-js';
import { 
  collection, 
  doc, 
  setDoc, 
  writeBatch, 
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config';
import type { Database } from '@/integrations/supabase/types';
import type { 
  UserProfile, 
  Workout, 
  NutritionLog, 
  FoodItem,
  Exercise,
  ChatSession,
  JournalEntry
} from '../types';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Batch size for Firestore writes
const BATCH_SIZE = 500;

// Helper function to convert Supabase timestamp to Firestore Timestamp
function toFirestoreTimestamp(dateString: string | null): Timestamp | null {
  if (!dateString) return null;
  return Timestamp.fromDate(new Date(dateString));
}

// Helper function to write in batches
async function writeBatchData<T extends { id?: string }>(
  collectionPath: string,
  data: T[],
  idField: string = 'id'
) {
  let batch = writeBatch(db);
  let operationCount = 0;
  
  for (const item of data) {
    const docId = (item as any)[idField] || doc(collection(db, collectionPath)).id;
    const docRef = doc(db, collectionPath, docId);
    
    batch.set(docRef, item);
    operationCount++;
    
    if (operationCount === BATCH_SIZE) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }
  }
  
  if (operationCount > 0) {
    await batch.commit();
  }
}

// Migration functions for each table
export async function migrateUsers() {
  console.log('Migrating users...');
  
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');
    
  if (profilesError) throw profilesError;
  
  const { data: fitnessProfiles, error: fitnessError } = await supabase
    .from('user_fitness_profiles')
    .select('*');
    
  if (fitnessError) throw fitnessError;
  
  const { data: nutritionSettings, error: nutritionError } = await supabase
    .from('nutrition_settings')
    .select('*');
    
  if (nutritionError) throw nutritionError;
  
  const { data: subscriptions, error: subError } = await supabase
    .from('subscriptions')
    .select('*');
    
  if (subError) throw subError;
  
  // Create user profile map
  const userProfilesMap = new Map<string, UserProfile>();
  
  // Process profiles
  profiles?.forEach(profile => {
    userProfilesMap.set(profile.id, {
      createdAt: toFirestoreTimestamp(profile.created_at)!,
      updatedAt: toFirestoreTimestamp(profile.updated_at)!,
      tier: (profile.tier as 'free' | 'pro' | 'premium') || 'free',
      freeWorkoutsUsed: profile.free_workouts_used || 0,
      trialEndDate: toFirestoreTimestamp(profile.trial_end_date),
    });
  });
  
  // Add fitness profiles
  fitnessProfiles?.forEach(fp => {
    const userProfile = userProfilesMap.get(fp.user_id);
    if (userProfile) {
      userProfile.fitnessProfile = {
        age: fp.age || undefined,
        gender: fp.gender as any || undefined,
        heightCm: fp.height_cm || undefined,
        weightKg: fp.weight_kg ? parseFloat(fp.weight_kg.toString()) : undefined,
        activityLevel: fp.activity_level as any || undefined,
        primaryGoal: fp.primary_goal || undefined,
        secondaryGoals: fp.secondary_goals || undefined,
        targetWeightKg: fp.target_weight_kg ? parseFloat(fp.target_weight_kg.toString()) : undefined,
        targetDate: toFirestoreTimestamp(fp.target_date) || undefined,
        trainingExperience: fp.training_experience as any || undefined,
        preferredTrainingDays: fp.preferred_training_days || undefined,
        preferredWorkoutDuration: fp.preferred_workout_duration || undefined,
        preferredTrainingTime: fp.preferred_training_time as any || undefined,
        injuries: fp.injuries || undefined,
        medicalConditions: fp.medical_conditions || undefined,
        medications: fp.medications || undefined,
        allergies: fp.allergies || undefined,
        dietaryRestrictions: fp.dietary_restrictions || undefined,
        gymAccess: fp.gym_access || false,
        homeEquipment: fp.home_equipment || undefined,
        chatExtractedData: fp.chat_extracted_data as any || undefined,
        fileExtractedData: fp.file_extracted_data as any || undefined,
        aiRecommendations: fp.ai_recommendations as any || undefined,
      };
    }
  });
  
  // Add nutrition settings
  nutritionSettings?.forEach(ns => {
    const userProfile = userProfilesMap.get(ns.user_id);
    if (userProfile) {
      userProfile.nutritionSettings = {
        targetCalories: ns.target_calories || undefined,
        targetProtein: ns.target_protein || undefined,
        targetCarbs: ns.target_carbs || undefined,
        targetFat: ns.target_fat || undefined,
        targetFiber: ns.target_fiber || undefined,
        targetSugar: ns.target_sugar || undefined,
        targetSodium: ns.target_sodium || undefined,
        targetCholesterol: ns.target_cholesterol || undefined,
        targetSaturatedFat: ns.target_saturated_fat || undefined,
        targetWaterMl: ns.target_water_ml || undefined,
        customTargets: ns.custom_targets as any || undefined,
        integrations: ns.integrations as any || undefined,
      };
    }
  });
  
  // Add subscriptions
  subscriptions?.forEach(sub => {
    if (sub.user_id) {
      const userProfile = userProfilesMap.get(sub.user_id);
      if (userProfile) {
        userProfile.subscription = {
          status: sub.status as any || 'incomplete',
          priceId: sub.price_id || undefined,
          currentPeriodEnd: toFirestoreTimestamp(sub.current_period_end) || undefined,
          currentPeriodStart: toFirestoreTimestamp(sub.current_period_start) || undefined,
          cancelAtPeriodEnd: sub.cancel_at_period_end || false,
          metadata: sub.metadata as any || undefined,
        };
      }
    }
  });
  
  // Write to Firestore
  const batch = writeBatch(db);
  userProfilesMap.forEach((profile, userId) => {
    const docRef = doc(db, 'users', userId);
    batch.set(docRef, profile);
  });
  
  await batch.commit();
  console.log(`Migrated ${userProfilesMap.size} users`);
}

export async function migrateWorkouts() {
  console.log('Migrating workouts...');
  
  const { data: workouts, error: workoutsError } = await supabase
    .from('workouts')
    .select('*');
    
  if (workoutsError) throw workoutsError;
  
  const { data: generatedWorkouts, error: genError } = await supabase
    .from('generated_workouts')
    .select('*');
    
  if (genError) throw genError;
  
  // Group workouts by user
  const workoutsByUser = new Map<string, Workout[]>();
  
  // Process regular workouts
  workouts?.forEach(workout => {
    if (workout.user_id) {
      const userWorkouts = workoutsByUser.get(workout.user_id) || [];
      userWorkouts.push({
        id: workout.id,
        createdAt: toFirestoreTimestamp(workout.created_at)!,
        updatedAt: toFirestoreTimestamp(workout.updated_at)!,
        day: workout.day,
        description: workout.description || undefined,
        warmup: workout.warmup,
        workout: workout.workout,
        strength: workout.strength || undefined,
        notes: workout.notes || undefined,
      });
      workoutsByUser.set(workout.user_id, userWorkouts);
    }
  });
  
  // Process generated workouts
  generatedWorkouts?.forEach(gw => {
    if (gw.user_id) {
      const userWorkouts = workoutsByUser.get(gw.user_id) || [];
      userWorkouts.push({
        id: gw.id,
        createdAt: toFirestoreTimestamp(gw.generated_at || new Date().toISOString())!,
        updatedAt: toFirestoreTimestamp(gw.generated_at || new Date().toISOString())!,
        day: '',
        warmup: '',
        workout: '',
        workoutData: gw.workout_data as any,
        title: gw.title || undefined,
        summary: gw.summary || undefined,
        difficultyLevel: gw.difficulty_level || undefined,
        equipmentNeeded: gw.equipment_needed || undefined,
        estimatedDurationMinutes: gw.estimated_duration_minutes || undefined,
        targetMuscleGroups: gw.target_muscle_groups || undefined,
        tags: gw.tags || undefined,
        isFavorite: gw.is_favorite || false,
        scheduledDate: toFirestoreTimestamp(gw.scheduled_date) || undefined,
      });
      workoutsByUser.set(gw.user_id, userWorkouts);
    }
  });
  
  // Write workouts for each user
  let totalWorkouts = 0;
  for (const [userId, userWorkouts] of workoutsByUser) {
    const batch = writeBatch(db);
    
    userWorkouts.forEach(workout => {
      const docRef = doc(collection(db, `users/${userId}/workouts`));
      batch.set(docRef, workout);
    });
    
    await batch.commit();
    totalWorkouts += userWorkouts.length;
  }
  
  console.log(`Migrated ${totalWorkouts} workouts`);
}

export async function migrateNutrition() {
  console.log('Migrating nutrition data...');
  
  const { data: nutritionLogs, error: logsError } = await supabase
    .from('nutrition_logs')
    .select('*');
    
  if (logsError) throw logsError;
  
  const { data: mealEntries, error: mealsError } = await supabase
    .from('meal_entries')
    .select('*, food_items(*)');
    
  if (mealsError) throw mealsError;
  
  const { data: exerciseEntries, error: exercisesError } = await supabase
    .from('exercise_entries')
    .select('*');
    
  if (exercisesError) throw exercisesError;
  
  // Group by user and date
  const nutritionByUserDate = new Map<string, Map<string, NutritionLog>>();
  
  // Process nutrition logs
  nutritionLogs?.forEach(log => {
    const userLogs = nutritionByUserDate.get(log.user_id) || new Map();
    userLogs.set(log.date, {
      date: log.date,
      createdAt: toFirestoreTimestamp(log.created_at)!,
      updatedAt: toFirestoreTimestamp(log.updated_at)!,
      waterConsumedMl: log.water_consumed_ml || 0,
      meals: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: [],
      },
    });
    nutritionByUserDate.set(log.user_id, userLogs);
  });
  
  // Write nutrition logs
  let totalLogs = 0;
  for (const [userId, userLogs] of nutritionByUserDate) {
    for (const [date, log] of userLogs) {
      const docRef = doc(db, `users/${userId}/nutritionLogs`, date);
      await setDoc(docRef, log);
      totalLogs++;
    }
  }
  
  console.log(`Migrated ${totalLogs} nutrition logs`);
}

export async function migrateGlobalCollections() {
  console.log('Migrating global collections...');
  
  // Migrate exercises
  const { data: exercises, error: exercisesError } = await supabase
    .from('exercises')
    .select('*');
    
  if (exercisesError) throw exercisesError;
  
  const exerciseData: Exercise[] = exercises?.map(ex => ({
    id: ex.id,
    name: ex.name,
    category: ex.category || undefined,
    equipment: ex.equipment || undefined,
    force: ex.force || undefined,
    level: ex.level || undefined,
    mechanic: ex.mechanic || undefined,
    primaryMuscles: ex.primary_muscles || undefined,
    secondaryMuscles: ex.secondary_muscles || undefined,
    instructions: ex.instructions || undefined,
    createdAt: toFirestoreTimestamp(ex.created_at || new Date().toISOString())!,
    updatedAt: toFirestoreTimestamp(ex.updated_at || new Date().toISOString())!,
  })) || [];
  
  await writeBatchData('exercises', exerciseData);
  console.log(`Migrated ${exerciseData.length} exercises`);
  
  // Migrate food items
  const { data: foodItems, error: foodError } = await supabase
    .from('food_items')
    .select('*');
    
  if (foodError) throw foodError;
  
  const foodData: FoodItem[] = foodItems?.map(food => ({
    id: food.id,
    name: food.name,
    brand: food.brand,
    caloriesPerServing: food.calories_per_serving,
    proteinPerServing: food.protein_per_serving || 0,
    carbsPerServing: food.carbs_per_serving || 0,
    fatPerServing: food.fat_per_serving || 0,
    fiberPerServing: food.fiber_per_serving,
    sugarPerServing: food.sugar_per_serving,
    sodiumPerServing: food.sodium_per_serving,
    servingSize: food.serving_size,
    servingUnit: food.serving_unit,
    createdAt: toFirestoreTimestamp(food.created_at)!,
    updatedAt: toFirestoreTimestamp(food.updated_at)!,
    createdBy: 'system', // Default for migrated items
  })) || [];
  
  await writeBatchData('foodItems', foodData);
  console.log(`Migrated ${foodData.length} food items`);
}

// Main migration function
export async function runMigration() {
  try {
    console.log('Starting Supabase to Firebase migration...');
    
    // Run migrations in order
    await migrateUsers();
    await migrateGlobalCollections();
    await migrateWorkouts();
    await migrateNutrition();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Export individual migration functions for testing
export const migrations = {
  migrateUsers,
  migrateWorkouts,
  migrateNutrition,
  migrateGlobalCollections,
};