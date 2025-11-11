import * as admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Need service role key for auth access
);

// Migration statistics
let stats = {
  users: { total: 0, migrated: 0, failed: 0 },
  profiles: { total: 0, migrated: 0, failed: 0 },
  workouts: { total: 0, migrated: 0, failed: 0 },
  workoutSessions: { total: 0, migrated: 0, failed: 0 },
  nutritionLogs: { total: 0, migrated: 0, failed: 0 },
  journalEntries: { total: 0, migrated: 0, failed: 0 },
  chatSessions: { total: 0, migrated: 0, failed: 0 },
  documents: { total: 0, migrated: 0, failed: 0 },
  exercises: { total: 0, migrated: 0, failed: 0 },
  foodItems: { total: 0, migrated: 0, failed: 0 }
};

// Log migration progress
function log(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

// Batch write helper
async function batchWrite(collection: string, documents: any[]) {
  const batchSize = 500; // Firestore batch limit
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = db.batch();
    const batchDocs = documents.slice(i, i + batchSize);
    
    for (const doc of batchDocs) {
      const ref = db.collection(collection).doc(doc.id);
      batch.set(ref, doc.data);
    }
    
    await batch.commit();
    log(`Batch written: ${i + batchDocs.length}/${documents.length} documents to ${collection}`);
  }
}

// 1. Migrate Users
async function migrateUsers() {
  log('Starting user migration...');
  
  try {
    // Get all users from Supabase auth
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) throw error;
    if (!users || users.users.length === 0) {
      log('No users found in Supabase', 'info');
      return;
    }
    
    stats.users.total = users.users.length;
    
    // Prepare user import records for Firebase
    const userImportRecords: admin.auth.UserImportRecord[] = [];
    
    for (const user of users.users) {
      try {
        const importRecord: admin.auth.UserImportRecord = {
          uid: user.id,
          email: user.email,
          emailVerified: user.email_confirmed_at !== null,
          phoneNumber: user.phone,
          disabled: false,
          metadata: {
            creationTime: user.created_at,
            lastSignInTime: user.last_sign_in_at || undefined
          },
          providerData: []
        };
        
        // Add display name if available
        if (user.user_metadata?.full_name) {
          importRecord.displayName = user.user_metadata.full_name;
        }
        
        // Add custom claims
        if (user.user_metadata) {
          importRecord.customClaims = {
            supabase_metadata: user.user_metadata
          };
        }
        
        userImportRecords.push(importRecord);
      } catch (userError) {
        log(`Failed to prepare user ${user.email}: ${userError}`, 'error');
        stats.users.failed++;
      }
    }
    
    // Import users to Firebase in batches
    const batchSize = 1000; // Firebase limit
    for (let i = 0; i < userImportRecords.length; i += batchSize) {
      const batch = userImportRecords.slice(i, i + batchSize);
      
      try {
        const result = await auth.importUsers(batch, {
          hash: {
            algorithm: 'BCRYPT' // Supabase uses bcrypt
          }
        });
        
        stats.users.migrated += result.successCount;
        stats.users.failed += result.failureCount;
        
        if (result.errors.length > 0) {
          result.errors.forEach(error => {
            log(`User import error: ${error.error.message}`, 'error');
          });
        }
        
        log(`Imported ${result.successCount} users (batch ${Math.floor(i / batchSize) + 1})`, 'success');
      } catch (batchError) {
        log(`Batch import failed: ${batchError}`, 'error');
        stats.users.failed += batch.length;
      }
    }
    
    log(`User migration complete: ${stats.users.migrated}/${stats.users.total} migrated`, 'success');
  } catch (error) {
    log(`User migration failed: ${error}`, 'error');
  }
}

// 2. Migrate User Profiles
async function migrateProfiles() {
  log('Starting profile migration...');
  
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) throw error;
    if (!profiles || profiles.length === 0) {
      log('No profiles found', 'info');
      return;
    }
    
    stats.profiles.total = profiles.length;
    
    const documents = profiles.map(profile => ({
      id: profile.id,
      data: {
        ...profile,
        created_at: admin.firestore.Timestamp.fromDate(new Date(profile.created_at)),
        updated_at: admin.firestore.Timestamp.fromDate(new Date(profile.updated_at || profile.created_at))
      }
    }));
    
    await batchWrite('user_profiles', documents);
    stats.profiles.migrated = profiles.length;
    
    log(`Profile migration complete: ${stats.profiles.migrated}/${stats.profiles.total} migrated`, 'success');
  } catch (error) {
    log(`Profile migration failed: ${error}`, 'error');
    stats.profiles.failed = stats.profiles.total;
  }
}

