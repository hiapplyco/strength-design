#!/usr/bin/env node

const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');

// Initialize Firebase Admin with Application Default Credentials
admin.initializeApp({
  storageBucket: 'strength-design.appspot.com'
});

const db = admin.firestore();
const storage = admin.storage().bucket();

// Categories mapping
const categoryMapping = {
  'strength': 'strength',
  'cardio': 'cardio',
  'stretching': 'stretching',
  'plyometrics': 'plyometrics',
  'powerlifting': 'powerlifting',
  'olympic_weightlifting': 'olympic',
  'strongman': 'strongman',
  'calisthenics': 'calisthenics'
};

// Equipment mapping
const equipmentMapping = {
  'body only': 'bodyweight',
  'machine': 'machine',
  'barbell': 'barbell',
  'dumbbell': 'dumbbell',
  'kettlebells': 'kettlebell',
  'cable': 'cable',
  'bands': 'resistance_band',
  'medicine ball': 'medicine_ball',
  'exercise ball': 'stability_ball',
  'e-z curl bar': 'ez_bar',
  'foam roll': 'foam_roller',
  'other': 'other',
  'none': 'none'
};

// Difficulty mapping based on level
const difficultyMapping = {
  'beginner': 'beginner',
  'intermediate': 'intermediate',
  'expert': 'advanced'
};

async function uploadImage(localPath, remotePath) {
  try {
    const file = await fs.readFile(localPath);
    const fileRef = storage.file(remotePath);
    await fileRef.save(file, {
      metadata: {
        contentType: 'image/gif'
      }
    });
    await fileRef.makePublic();
    return `https://storage.googleapis.com/${storage.name}/${remotePath}`;
  } catch (error) {
    console.error(`Failed to upload image ${localPath}:`, error.message);
    return null;
  }
}

async function importExercise(exerciseDir) {
  const exercisePath = path.join(exerciseDir, 'exercise.json');
  const imagesDir = path.join(exerciseDir, 'images');
  
  try {
    // Read exercise data
    const exerciseData = JSON.parse(await fs.readFile(exercisePath, 'utf8'));
    const exerciseName = path.basename(exerciseDir).replace(/_/g, ' ');
    
    // Generate unique ID
    const exerciseId = exerciseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Upload images
    const imageUrls = [];
    try {
      const imageFiles = await fs.readdir(imagesDir);
      for (const imageFile of imageFiles) {
        if (imageFile.endsWith('.gif') || imageFile.endsWith('.jpg') || imageFile.endsWith('.png')) {
          const imagePath = path.join(imagesDir, imageFile);
          const remotePath = `exercises/${exerciseId}/${imageFile}`;
          const url = await uploadImage(imagePath, remotePath);
          if (url) {
            imageUrls.push(url);
          }
        }
      }
    } catch (error) {
      console.log(`No images found for ${exerciseName}`);
    }
    
    // Map exercise data to our schema
    const mappedExercise = {
      id: exerciseId,
      name: exerciseName,
      category: categoryMapping[exerciseData.category] || 'strength',
      equipment: equipmentMapping[exerciseData.equipment] || 'other',
      primaryMuscles: exerciseData.primaryMuscles || [],
      secondaryMuscles: exerciseData.secondaryMuscles || [],
      difficulty: difficultyMapping[exerciseData.level] || 'intermediate',
      force: exerciseData.force || null,
      mechanic: exerciseData.mechanic || null,
      instructions: exerciseData.instructions || [],
      images: imageUrls,
      source: 'wrkout',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save to Firestore
    await db.collection('exercises').doc(exerciseId).set(mappedExercise);
    console.log(`✅ Imported: ${exerciseName}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to import ${exerciseDir}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting exercise import from wrkout/exercises.json...\n');
  
  const exercisesDir = path.join(__dirname, '../wrkout-exercises/exercises');
  
  try {
    // Get all exercise directories
    const entries = await fs.readdir(exercisesDir, { withFileTypes: true });
    const exerciseDirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => path.join(exercisesDir, entry.name));
    
    console.log(`Found ${exerciseDirs.length} exercises to import\n`);
    
    // Import exercises in batches
    const batchSize = 10;
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < exerciseDirs.length; i += batchSize) {
      const batch = exerciseDirs.slice(i, Math.min(i + batchSize, exerciseDirs.length));
      const results = await Promise.all(batch.map(importExercise));
      
      successCount += results.filter(r => r).length;
      failCount += results.filter(r => !r).length;
      
      console.log(`Progress: ${i + batch.length}/${exerciseDirs.length}`);
      
      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < exerciseDirs.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n📊 Import Complete!');
    console.log(`✅ Successfully imported: ${successCount} exercises`);
    console.log(`❌ Failed to import: ${failCount} exercises`);
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the import
main().catch(console.error);