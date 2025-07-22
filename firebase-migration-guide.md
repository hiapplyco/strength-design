# Firebase Migration Guide - Updated January 2025

This guide provides step-by-step instructions for migrating Strength.Design from Supabase to Firebase Studio.

## Current Migration Status

### ✅ Completed
- Firebase project configuration
- Firestore data access layer (`/src/lib/firebase/db/`)
- Firebase Functions setup and Stripe migration
- Initial component conversions (workouts, documents, nutrition settings)
- Authentication provider setup (Firebase Auth)

### 🚧 In Progress
- Component migration from Supabase to Firestore
- Database query conversions
- Firebase Functions deployment

### 📋 To Do
- Complete remaining component migrations
- Data migration from Supabase
- Testing and validation
- Production deployment

## Prerequisites

1. Firebase project created ✅
2. Firebase CLI installed (`npm install -g firebase-tools`) ✅
3. Access to current Supabase project
4. Node.js 20+ installed ✅

## Setup Steps

### 1. Install Firebase Dependencies ✅

```bash
npm install firebase
npm install -D @types/firebase
```

### 2. Configure Firebase Project ✅

1. Create a new Firebase project at https://console.firebase.google.com
2. Enable the following services:
   - Authentication (Email/Password, Google, Apple)
   - Firestore Database
   - Storage
   - Functions (Blaze plan required)

3. Copy your Firebase configuration to `.env.local`:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### 3. Deploy Security Rules

```bash
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
firebase deploy --only firestore:indexes
```

### 4. Deploy Firebase Functions

```bash
cd functions
npm install
firebase functions:config:set stripe.secret_key="YOUR_STRIPE_SECRET_KEY"
firebase functions:config:set stripe.webhook_secret="YOUR_STRIPE_WEBHOOK_SECRET"
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
npm run deploy
```

## Detailed Next Steps

### Phase 1: Complete Code Migration (Current Phase)

#### 1.1 Remaining Database Query Conversions

**Components to Update:**
- [ ] `SlamPlayerProfile.tsx` - Convert player dashboard queries
- [ ] `components/video-analysis/hooks/useVideoUpload.ts` - Video storage queries
- [ ] `components/video-analysis/hooks/useSharedContent.ts` - Shared content queries
- [ ] `components/workout-upload/WorkoutUploadButton.tsx` - File upload queries
- [ ] `components/workout/calendar/CalendarExportDialog.tsx` - Calendar export queries
- [ ] `components/journal/*` - Journal entry queries
- [ ] `components/landing/WorkoutDisplay.tsx` - Display queries

**Hooks to Update:**
- [ ] `hooks/useSubscription.ts` → `hooks/useSubscription.firebase.ts`
- [ ] `hooks/useEnhancedFoodSearch.ts` → Use Firestore food items
- [ ] `hooks/workout-generation/workoutGenerationService.ts` → Firebase Functions

#### 1.2 Firebase Functions to Implement

**High Priority:**
- [x] Stripe integration (create-checkout, customer-portal, webhook)
- [x] Chat with Gemini
- [ ] Generate weekly workouts
- [ ] Enhanced chat functionality
- [ ] Workout title/summary generation

**Medium Priority:**
- [ ] Exercise search
- [ ] USDA food search
- [ ] Nutrition plan parsing
- [ ] Video analysis
- [ ] Text-to-speech

**Low Priority:**
- [ ] Import exercises
- [ ] Weather data
- [ ] Program search

#### 1.3 Update Authentication Flow

Replace all instances of Supabase auth:
```typescript
// Find all files using Supabase auth
grep -r "supabase.auth" src/

// Update to Firebase Auth
import { auth } from '@/lib/firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
```

### Phase 2: Data Migration

#### 2.1 Create Migration Script

```typescript
// src/scripts/migrate-data.ts
import { createClient } from '@supabase/supabase-js';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const app = initializeApp({
  credential: cert('./service-account-key.json')
});

const firestore = getFirestore();

async function migrateUsers() {
  // 1. Export users from Supabase Auth
  // 2. Create users in Firebase Auth
  // 3. Migrate user profiles to Firestore
}

async function migrateWorkouts() {
  // 1. Query all workouts from Supabase
  // 2. Transform to Firestore structure
  // 3. Batch write to Firestore
}

async function migrateNutrition() {
  // 1. Query nutrition data
  // 2. Transform to daily logs structure
  // 3. Write to user subcollections
}

// Run migrations in order
async function runMigration() {
  await migrateUsers();
  await migrateWorkouts();
  await migrateNutrition();
  // ... other migrations
}
```

#### 2.2 Migration Checklist

- [ ] Export Supabase data to JSON
- [ ] Create user accounts in Firebase Auth
- [ ] Migrate user profiles and settings
- [ ] Migrate workouts and workout history
- [ ] Migrate nutrition logs and food items
- [ ] Migrate chat sessions and messages
- [ ] Migrate shared documents
- [ ] Migrate file uploads (Storage)
- [ ] Verify data integrity

### Phase 3: Testing & Validation

#### 3.1 Component Testing

For each converted component:
1. Test CRUD operations
2. Verify real-time updates
3. Check error handling
4. Test offline functionality
5. Validate data structure

