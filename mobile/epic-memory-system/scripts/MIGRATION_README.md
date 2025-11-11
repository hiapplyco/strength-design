# Supabase to Firebase Migration Guide

This guide explains how to migrate your data from Supabase to Firebase using the provided migration script.

## Prerequisites

1. **Firebase Service Account Key**
   - Go to Firebase Console > Project Settings > Service Accounts
   - Generate a new private key
   - Save it as `firebase-service-account.json` in the project root

2. **Supabase Service Role Key**
   - Go to Supabase Dashboard > Settings > API
   - Copy your service role key (not the anon key)
   - Add it to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

3. **Environment Variables**
   ```env
   # .env.local
   VITE_SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Install Dependencies**
   ```bash
   npm install @supabase/supabase-js firebase-admin dotenv
   ```

## Running the Migration

### 1. Test Migration (Dry Run)
```bash
npx ts-node scripts/migrate-supabase-to-firebase.ts --dry-run
```

### 2. Full Migration
```bash
npx ts-node scripts/migrate-supabase-to-firebase.ts
```

### 3. Skip User Migration (if users already migrated)
```bash
npx ts-node scripts/migrate-supabase-to-firebase.ts --skip-users
```

## What Gets Migrated

The script migrates the following data:

1. **Users** - All user accounts with metadata
2. **User Profiles** - Profile information and settings
3. **Workouts** - Generated workout plans
4. **Workout Sessions** - Scheduled and completed workouts
5. **Nutrition Logs** - Daily nutrition tracking
6. **Journal Entries** - User journal entries
7. **Chat Sessions** - AI chat history and messages
8. **Exercises** - Exercise database
9. **Food Items** - Food database

## Migration Process

The script performs these steps:

1. **User Migration**
   - Exports users from Supabase Auth
   - Imports them to Firebase Auth
   - Preserves UIDs and metadata
   - Note: Passwords cannot be migrated directly

2. **Data Migration**
   - Reads data from Supabase tables
   - Transforms timestamps to Firestore format
   - Preserves document IDs
   - Writes to appropriate Firebase collections

3. **Structure Mapping**
   ```
   Supabase Table          →  Firebase Collection
   profiles               →  user_profiles
   generated_workouts     →  users/{userId}/workouts
   workout_sessions       →  users/{userId}/workout_sessions
   daily_nutrition_logs   →  users/{userId}/daily_nutrition_logs
   journal_entries        →  users/{userId}/journal_entries
   chat_sessions          →  chat_sessions
   chat_messages          →  chat_messages
   exercises              →  exercises
   food_items             →  food_items
   ```

## Post-Migration Steps

### 1. User Password Reset
Since passwords cannot be migrated directly, users will need to reset their passwords:

```javascript
// Add this to your login page
const handleSupabaseUserLogin = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    toast({
      title: "Password Reset Required",
      description: "We've sent you an email to set up your password for the new system.",
    });
  } catch (error) {
    console.error(error);
  }
};
```

### 2. Verify Data Integrity
- Check user counts match
- Verify critical user data
- Test authentication flow
- Validate data relationships

### 3. Update Environment Variables
Remove Supabase variables and ensure only Firebase variables are present:
```env
# Remove these
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Keep these
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# etc.
```

### 4. Storage Migration
For files in Supabase Storage, you'll need to:
1. Download files from Supabase Storage
2. Upload to Firebase Storage
3. Update file references in the database

### 5. Deploy Firebase Security Rules
```bash
firebase deploy --only firestore:rules,storage:rules
```

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**
   - Ensure service account has proper permissions
   - Check Firebase security rules

2. **"User already exists" errors**
   - Users might already be in Firebase
   - Use `--skip-users` flag

3. **Large dataset timeouts**
   - Run migration in phases
   - Increase Node.js memory: `NODE_OPTIONS="--max-old-space-size=4096"`

4. **Missing data after migration**
   - Check migration report for failures
   - Verify source data exists in Supabase

## Migration Report

After completion, a report is generated:
- Location: `scripts/migration-report-{date}.txt`
- Contains statistics for each data type
- Lists any failed migrations

## Rollback Plan

If you need to rollback:

1. **Delete Firebase Data** (if needed)
   ```javascript
   // Use Firebase Admin SDK to delete collections
   ```

2. **Restore Supabase Connection**
   - Revert environment variables
   - Redeploy with Supabase configuration

3. **Notify Users**
   - Communicate any authentication changes

## Support

For issues during migration:
1. Check the migration logs
2. Review the generated report
3. Verify prerequisites are met
4. Check Firebase Console for quota limits