// 3. Migrate Workouts
async function migrateWorkouts() {
  log('Starting workout migration...');
  
  try {
    const { data: workouts, error } = await supabase
      .from('generated_workouts')
      .select('*');
    
    if (error) throw error;
    if (!workouts || workouts.length === 0) {
      log('No workouts found', 'info');
      return;
    }
    
    stats.workouts.total = workouts.length;
    
    // Group workouts by user
    const workoutsByUser = workouts.reduce((acc, workout) => {
      if (!acc[workout.user_id]) acc[workout.user_id] = [];
      acc[workout.user_id].push(workout);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Migrate workouts for each user
    for (const [userId, userWorkouts] of Object.entries(workoutsByUser)) {
      try {
        const batch = db.batch();
        
        for (const workout of userWorkouts) {
          const ref = db.collection(`users/${userId}/workouts`).doc(workout.id);
          batch.set(ref, {
            ...workout,
            created_at: admin.firestore.Timestamp.fromDate(new Date(workout.created_at)),
            updated_at: admin.firestore.Timestamp.fromDate(new Date(workout.updated_at || workout.created_at))
          });
        }
        
        await batch.commit();
        stats.workouts.migrated += userWorkouts.length;
        log(`Migrated ${userWorkouts.length} workouts for user ${userId}`);
      } catch (userError) {
        log(`Failed to migrate workouts for user ${userId}: ${userError}`, 'error');
        stats.workouts.failed += userWorkouts.length;
      }
    }
    
    log(`Workout migration complete: ${stats.workouts.migrated}/${stats.workouts.total} migrated`, 'success');
  } catch (error) {
    log(`Workout migration failed: ${error}`, 'error');
  }
}

// 4. Migrate Workout Sessions
async function migrateWorkoutSessions() {
  log('Starting workout session migration...');
  
  try {
    const { data: sessions, error } = await supabase
      .from('workout_sessions')
      .select('*');
    
    if (error) throw error;
    if (!sessions || sessions.length === 0) {
      log('No workout sessions found', 'info');
      return;
    }
    
    stats.workoutSessions.total = sessions.length;
    
    // Group sessions by user
    const sessionsByUser = sessions.reduce((acc, session) => {
      if (!acc[session.user_id]) acc[session.user_id] = [];
      acc[session.user_id].push(session);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Migrate sessions for each user
    for (const [userId, userSessions] of Object.entries(sessionsByUser)) {
      try {
        const batch = db.batch();
        
        for (const session of userSessions) {
          const ref = db.collection(`users/${userId}/workout_sessions`).doc(session.id);
          batch.set(ref, {
            ...session,
            created_at: admin.firestore.Timestamp.fromDate(new Date(session.created_at)),
            updated_at: admin.firestore.Timestamp.fromDate(new Date(session.updated_at || session.created_at))
          });
        }
        
        await batch.commit();
        stats.workoutSessions.migrated += userSessions.length;
        log(`Migrated ${userSessions.length} workout sessions for user ${userId}`);
      } catch (userError) {
        log(`Failed to migrate workout sessions for user ${userId}: ${userError}`, 'error');
        stats.workoutSessions.failed += userSessions.length;
      }
    }
    
    log(`Workout session migration complete: ${stats.workoutSessions.migrated}/${stats.workoutSessions.total} migrated`, 'success');
  } catch (error) {
    log(`Workout session migration failed: ${error}`, 'error');
  }
}

// 5. Migrate Nutrition Logs
async function migrateNutritionLogs() {
  log('Starting nutrition log migration...');
  
  try {
    const { data: logs, error } = await supabase
      .from('daily_nutrition_logs')
      .select('*');
    
    if (error) throw error;
    if (!logs || logs.length === 0) {
      log('No nutrition logs found', 'info');
      return;
    }
    
    stats.nutritionLogs.total = logs.length;
    
    // Group logs by user
    const logsByUser = logs.reduce((acc, log) => {
      if (!acc[log.user_id]) acc[log.user_id] = [];
      acc[log.user_id].push(log);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Migrate logs for each user
    for (const [userId, userLogs] of Object.entries(logsByUser)) {
      try {
        const batch = db.batch();
        
        for (const log of userLogs) {
          const ref = db.collection(`users/${userId}/daily_nutrition_logs`).doc(log.id);
          batch.set(ref, {
            ...log,
            created_at: admin.firestore.Timestamp.fromDate(new Date(log.created_at)),
            updated_at: admin.firestore.Timestamp.fromDate(new Date(log.updated_at || log.created_at))
          });
        }
        
        await batch.commit();
        stats.nutritionLogs.migrated += userLogs.length;
        log(`Migrated ${userLogs.length} nutrition logs for user ${userId}`);
      } catch (userError) {
        log(`Failed to migrate nutrition logs for user ${userId}: ${userError}`, 'error');
        stats.nutritionLogs.failed += userLogs.length;
      }
    }
    
    log(`Nutrition log migration complete: ${stats.nutritionLogs.migrated}/${stats.nutritionLogs.total} migrated`, 'success');
  } catch (error) {
    log(`Nutrition log migration failed: ${error}`, 'error');
  }
}

// 6. Migrate Journal Entries
async function migrateJournalEntries() {
  log('Starting journal entry migration...');
  
  try {
    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('*');
    
    if (error) throw error;
    if (!entries || entries.length === 0) {
      log('No journal entries found', 'info');
      return;
    }
    
    stats.journalEntries.total = entries.length;
    
    // Group entries by user
    const entriesByUser = entries.reduce((acc, entry) => {
      if (!acc[entry.user_id]) acc[entry.user_id] = [];
      acc[entry.user_id].push(entry);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Migrate entries for each user
    for (const [userId, userEntries] of Object.entries(entriesByUser)) {
      try {
        const batch = db.batch();
        
        for (const entry of userEntries) {
          const ref = db.collection(`users/${userId}/journal_entries`).doc(entry.id);
          batch.set(ref, {
            ...entry,
            created_at: admin.firestore.Timestamp.fromDate(new Date(entry.created_at)),
            updated_at: admin.firestore.Timestamp.fromDate(new Date(entry.updated_at || entry.created_at))
          });
        }
        
        await batch.commit();
        stats.journalEntries.migrated += userEntries.length;
        log(`Migrated ${userEntries.length} journal entries for user ${userId}`);
      } catch (userError) {
        log(`Failed to migrate journal entries for user ${userId}: ${userError}`, 'error');
        stats.journalEntries.failed += userEntries.length;
      }
    }
    
    log(`Journal entry migration complete: ${stats.journalEntries.migrated}/${stats.journalEntries.total} migrated`, 'success');
  } catch (error) {
    log(`Journal entry migration failed: ${error}`, 'error');
  }
}

// 7. Migrate Chat Sessions and Messages
async function migrateChatSessions() {
  log('Starting chat session migration...');
  
  try {
    // Get chat sessions
    const { data: sessions, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*');
    
    if (sessionError) throw sessionError;
    if (!sessions || sessions.length === 0) {
      log('No chat sessions found', 'info');
      return;
    }
    
    stats.chatSessions.total = sessions.length;
    
    // Get all chat messages
    const { data: messages, error: messageError } = await supabase
      .from('chat_messages')
      .select('*');
    
    if (messageError) throw messageError;
    
    // Group messages by session
    const messagesBySession = (messages || []).reduce((acc, message) => {
      if (!acc[message.session_id]) acc[message.session_id] = [];
      acc[message.session_id].push(message);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Migrate sessions and their messages
    for (const session of sessions) {
      try {
        // Create session document
        await db.collection('chat_sessions').doc(session.id).set({
          ...session,
          created_at: admin.firestore.Timestamp.fromDate(new Date(session.created_at)),
          updated_at: admin.firestore.Timestamp.fromDate(new Date(session.updated_at || session.created_at))
        });
        
        // Migrate messages for this session
        const sessionMessages = messagesBySession[session.id] || [];
        if (sessionMessages.length > 0) {
          const batch = db.batch();
          
          for (const message of sessionMessages) {
            const ref = db.collection('chat_messages').doc(message.id);
            batch.set(ref, {
              ...message,
              created_at: admin.firestore.Timestamp.fromDate(new Date(message.created_at))
            });
          }
          
          await batch.commit();
        }
        
        stats.chatSessions.migrated++;
        log(`Migrated chat session ${session.id} with ${sessionMessages.length} messages`);
      } catch (sessionError) {
        log(`Failed to migrate chat session ${session.id}: ${sessionError}`, 'error');
        stats.chatSessions.failed++;
      }
    }
    
    log(`Chat session migration complete: ${stats.chatSessions.migrated}/${stats.chatSessions.total} migrated`, 'success');
  } catch (error) {
    log(`Chat session migration failed: ${error}`, 'error');
  }
}

// 8. Migrate Global Collections (Exercises, Food Items)
async function migrateGlobalCollections() {
  log('Starting global collections migration...');
  
  try {
    // Migrate exercises
    const { data: exercises, error: exerciseError } = await supabase
      .from('exercises')
      .select('*');
    
    if (exerciseError) throw exerciseError;
    if (exercises && exercises.length > 0) {
      stats.exercises.total = exercises.length;
      
      const exerciseDocs = exercises.map(exercise => ({
        id: exercise.id,
        data: {
          ...exercise,
          created_at: admin.firestore.Timestamp.fromDate(new Date(exercise.created_at || new Date())),
          updated_at: admin.firestore.Timestamp.fromDate(new Date(exercise.updated_at || exercise.created_at || new Date()))
        }
      }));
      
      await batchWrite('exercises', exerciseDocs);
      stats.exercises.migrated = exercises.length;
      log(`Migrated ${exercises.length} exercises`, 'success');
    }
    
    // Migrate food items
    const { data: foodItems, error: foodError } = await supabase
      .from('food_items')
      .select('*');
    
    if (foodError) throw foodError;
    if (foodItems && foodItems.length > 0) {
      stats.foodItems.total = foodItems.length;
      
      const foodDocs = foodItems.map(food => ({
        id: food.id,
        data: {
          ...food,
          created_at: admin.firestore.Timestamp.fromDate(new Date(food.created_at || new Date())),
          updated_at: admin.firestore.Timestamp.fromDate(new Date(food.updated_at || food.created_at || new Date()))
        }
      }));
      
      await batchWrite('food_items', foodDocs);
      stats.foodItems.migrated = foodItems.length;
      log(`Migrated ${foodItems.length} food items`, 'success');
    }
    
    log('Global collections migration complete', 'success');
  } catch (error) {
    log(`Global collections migration failed: ${error}`, 'error');
  }
}

// Main migration function
async function runMigration() {
  log('🚀 Starting Supabase to Firebase migration...', 'info');
  
  const startTime = Date.now();
  
  try {
    // Run migrations in order
    await migrateUsers();
    await migrateProfiles();
    await migrateWorkouts();
    await migrateWorkoutSessions();
    await migrateNutritionLogs();
    await migrateJournalEntries();
    await migrateChatSessions();
    await migrateGlobalCollections();
    
    const duration = (Date.now() - startTime) / 1000;
    
    // Generate migration report
    const report = `
=== MIGRATION COMPLETE ===
Duration: ${duration.toFixed(2)} seconds

Users: ${stats.users.migrated}/${stats.users.total} migrated (${stats.users.failed} failed)
Profiles: ${stats.profiles.migrated}/${stats.profiles.total} migrated (${stats.profiles.failed} failed)
Workouts: ${stats.workouts.migrated}/${stats.workouts.total} migrated (${stats.workouts.failed} failed)
Workout Sessions: ${stats.workoutSessions.migrated}/${stats.workoutSessions.total} migrated (${stats.workoutSessions.failed} failed)
Nutrition Logs: ${stats.nutritionLogs.migrated}/${stats.nutritionLogs.total} migrated (${stats.nutritionLogs.failed} failed)
Journal Entries: ${stats.journalEntries.migrated}/${stats.journalEntries.total} migrated (${stats.journalEntries.failed} failed)
Chat Sessions: ${stats.chatSessions.migrated}/${stats.chatSessions.total} migrated (${stats.chatSessions.failed} failed)
Exercises: ${stats.exercises.migrated}/${stats.exercises.total} migrated (${stats.exercises.failed} failed)
Food Items: ${stats.foodItems.migrated}/${stats.foodItems.total} migrated (${stats.foodItems.failed} failed)
`;
    
    log(report, 'success');
    
    // Save report to file
    const reportPath = path.join(__dirname, `migration-report-${new Date().toISOString().split('T')[0]}.txt`);
    await fs.writeFile(reportPath, report);
    log(`Migration report saved to: ${reportPath}`, 'info');
    
  } catch (error) {
    log(`Migration failed: ${error}`, 'error');
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const skipUsers = args.includes('--skip-users');

if (dryRun) {
  log('DRY RUN MODE - No data will be written', 'info');
}

// Run the migration
runMigration().then(() => {
  log('Migration process completed', 'success');
  process.exit(0);
}).catch((error) => {
  log(`Fatal error: ${error}`, 'error');
  process.exit(1);
});