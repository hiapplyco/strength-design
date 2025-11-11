// Script to create a demo user in Firebase Auth emulator
// Run this after the emulators are started

const admin = require('firebase-admin');

// Initialize admin with emulator settings
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

admin.initializeApp({
  projectId: 'demo-strength-design',
});

async function createDemoUser() {
  try {
    // Create auth user
    const userRecord = await admin.auth().createUser({
      uid: 'demo-user-001',
      email: 'demo@example.com',
      password: 'demo123456',
      displayName: 'Demo User',
      emailVerified: true,
    });
    
    console.log('✅ Demo user created:', userRecord.uid);
    console.log('📧 Email: demo@example.com');
    console.log('🔑 Password: demo123456');
    
    // Create Firestore user document
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email: 'demo@example.com',
      displayName: 'Demo User',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      preferences: {
        units: 'imperial',
        theme: 'dark',
      },
      profile: {
        age: 30,
        height: 70,
        weight: 180,
        fitnessLevel: 'intermediate',
        goals: ['Build Muscle', 'Increase Strength'],
      },
    });
    
    console.log('✅ Firestore user document created');
    
    // Create some sample workouts
    const workouts = [
      {
        title: 'Push Day - Chest & Triceps',
        exercises: [
          { name: 'Bench Press', sets: 4, reps: '8-10', weight: 185 },
          { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', weight: 65 },
          { name: 'Cable Flyes', sets: 3, reps: '12-15', weight: 30 },
          { name: 'Tricep Dips', sets: 3, reps: '10-12', weight: 'bodyweight' },
        ],
      },
      {
        title: 'Pull Day - Back & Biceps',
        exercises: [
          { name: 'Deadlifts', sets: 4, reps: '6-8', weight: 275 },
          { name: 'Pull-ups', sets: 3, reps: '8-10', weight: 'bodyweight' },
          { name: 'Barbell Rows', sets: 3, reps: '10-12', weight: 135 },
          { name: 'Hammer Curls', sets: 3, reps: '12-15', weight: 35 },
        ],
      },
    ];
    
    for (const workout of workouts) {
      await admin.firestore().collection('workouts').add({
        ...workout,
        userId: userRecord.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    console.log('✅ Sample workouts created');
    console.log('\n🎉 Demo setup complete! You can now login with:');
    console.log('   Email: demo@example.com');
    console.log('   Password: demo123456');
    
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('ℹ️ Demo user already exists');
      console.log('   Email: demo@example.com');
      console.log('   Password: demo123456');
    } else {
      console.error('❌ Error creating demo user:', error);
    }
  } finally {
    process.exit(0);
  }
}

createDemoUser();