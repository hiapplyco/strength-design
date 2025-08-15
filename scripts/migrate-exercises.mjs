import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// IMPORTANT: Replace with your service account key
// Download from Firebase Console > Project Settings > Service Accounts
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const exercises = JSON.parse(readFileSync('../public/wrkout-exercises-full.json', 'utf8'));

async function migrateExercises() {
  const exercisesCollection = db.collection('exercises');
  let batch = db.batch();
  let count = 0;

  for (const exercise of exercises) {
    const docRef = exercisesCollection.doc(exercise.id);
    batch.set(docRef, exercise);
    count++;

    if (count === 500) {
      console.log('Committing batch of 500 exercises...');
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) {
    console.log(`Committing final batch of ${count} exercises...`);
    await batch.commit();
  }

  console.log('Exercise migration complete!');
}

migrateExercises().catch(console.error);