#### 3.2 Integration Testing

- [ ] Authentication flow (sign up, sign in, sign out)
- [ ] Workout generation and saving
- [ ] Nutrition tracking workflow
- [ ] Document sharing
- [ ] Stripe subscription flow
- [ ] File uploads

#### 3.3 Performance Testing

- [ ] Measure query performance
- [ ] Check bundle size impact
- [ ] Test offline sync
- [ ] Validate caching behavior

### Phase 4: Deployment

#### 4.1 Pre-deployment Checklist

- [ ] All tests passing
- [ ] Security rules reviewed and tested
- [ ] Environment variables configured
- [ ] Firebase Functions deployed
- [ ] Indexes created for all queries
- [ ] Backup strategy in place

#### 4.2 Gradual Rollout

1. **Alpha Testing** (1 week)
   - Internal team testing
   - Fix critical bugs

2. **Beta Testing** (2 weeks)
   - Limited user group
   - Monitor performance
   - Gather feedback

3. **Production Release**
   - Gradual rollout (10% → 50% → 100%)
   - Monitor error rates
   - Have rollback plan ready

#### 4.3 Post-deployment

- [ ] Monitor Firebase Console for errors
- [ ] Check Firestore usage and costs
- [ ] Review security rules effectiveness
- [ ] Optimize based on usage patterns

## File Structure Created

```
src/lib/firebase/
├── config.ts              # Firebase initialization ✅
├── db/                    # Database layer ✅
│   ├── index.ts          # Main exports
│   ├── types.ts          # TypeScript interfaces
│   ├── collections.ts    # Collection paths
│   ├── converters.ts     # Firestore converters
│   └── queries.ts        # Query functions
├── migration/
│   └── migrate-from-supabase.ts  # Migration script
└── services/             # Service layer (optional)

functions/                 # Firebase Functions ✅
├── src/
│   ├── index.ts          # Function exports
│   ├── stripe/           # Stripe functions
│   ├── ai/               # AI/ML functions
│   ├── utils/            # Utility functions
│   └── shared/           # Shared code
├── package.json
└── tsconfig.json

# Root files
├── firebase.json         # Firebase configuration ✅
├── firestore.rules       # Security rules ✅
├── storage.rules         # Storage rules ✅
└── firestore.indexes.json # Composite indexes ✅
```

## Common Migration Patterns

### Query Conversion Examples

```typescript
// Supabase → Firestore

// SELECT with filter
// Before:
const { data } = await supabase
  .from('workouts')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// After:
const workouts = await workoutQueries.getUserWorkouts(userId);

// INSERT
// Before:
const { data, error } = await supabase
  .from('workouts')
  .insert({ ...workoutData });

// After:
const workoutId = await workoutQueries.createWorkout(userId, workoutData);

// UPDATE
// Before:
await supabase
  .from('workouts')
  .update({ title: 'New Title' })
  .eq('id', workoutId);

// After:
await workoutQueries.updateWorkout(userId, workoutId, { title: 'New Title' });
```

### Storage Migration

```typescript
// Supabase Storage → Firebase Storage
// Before:
const { data, error } = await supabase.storage
  .from('workout-uploads')
  .upload(fileName, file);

// After:
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';

const storageRef = ref(storage, `workout-uploads/${userId}/${fileName}`);
const snapshot = await uploadBytes(storageRef, file);
const downloadURL = await getDownloadURL(snapshot.ref);
```

### Real-time Subscriptions

```typescript
// Supabase Realtime → Firestore Listeners
// Before:
const subscription = supabase
  .from('workouts')
  .on('INSERT', payload => {
    console.log('New workout:', payload.new);
  })
  .subscribe();

// After:
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const q = query(
  collection(db, `users/${userId}/workouts`),
  where('createdAt', '>', new Date())
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      console.log('New workout:', change.doc.data());
    }
  });
});
```

## Troubleshooting

### Common Issues

1. **CORS Errors with Functions**
   - Ensure CORS is properly configured in Firebase Functions
   - Check allowed origins in function code

2. **Permission Denied Errors**
   - Review Firestore security rules
   - Ensure user is authenticated
   - Check document ownership

3. **Missing Data After Migration**
   - Verify transformation logic
   - Check for null/undefined values
   - Review timestamp conversions

4. **Performance Issues**
   - Create composite indexes
   - Implement pagination
   - Use proper query limits

## Support Resources

- Firebase Documentation: https://firebase.google.com/docs
- Firebase Console: https://console.firebase.google.com
- Firestore Data Modeling: https://firebase.google.com/docs/firestore/data-model
- Security Rules Guide: https://firebase.google.com/docs/firestore/security/get-started
- Firebase Functions: https://firebase.google.com/docs/functions

## Cost Optimization Tips

1. **Firestore**
   - Minimize document reads with proper data structure
   - Use subcollections for large datasets
   - Implement client-side caching

2. **Storage**
   - Compress images before upload
   - Use appropriate file formats
   - Implement lifecycle rules

3. **Functions**
   - Optimize cold starts
   - Use minimum memory allocation
   - Implement caching where possible

---

*Last Updated: January 2025*
*Version: 2.0 - Post-Implementation Update*