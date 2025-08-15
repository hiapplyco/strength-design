#!/usr/bin/env node

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with project configuration
admin.initializeApp({
  projectId: 'strength-design',
  databaseURL: 'https://strength-design.firebaseio.com'
});

const db = admin.firestore();

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

async function importExercises() {
  const exercisesDir = path.join(__dirname, '..', 'wrkout-exercises', 'exercises');
  
  if (!fs.existsSync(exercisesDir)) {
    console.error('Exercises directory not found:', exercisesDir);
    process.exit(1);
  }
  
  const exerciseFolders = fs.readdirSync(exercisesDir)
    .filter(folder => fs.statSync(path.join(exercisesDir, folder)).isDirectory());
  
  console.log(`Found ${exerciseFolders.length} exercise folders to import`);
  
  let successCount = 0;
  let failCount = 0;
  const errors = [];
  
  // Process in batches to avoid overwhelming Firestore
  const batchSize = 100;
  
  for (let i = 0; i < exerciseFolders.length; i += batchSize) {
    const batch = db.batch();
    const currentBatch = exerciseFolders.slice(i, Math.min(i + batchSize, exerciseFolders.length));
    
    for (const folder of currentBatch) {
      try {
        const exercisePath = path.join(exercisesDir, folder, 'exercise.json');
        
        if (!fs.existsSync(exercisePath)) {
          console.log(`⚠️  No exercise.json in ${folder}`);
          continue;
        }
        
        const exerciseData = JSON.parse(fs.readFileSync(exercisePath, 'utf8'));
        
        // Create a clean ID from the folder name
        const exerciseId = folder.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        
        // Check for images in the folder
        const images = [];
        const imagesDir = path.join(exercisesDir, folder, 'images');
        if (fs.existsSync(imagesDir)) {
          const imageFiles = fs.readdirSync(imagesDir)
            .filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.gif'));
          
          // For now, store relative paths - we'll upload to Storage later
          images.push(...imageFiles.map(f => `/wrkout-exercises/exercises/${folder}/images/${f}`));
        }
        
        const mappedExercise = {
          id: exerciseId,
          name: exerciseData.name || folder.replace(/_/g, ' '),
          slug: exerciseId,
          description: exerciseData.description || '',
          introduction: exerciseData.introduction || '',
          instructions: Array.isArray(exerciseData.instructions) 
            ? exerciseData.instructions 
            : (exerciseData.instructions ? [exerciseData.instructions] : []),
          category: categoryMapping[exerciseData.category] || 'strength',
          type: exerciseData.type ? (Array.isArray(exerciseData.type) ? exerciseData.type : [exerciseData.type]) : ['strength'],
          equipment: Array.isArray(exerciseData.equipment) 
            ? exerciseData.equipment.map(e => equipmentMapping[e.toLowerCase()] || e)
            : [equipmentMapping[exerciseData.equipment?.toLowerCase()] || 'none'],
          primary_muscles: exerciseData.primaryMuscles || exerciseData.primary_muscles || [],
          secondary_muscles: exerciseData.secondaryMuscles || exerciseData.secondary_muscles || [],
          difficulty: difficultyMapping[exerciseData.level] || 'intermediate',
          mechanics_type: exerciseData.mechanic || exerciseData.mechanics || null,
          force: exerciseData.force || null,
          images: images,
          source: 'wrkout',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Add to batch
        const docRef = db.collection('exercises').doc(exerciseId);
        batch.set(docRef, mappedExercise);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Failed to process ${folder}:`, error.message);
        errors.push(`${folder}: ${error.message}`);
        failCount++;
      }
    }
    
    // Commit batch
    try {
      await batch.commit();
      console.log(`✅ Committed batch ${Math.floor(i/batchSize) + 1} (${currentBatch.length} exercises)`);
      console.log(`Progress: ${Math.min(i + batchSize, exerciseFolders.length)}/${exerciseFolders.length} exercises processed`);
    } catch (error) {
      console.error(`❌ Failed to commit batch:`, error.message);
      failCount += currentBatch.length;
      successCount -= currentBatch.length;
    }
    
    // Small delay between batches
    if (i + batchSize < exerciseFolders.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n📊 Import Complete!');
  console.log(`✅ Successfully imported: ${successCount} exercises`);
  console.log(`❌ Failed: ${failCount} exercises`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.slice(0, 10).forEach(err => console.log(`  - ${err}`));
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more errors`);
    }
  }
  
  process.exit(0);
}

importExercises().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});